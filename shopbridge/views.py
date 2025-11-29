from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status as http_status
from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView
)
from woocommerce import API
from django.core.cache import cache
from django.shortcuts import get_object_or_404
from dotenv import load_dotenv
from urllib.parse import quote
import os
import hashlib
import json
from collections import defaultdict
from pathlib import Path

from .models import (
    EmailTemplate,
    get_language_for_country,
    ShippingCountryConfig,
    ProductManual,
    normalize_sku,
)
from .serializers import (
    EmailTemplateSerializer,
    EmailTemplateRenderSerializer,
    ShippingCountryConfigSerializer,
    ProductManualSerializer
)

# Nur einmal versuchen, die .env zu laden, falls sie existiert
_ENV_LOADED = False
_SECRET_ENV_PATH = Path("/etc/secrets/woocommerce_secrets.env")
_SHOPBRIDGE_ENV_PATH = Path(__file__).parent / ".env"  # shopbridge/.env

# Cache settings
CACHE_TIMEOUT_ORDERS = 60 * 5  # 5 Minuten für Bestellübersicht
CACHE_TIMEOUT_ORDER_DETAIL = 60 * 2  # 2 Minuten für Einzelbestellung
CACHE_KEY_PREFIX = "woocommerce_"


def get_env_var(name: str) -> str:
    global _ENV_LOADED

    # 1. Direkt aus Systemumgebung
    value = os.environ.get(name)
    if value:
        return value

    # 2. Falls noch nicht geladen: Secrets-Datei in /etc/secrets/
    if not _ENV_LOADED and _SECRET_ENV_PATH.exists():
        load_dotenv(dotenv_path=_SECRET_ENV_PATH)
        _ENV_LOADED = True
        value = os.environ.get(name)
        if value:
            return value

    # 3. shopbridge/.env laden (WooCommerce Credentials)
    if not _ENV_LOADED and _SHOPBRIDGE_ENV_PATH.exists():
        load_dotenv(dotenv_path=_SHOPBRIDGE_ENV_PATH)
        _ENV_LOADED = True
        value = os.environ.get(name)
        if value:
            return value

    # 4. Lokal .env laden (nur für Entwicklung)
    if not _ENV_LOADED and Path(".env").exists():
        load_dotenv()
        _ENV_LOADED = True
        value = os.environ.get(name)
        if value:
            return value

    # 5. Wenn alles fehlschlägt
    raise RuntimeError(
        f"Environment variable '{name}' is not set"
    )


def get_wcapi():
    return API(
        url=get_env_var("WOOCOMMERCE_API_URL"),
        consumer_key=get_env_var("WOOCOMMERCE_CONSUMER_KEY"),
        consumer_secret=get_env_var("WOOCOMMERCE_CONSUMER_SECRET"),
        version="wc/v3",
        timeout=30  # Erhöhter Timeout für große Abfragen
    )


def get_cache_key(prefix: str, *args) -> str:
    """Generate a unique cache key from prefix and arguments."""
    key_data = json.dumps(args, sort_keys=True)
    key_hash = hashlib.md5(key_data.encode()).hexdigest()[:12]
    return f"{CACHE_KEY_PREFIX}{prefix}_{key_hash}"


def invalidate_orders_cache():
    """Invalidate all orders-related cache entries."""
    # Django's cache doesn't support pattern deletion easily,
    # so we use a version key approach
    version = cache.get(f"{CACHE_KEY_PREFIX}version", 0)
    cache.set(f"{CACHE_KEY_PREFIX}version", version + 1, None)


def get_cache_version():
    """Get current cache version for invalidation."""
    return cache.get(f"{CACHE_KEY_PREFIX}version", 0)


def get_product_sku_mapping():
    """
    Build a mapping from WooCommerce SKU patterns to Prodflux product IDs.
    Returns dict: {sku_pattern: (product_id, product_name)}
    """
    from products.models import Product

    # Build mapping from database artikelnummer
    mapping = {}
    for product in Product.objects.all():
        art = product.artikelnummer
        mapping[art] = (product.id, product.bezeichnung)
        # Also add with SD- prefix if not present
        if not art.startswith("SD-"):
            mapping[f"SD-{art}"] = (product.id, product.bezeichnung)

    return mapping


def get_product_stocks(product_ids: list) -> dict:
    """
    Get stock information for given product IDs across all workshops.
    Returns: {product_id: {workshop_id: stock_value, ...}, ...}
    """
    from products.models import ProductStock
    from core.models import Workshop

    if not product_ids:
        return {}

    stocks = ProductStock.objects.filter(
        product_id__in=product_ids
    ).select_related('workshop', 'product')

    # Get all workshops for reference
    workshops = {w.id: w.name for w in Workshop.objects.all()}

    result = {}
    for stock in stocks:
        pid = stock.product_id
        if pid not in result:
            result[pid] = {}
        result[pid][stock.workshop_id] = {
            'bestand': float(stock.bestand),
            'workshop_name': workshops.get(stock.workshop_id, f"Workshop {stock.workshop_id}")
        }

    return result


def map_woocommerce_to_prodflux(wc_sku, wc_name, sku_mapping):
    """
    Map a WooCommerce product to a Prodflux product.
    Returns: (product_id, product_name, matched_by)
    """
    if not wc_sku:
        return (None, wc_name, None)

    # Try exact match first
    if wc_sku in sku_mapping:
        prod_id, prod_name = sku_mapping[wc_sku]
        return (prod_id, prod_name, 'exact')

    # Try normalized SKU
    normalized = normalize_sku(wc_sku)
    if normalized and normalized in sku_mapping:
        prod_id, prod_name = sku_mapping[normalized]
        return (prod_id, prod_name, 'normalized')

    # Try without SD- prefix
    if normalized and normalized.startswith('Einrichtungsanleitungen'):
        without_prefix = normalized[3:]
        if without_prefix in sku_mapping:
            prod_id, prod_name = sku_mapping[without_prefix]
            return (prod_id, prod_name, 'no-prefix')

    # No match found
    return (None, wc_name, None)


def fetch_woocommerce_orders(statuses: list) -> tuple:
    """
    Fetch orders from WooCommerce API with caching and pagination.
    Returns (orders_list, error_response) - error_response is None if success.
    """
    cache_version = get_cache_version()
    cache_key = get_cache_key(f"orders_v{cache_version}", statuses)

    # Try to get from cache
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        return (cached_data, None)

    # Fetch from WooCommerce API with pagination
    wcapi = get_wcapi()
    all_orders = []

    for status in statuses:
        page = 1
        per_page = 100  # Maximum allowed by WooCommerce API
        
        while True:
            params = {"status": status, "per_page": per_page, "page": page}
            response = wcapi.get("orders", params=params)
            
            if response.status_code != 200:
                error = {
                    "detail": f"Fehler bei Status '{status}' (Seite {page}).",
                    "status_code": response.status_code,
                    "response": response.text
                }
                return (None, error)
            
            orders_page = response.json()
            all_orders.extend(orders_page)
            
            # Check if there are more pages
            # WooCommerce returns X-WP-TotalPages header
            total_pages = int(response.headers.get('X-WP-TotalPages', 1))
            
            if page >= total_pages:
                break
            
            page += 1

    # Store in cache
    cache.set(cache_key, all_orders, CACHE_TIMEOUT_ORDERS)

    return (all_orders, None)


def fetch_woocommerce_order_detail(order_id: int) -> tuple:
    """
    Fetch single order from WooCommerce API with caching.
    Returns (order_data, error_response) - error_response is None if success.
    """
    cache_key = get_cache_key("order_detail", order_id)

    # Try to get from cache
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        return (cached_data, None)

    # Fetch from WooCommerce API
    wcapi = get_wcapi()
    response = wcapi.get(f"orders/{order_id}")

    if response.status_code != 200:
        error = {
            "detail": f"Fehler beim Abrufen der Bestellung {order_id}.",
            "status_code": response.status_code,
            "response": response.text
        }
        return (None, error)

    order_data = response.json()

    # Store in cache
    cache.set(cache_key, order_data, CACHE_TIMEOUT_ORDER_DETAIL)

    return (order_data, None)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def woocommerce_orders_view(request):
    requested_status = request.query_params.get("status")
    force_refresh = request.query_params.get("refresh") == "true"

    # Status groups for progressive loading
    ACTIVE_STATUSES = ["processing", "pending", "on-hold"]
    COMPLETED_STATUSES = ["completed"]
    OTHER_STATUSES = ["cancelled", "refunded", "failed", "checkout-draft", "trash"]

    # Determine which statuses to fetch
    if requested_status == "all":
        statuses = ACTIVE_STATUSES + COMPLETED_STATUSES + OTHER_STATUSES
    elif requested_status == "active":
        statuses = ACTIVE_STATUSES
    elif requested_status == "completed":
        statuses = COMPLETED_STATUSES
    elif requested_status == "other":
        statuses = OTHER_STATUSES
    elif requested_status:
        statuses = [requested_status]
    else:
        statuses = ACTIVE_STATUSES

    # Invalidate cache if refresh is requested
    if force_refresh:
        invalidate_orders_cache()

    # Fetch orders (from cache or API)
    all_orders, error = fetch_woocommerce_orders(statuses)
    if error:
        return Response(error, status=error["status_code"])

    # Build SKU mapping from Prodflux products
    sku_mapping = get_product_sku_mapping()

    products_summary = defaultdict(lambda: {
        "total_quantity": 0,
        "orders": [],
        "prodflux_id": None,
        "prodflux_name": None
    })
    adapter_counter = defaultdict(int)
    total_adapter_count = 0

    for order in all_orders:
        # Extract customer info from billing
        billing = order.get("billing", {})
        first = billing.get('first_name', '')
        last = billing.get('last_name', '')
        customer_name = f"{first} {last}".strip()
        customer_country = billing.get("country", "")
        customer_city = billing.get("city", "")

        for item in order["line_items"]:
            wc_name = item["name"]
            wc_sku = item.get("sku", "")
            quantity = item["quantity"]

            # Map to Prodflux product
            prod_id, prod_name, match_type = map_woocommerce_to_prodflux(
                wc_sku, wc_name, sku_mapping
            )

            # Use Prodflux name as key if matched, otherwise WooCommerce name
            product_key = prod_name if prod_id else wc_name

            # Update product summary with customer info
            products_summary[product_key]["total_quantity"] += quantity
            products_summary[product_key]["prodflux_id"] = prod_id
            products_summary[product_key]["prodflux_name"] = prod_name
            products_summary[product_key]["orders"].append({
                "order_id": order["id"],
                "status": order["status"],
                "quantity": quantity,
                "total": order["total"],
                "currency": order["currency"],
                "customer_name": customer_name,
                "customer_country": customer_country,
                "customer_city": customer_city,
                "date_created": order.get("date_created", ""),
                "wc_product_name": wc_name,
                "wc_sku": wc_sku,
                "match_type": match_type
            })

            # Update adapter counters
            total_adapter_count += quantity
            adapter_counter[product_key] += quantity

    # Collect all prodflux_ids for stock lookup
    prodflux_ids = [
        info["prodflux_id"]
        for info in products_summary.values()
        if info["prodflux_id"] is not None
    ]

    # Get stock information for all mapped products
    product_stocks = get_product_stocks(prodflux_ids)

    # Add stock info to each product summary
    for product_key, info in products_summary.items():
        pid = info.get("prodflux_id")
        if pid and pid in product_stocks:
            info["stocks"] = product_stocks[pid]
        else:
            info["stocks"] = {}

    return Response({
        "order_count": len(all_orders),
        "adapter_count": {
            "total": total_adapter_count,
            "by_type": dict(adapter_counter)
        },
        "products": dict(products_summary),
        "cached": not force_refresh
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def woocommerce_order_detail_view(request, order_id):
    force_refresh = request.query_params.get("refresh") == "true"

    # Invalidate specific order cache if refresh requested
    if force_refresh:
        cache_key = get_cache_key("order_detail", order_id)
        cache.delete(cache_key)

    # Fetch order (from cache or API)
    order_data, error = fetch_woocommerce_order_detail(order_id)
    if error:
        return Response(error, status=error["status_code"])

    return Response(order_data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def woocommerce_order_update_view(request, order_id):
    """
    Update any field of a WooCommerce order.
    
    Supports both PUT (full update) and PATCH (partial update).
    
    Editable fields include:
    - status: Order status
    - billing: Billing address object
    - shipping: Shipping address object
    - customer_note: Customer's note
    - meta_data: Order metadata
    
    Example request body:
    {
        "billing": {
            "first_name": "Max",
            "last_name": "Mustermann",
            "company": "",
            "address_1": "Musterstraße 123",
            "address_2": "",
            "city": "Berlin",
            "state": "",
            "postcode": "12345",
            "country": "DE",
            "email": "max@example.com",
            "phone": "+49123456789"
        },
        "shipping": {
            "first_name": "Max",
            "last_name": "Mustermann",
            "company": "",
            "address_1": "Musterstraße 123",
            "address_2": "",
            "city": "Berlin",
            "state": "",
            "postcode": "12345",
            "country": "DE"
        },
        "customer_note": "Bitte als Geschenk verpacken"
    }
    """
    # Fields that can be updated via WooCommerce API
    ALLOWED_FIELDS = [
        'status',
        'billing',
        'shipping',
        'customer_note',
        'meta_data',
        'payment_method',
        'payment_method_title',
        'transaction_id',
        'set_paid',
    ]
    
    # Build update payload with only allowed fields
    update_data = {}
    for field in ALLOWED_FIELDS:
        if field in request.data:
            update_data[field] = request.data[field]
    
    if not update_data:
        return Response(
            {"error": "Keine gültigen Felder zum Aktualisieren angegeben"},
            status=http_status.HTTP_400_BAD_REQUEST
        )
    
    try:
        wcapi = get_wcapi()
        response = wcapi.put(f"orders/{order_id}", update_data)
        
        if response.status_code not in [200, 201]:
            return Response(
                {
                    "error": "Fehler beim Aktualisieren der Bestellung",
                    "status_code": response.status_code,
                    "response": response.text
                },
                status=http_status.HTTP_502_BAD_GATEWAY
            )
        
        # Invalidate caches
        cache_key = get_cache_key("order_detail", order_id)
        cache.delete(cache_key)
        invalidate_orders_cache()
        
        updated_order = response.json()
        
        return Response({
            "success": True,
            "message": "Bestellung erfolgreich aktualisiert",
            "updated_fields": list(update_data.keys()),
            "order": updated_order
        })
        
    except Exception as e:
        return Response(
            {"error": f"Fehler: {str(e)}"},
            status=http_status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def woocommerce_order_update_status_view(request, order_id):
    """
    Update the status of a WooCommerce order.
    
    Request body:
    {
        "status": "completed"  // or any valid WooCommerce status
    }
    
    Valid statuses: pending, processing, on-hold, completed, cancelled,
                    refunded, failed
    """
    VALID_STATUSES = [
        'pending', 'processing', 'on-hold', 'completed',
        'cancelled', 'refunded', 'failed'
    ]
    
    new_status = request.data.get('status')
    
    if not new_status:
        return Response(
            {"error": "Status ist erforderlich"},
            status=http_status.HTTP_400_BAD_REQUEST
        )
    
    if new_status not in VALID_STATUSES:
        return Response(
            {
                "error": f"Ungültiger Status: {new_status}",
                "valid_statuses": VALID_STATUSES
            },
            status=http_status.HTTP_400_BAD_REQUEST
        )
    
    try:
        wcapi = get_wcapi()
        response = wcapi.put(f"orders/{order_id}", {"status": new_status})
        
        if response.status_code not in [200, 201]:
            return Response(
                {
                    "error": "Fehler beim Aktualisieren des Status",
                    "status_code": response.status_code,
                    "response": response.text
                },
                status=http_status.HTTP_502_BAD_GATEWAY
            )
        
        # Invalidate caches
        cache_key = get_cache_key("order_detail", order_id)
        cache.delete(cache_key)
        invalidate_orders_cache()
        
        updated_order = response.json()
        
        return Response({
            "success": True,
            "message": f"Status erfolgreich auf '{new_status}' geändert",
            "order": updated_order
        })
        
    except Exception as e:
        return Response(
            {"error": f"Fehler: {str(e)}"},
            status=http_status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def woocommerce_cache_invalidate_view(request):
    """
    Invalidate cache and trigger background refresh.
    Returns immediately - refresh happens in background.
    """
    from .cache_scheduler import trigger_cache_refresh

    invalidate_orders_cache()
    refresh_triggered = trigger_cache_refresh()

    return Response({
        "message": "Cache invalidiert, Aktualisierung gestartet",
        "success": True,
        "background_refresh": refresh_triggered
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def woocommerce_cache_status_view(request):
    """
    Get the current cache status and scheduler info.
    Useful for frontend to show cache freshness.
    """
    from .cache_scheduler import get_scheduler

    scheduler = get_scheduler()
    cache_version = get_cache_version()

    # Check if we have cached data
    cache_key = f"{CACHE_KEY_PREFIX}order_stats_v{cache_version}"
    has_cached_stats = cache.get(cache_key) is not None

    return Response({
        "scheduler_running": scheduler._running,
        "cache_version": cache_version,
        "has_cached_data": has_cached_stats,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def woocommerce_orders_stats_view(request):
    """
    Get order statistics (counts per status) quickly.
    Uses WooCommerce reports API or cached counts.
    """
    cache_key = f"{CACHE_KEY_PREFIX}order_stats_v{get_cache_version()}"

    # Try cache first
    cached_stats = cache.get(cache_key)
    if cached_stats is not None:
        return Response(cached_stats)

    wcapi = get_wcapi()

    # Get order counts per status (all WooCommerce statuses)
    statuses = [
        "processing", "pending", "on-hold",
        "completed", "cancelled", "refunded", "failed",
        "checkout-draft", "trash"
    ]

    stats = {
        "total": 0,
        "by_status": {},
        "active": 0,
        "completed": 0,
        "other": 0
    }

    for status in statuses:
        # Use per_page=1 and read total from headers - much faster!
        response = wcapi.get("orders", params={"status": status, "per_page": 1})
        if response.status_code == 200:
            count = int(response.headers.get('X-WP-Total', 0))
            stats["by_status"][status] = count
            stats["total"] += count

            if status in ["processing", "pending", "on-hold"]:
                stats["active"] += count
            elif status == "completed":
                stats["completed"] += count
            else:
                stats["other"] += count

    # Cache for 5 minutes
    cache.set(cache_key, stats, CACHE_TIMEOUT_ORDERS)

    return Response(stats)


# =============================================================================
# Email Template Views
# =============================================================================

class EmailTemplateListCreateView(ListCreateAPIView):
    """
    GET: Liste aller Email-Templates
    POST: Neues Email-Template erstellen
    """
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by language
        language = self.request.query_params.get('language')
        if language:
            queryset = queryset.filter(language=language)

        # Filter by template_type
        template_type = self.request.query_params.get('template_type')
        if template_type:
            queryset = queryset.filter(template_type=template_type)

        # Filter active only
        active_only = self.request.query_params.get('active')
        if active_only and active_only.lower() == 'true':
            queryset = queryset.filter(is_active=True)

        return queryset


class EmailTemplateDetailView(RetrieveUpdateDestroyAPIView):
    """
    GET: Einzelnes Email-Template abrufen
    PUT/PATCH: Email-Template aktualisieren
    DELETE: Email-Template löschen
    """
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsAuthenticated]


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def email_template_render_view(request):
    """
    Rendert ein Email-Template mit dem gegebenen Kontext.
    Gibt Subject, Body und mailto-Link zurück.

    POST body:
    {
        "template_id": 1,  // oder
        "language": "de",  // mit template_type
        "template_type": "order_shipped",
        "email": "customer@example.com",
        "first_name": "Max",
        "last_name": "Mustermann",
        "order_number": "12345",
        "tracking_link": "https://...",
        "company_name": "Firma GmbH"
    }
    """
    serializer = EmailTemplateRenderSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=http_status.HTTP_400_BAD_REQUEST
        )

    data = serializer.validated_data

    # Template finden
    template = None
    if data.get('template_id'):
        template = get_object_or_404(EmailTemplate, id=data['template_id'])
    else:
        # Nach Sprache und Typ suchen (bevorzugt Default-Template)
        language = data.get('language', 'en')
        template_type = data.get('template_type', 'order_shipped')

        template = EmailTemplate.objects.filter(
            language=language,
            template_type=template_type,
            is_active=True,
            is_default=True
        ).first()

        if not template:
            # Fallback: irgendein aktives Template dieser Sprache/Typ
            template = EmailTemplate.objects.filter(
                language=language,
                template_type=template_type,
                is_active=True
            ).first()

        if not template:
            # Fallback: englisches Template
            template = EmailTemplate.objects.filter(
                language='en',
                template_type=template_type,
                is_active=True
            ).first()

        if not template:
            return Response(
                {"error": f"Kein Template für {language}/{template_type}"},
                status=http_status.HTTP_404_NOT_FOUND
            )

    # Kontext für Platzhalter erstellen
    context = {
        'first_name': data.get('first_name', ''),
        'last_name': data.get('last_name', ''),
        'order_number': data.get('order_number', ''),
        'tracking_link': data.get('tracking_link', ''),
        'company_name': data.get('company_name', ''),
    }

    # Template rendern
    rendered_subject = template.render_subject(context)
    rendered_body = template.render_body(context)

    # mailto-Link erstellen mit optionalem BCC
    from django.conf import settings
    email = data['email']
    
    # BCC-Adressen aus Settings
    bcc_str = settings.EMAIL_BCC_ADDRESSES or ''
    bcc_list = [addr.strip() for addr in bcc_str.split(',') if addr.strip()]
    
    mailto_parts = [
        f"mailto:{email}",
        f"?subject={quote(rendered_subject)}",
        f"&body={quote(rendered_body)}"
    ]
    
    if bcc_list:
        mailto_parts.append(f"&bcc={quote(','.join(bcc_list))}")
    
    mailto_link = ''.join(mailto_parts)

    return Response({
        'template_id': template.id,
        'template_name': template.name,
        'language': template.language,
        'language_display': template.get_language_display(),
        'subject': rendered_subject,
        'body': rendered_body,
        'email': email,
        'bcc_addresses': bcc_list,
        'mailto_link': mailto_link,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def email_template_placeholders_view(request):
    """Gibt die verfügbaren Platzhalter zurück."""
    return Response({
        'placeholders': EmailTemplate.get_available_placeholders()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def email_template_languages_view(request):
    """Gibt die verfügbaren Sprachen zurück."""
    return Response({
        'languages': EmailTemplate.LANGUAGE_CHOICES,
        'template_types': EmailTemplate.TEMPLATE_TYPE_CHOICES
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_language_for_country_view(request):
    """
    Ermittelt die empfohlene Sprache für ein Land.
    Query param: country (z.B. "DE", "US", "FR")
    """
    country = request.query_params.get('country', '')
    if not country:
        return Response(
            {"error": "Parameter 'country' fehlt"},
            status=http_status.HTTP_400_BAD_REQUEST
        )

    language = get_language_for_country(country)
    return Response({
        'country': country.upper(),
        'language': language
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def email_sender_config_view(request):
    """
    Gibt die Absender-Konfiguration für E-Mails zurück.
    Die sensiblen Daten kommen aus den Umgebungsvariablen.
    """
    from django.conf import settings
    
    # BCC-Adressen als Liste aufbereiten
    bcc_str = settings.EMAIL_BCC_ADDRESSES or ''
    bcc_list = [addr.strip() for addr in bcc_str.split(',') if addr.strip()]
    
    return Response({
        'sender_name': settings.EMAIL_SENDER_NAME,
        'sender_email': settings.EMAIL_SENDER_EMAIL,
        'sender_phone': settings.EMAIL_SENDER_PHONE,
        'company_name': settings.EMAIL_COMPANY_NAME,
        'bcc_addresses': bcc_list,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sales_excel_config_view(request):
    """
    Gibt die URL zur Verkaufs-Excel-Tabelle zurück.
    """
    from django.conf import settings
    return Response({
        'excel_url': settings.SALES_EXCEL_URL,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def order_serial_numbers_create_view(request):
    """
    Speichert Seriennummern für eine Bestellung.
    Body: {
        "order_id": 12345,
        "order_number": "12345",
        "serial_numbers": ["SN-001", "SN-002"]
    }
    """
    from .models import OrderSerialNumber

    order_id = request.data.get('order_id')
    order_number = request.data.get('order_number')
    serial_numbers = request.data.get('serial_numbers', [])

    if not order_id or not order_number:
        return Response(
            {"error": "order_id und order_number sind erforderlich"},
            status=http_status.HTTP_400_BAD_REQUEST
        )

    if not serial_numbers:
        return Response(
            {"error": "Mindestens eine Seriennummer erforderlich"},
            status=http_status.HTTP_400_BAD_REQUEST
        )

    created = []
    for sn in serial_numbers:
        if sn.strip():
            obj = OrderSerialNumber.objects.create(
                woocommerce_order_id=order_id,
                woocommerce_order_number=str(order_number),
                serial_number=sn.strip()
            )
            created.append({
                'id': obj.id,
                'serial_number': obj.serial_number
            })

    return Response({
        'success': True,
        'message': f'{len(created)} Seriennummer(n) gespeichert',
        'created': created
    }, status=http_status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_serial_numbers_list_view(request, order_id):
    """
    Gibt alle Seriennummern für eine Bestellung zurück.
    """
    from .models import OrderSerialNumber

    serial_numbers = OrderSerialNumber.objects.filter(
        woocommerce_order_id=order_id
    ).order_by('created_at')

    return Response({
        'order_id': order_id,
        'serial_numbers': [
            {
                'id': sn.id,
                'serial_number': sn.serial_number,
                'created_at': sn.created_at.isoformat()
            }
            for sn in serial_numbers
        ]
    })


# =============================================================================
# Shipping Country Config Views
# =============================================================================

class ShippingCountryConfigListView(ListCreateAPIView):
    """
    Liste aller Versandkonfigurationen oder neue erstellen.
    
    GET: Alle Konfigurationen abrufen
    POST: Neue Konfiguration erstellen
    """
    queryset = ShippingCountryConfig.objects.all()
    serializer_class = ShippingCountryConfigSerializer
    permission_classes = [IsAuthenticated]


class ShippingCountryConfigDetailView(RetrieveUpdateDestroyAPIView):
    """
    Einzelne Versandkonfiguration abrufen, aktualisieren oder löschen.
    """
    queryset = ShippingCountryConfig.objects.all()
    serializer_class = ShippingCountryConfigSerializer
    permission_classes = [IsAuthenticated]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shipping_config_for_country(request, country_code):
    """
    Holt die Versandkonfiguration für ein bestimmtes Land.
    
    Gibt zurück:
    - shipping_type: 'dhl_product' oder 'external_link'
    - Für dhl_product: dhl_product code
    - Für external_link: URL und Label
    """
    config = ShippingCountryConfig.get_config_for_country(country_code)
    
    if not config:
        # Fallback: Standard-Konfiguration basierend auf Zielland
        is_domestic = country_code.upper() == 'DE'
        return Response({
            'country_code': country_code.upper(),
            'country_name': country_code.upper(),
            'shipping_type': 'dhl_product',
            'dhl_product': 'V62KP' if is_domestic else 'V66WPI',
            'dhl_product_name': 'DHL Kleinpaket' if is_domestic else 'Warenpost International',
            'is_configured': False,
            'available_products': (
                ['V62KP', 'V01PAK'] if is_domestic 
                else ['V66WPI', 'V53WPAK', 'V54EPAK']
            )
        })
    
    response_data = {
        'country_code': config.country_code,
        'country_name': config.country_name,
        'shipping_type': config.shipping_type,
        'is_configured': True
    }
    
    if config.shipping_type == 'dhl_product':
        response_data['dhl_product'] = config.dhl_product
        response_data['dhl_product_name'] = config.get_dhl_product_display()
    else:
        response_data['external_link'] = config.external_link
        response_data['external_link_label'] = config.external_link_label
    
    return Response(response_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shipping_config_defaults(request):
    """
    Gibt die verfügbaren Optionen für die Konfiguration zurück.
    """
    return Response({
        'shipping_types': [
            {'code': 'dhl_product', 'name': 'DHL Produkt (Label erstellen)'},
            {'code': 'external_link', 'name': 'Externer Link (manuell)'},
        ],
        'dhl_products': [
            # National (nur Deutschland)
            {'code': 'V62KP', 'name': 'DHL Kleinpaket', 'type': 'national'},
            {'code': 'V01PAK', 'name': 'DHL Paket', 'type': 'national'},
            # International
            {'code': 'V66WPI', 'name': 'Warenpost International', 'type': 'international'},
            {'code': 'V53WPAK', 'name': 'DHL Paket International', 'type': 'international'},
            {'code': 'V54EPAK', 'name': 'DHL Europaket', 'type': 'eu'},
        ],
        'default_countries': [
            {'code': 'DE', 'name': 'Deutschland'},
            {'code': 'AT', 'name': 'Österreich'},
            {'code': 'CH', 'name': 'Schweiz'},
            {'code': 'BE', 'name': 'Belgien'},
            {'code': 'CZ', 'name': 'Tschechien'},
            {'code': 'DK', 'name': 'Dänemark'},
            {'code': 'ES', 'name': 'Spanien'},
            {'code': 'FR', 'name': 'Frankreich'},
            {'code': 'GB', 'name': 'Großbritannien'},
            {'code': 'IT', 'name': 'Italien'},
            {'code': 'LU', 'name': 'Luxemburg'},
            {'code': 'NL', 'name': 'Niederlande'},
            {'code': 'PL', 'name': 'Polen'},
            {'code': 'SE', 'name': 'Schweden'},
        ],
        'default_external_link': 'https://www.dhl.de/de/privatkunden.html'
    })


# =============================================================================
# Product Manuals Views
# =============================================================================

class ProductManualListCreateView(ListCreateAPIView):
    """
    Liste aller Produkthandbücher oder neues Handbuch erstellen.
    
    GET: Alle Handbücher abrufen (optional gefiltert nach Produkt/Sprache)
    POST: Neues Handbuch erstellen
    """
    queryset = ProductManual.objects.all()
    serializer_class = ProductManualSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Optionale Filter
        product = self.request.query_params.get('product')
        language = self.request.query_params.get('language')
        manual_type = self.request.query_params.get('type')
        active_only = self.request.query_params.get('active', 'true')
        
        if product:
            queryset = queryset.filter(product_identifier__icontains=product)
        if language:
            queryset = queryset.filter(language=language)
        if manual_type:
            queryset = queryset.filter(manual_type=manual_type)
        if active_only.lower() == 'true':
            queryset = queryset.filter(is_active=True)
        
        return queryset


class ProductManualDetailView(RetrieveUpdateDestroyAPIView):
    """
    Einzelnes Produkthandbuch abrufen, aktualisieren oder löschen.
    """
    queryset = ProductManual.objects.all()
    serializer_class = ProductManualSerializer
    permission_classes = [IsAuthenticated]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def product_manuals_for_order(request, order_id):
    """
    Holt alle relevanten Handbücher für eine Bestellung.
    
    Ermittelt basierend auf den Produkten in der Bestellung und dem
    Zielland die passenden Anleitungen.
    """
    # WooCommerce Order laden
    order_data, error = fetch_woocommerce_order_detail(order_id)
    if error:
        return Response(
            {'error': 'Bestellung nicht gefunden'},
            status=http_status.HTTP_404_NOT_FOUND
        )
    
    # Produkt-Identifiers aus Line Items extrahieren
    product_identifiers = []
    for item in order_data.get('line_items', []):
        # SKU oder Produktname verwenden
        if item.get('sku'):
            product_identifiers.append(item['sku'])
        if item.get('name'):
            product_identifiers.append(item['name'])
    
    # Zielland aus Versandadresse
    country_code = order_data.get('shipping', {}).get('country', 'DE')
    
    # Handbücher abrufen
    manuals = ProductManual.get_manuals_for_order(
        product_identifiers,
        country_code
    )
    
    serializer = ProductManualSerializer(manuals, many=True)
    
    return Response({
        'order_id': order_id,
        'country_code': country_code,
        'language': get_language_for_country(country_code),
        'product_identifiers': list(set(product_identifiers)),
        'manuals': serializer.data,
        'manual_count': len(manuals)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def product_manual_defaults(request):
    """
    Gibt die verfügbaren Optionen für Handbücher zurück.
    """
    return Response({
        'languages': [
            {'code': 'de', 'name': 'Deutsch'},
            {'code': 'en', 'name': 'English'},
            {'code': 'fr', 'name': 'Français'},
            {'code': 'es', 'name': 'Español'},
        ],
        'manual_types': [
            {'code': 'installation', 'name': 'Installationsanleitung'},
            {'code': 'configuration', 'name': 'Einrichtungsanleitung'},
            {'code': 'quickstart', 'name': 'Schnellstartanleitung'},
            {'code': 'other', 'name': 'Sonstiges'},
        ],
        'common_products': [
            'SD-KRT2',
            'SD-KRT2-A',
            'SD-KRT2-DS',
            'SD-AR620X',
            'SD-AR620X-NG',
            'SD-ATR833',
            'SD-ATR833-A',
            'SD-ATR833-DS',
            'SD-GENERIC',
            'SD-GENERIC-DS',
            'SD-TY9X',
            'SD-TY96/TY97-DS',
            'SD-AV-30-E',
        ]
    })
