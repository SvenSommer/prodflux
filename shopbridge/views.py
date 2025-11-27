from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from woocommerce import API
from django.core.cache import cache
from dotenv import load_dotenv
import os
import re
import hashlib
import json
from collections import defaultdict
from pathlib import Path

# Nur einmal versuchen, die .env zu laden, falls sie existiert
_ENV_LOADED = False
_SECRET_ENV_PATH = Path("/etc/secrets/woocommerce_secrets.env")

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

    # 3. Lokal .env laden (nur für Entwicklung)
    if not _ENV_LOADED and Path(".env").exists():
        load_dotenv()
        _ENV_LOADED = True
        value = os.environ.get(name)
        if value:
            return value

    # 4. Wenn alles fehlschlägt
    raise RuntimeError(
        f"Environment variable '{name}' is not set"
    )


def get_wcapi():
    return API(
        url=get_env_var("WOOCOMMERCE_API_URL"),
        consumer_key=get_env_var("WOOCOMMERCE_CONSUMER_KEY"),
        consumer_secret=get_env_var("WOOCOMMERCE_CONSUMER_SECRET"),
        version="wc/v3"
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


def normalize_sku(sku):
    """
    Normalize WooCommerce SKU to match Prodflux artikelnummer.
    Handles variants like -LEFT, -RIGHT, -1, -2, -3, etc.
    """
    if not sku:
        return None

    # Remove variant suffixes: -LEFT, -RIGHT, -1, -2, -3, -SL, etc.
    normalized = re.sub(r'-(LEFT|RIGHT|[0-9]+|SL)$', '', sku.upper())

    # Fix underscore to hyphen
    normalized = normalized.replace('_', '-')

    # Handle special cases
    # SD-AR620X-E-NG -> SD-AR620X-NG
    normalized = normalized.replace('-E-NG', '-NG')
    # SD-GENERIC-E-DS -> SD-GENERIC-DS
    normalized = normalized.replace('-E-DS', '-DS')

    return normalized


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
    if normalized and normalized.startswith('SD-'):
        without_prefix = normalized[3:]
        if without_prefix in sku_mapping:
            prod_id, prod_name = sku_mapping[without_prefix]
            return (prod_id, prod_name, 'no-prefix')

    # No match found
    return (None, wc_name, None)


def fetch_woocommerce_orders(statuses: list) -> tuple:
    """
    Fetch orders from WooCommerce API with caching.
    Returns (orders_list, error_response) - error_response is None if success.
    """
    cache_version = get_cache_version()
    cache_key = get_cache_key(f"orders_v{cache_version}", statuses)

    # Try to get from cache
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        return (cached_data, None)

    # Fetch from WooCommerce API
    wcapi = get_wcapi()
    all_orders = []

    for status in statuses:
        params = {"status": status, "per_page": 100}
        response = wcapi.get("orders", params=params)
        if response.status_code != 200:
            error = {
                "detail": f"Fehler bei Status '{status}'.",
                "status_code": response.status_code,
                "response": response.text
            }
            return (None, error)
        all_orders.extend(response.json())

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

    # If "all" is passed, fetch all common statuses
    if requested_status == "all":
        statuses = [
            "processing", "pending", "on-hold",
            "completed", "cancelled", "refunded", "failed"
        ]
    elif requested_status:
        statuses = [requested_status]
    else:
        statuses = ["processing", "pending"]

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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def woocommerce_cache_invalidate_view(request):
    """Invalidate all WooCommerce cache entries."""
    invalidate_orders_cache()
    return Response({"message": "Cache invalidiert", "success": True})
