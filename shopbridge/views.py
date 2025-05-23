from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from woocommerce import API
from dotenv import load_dotenv
import os
from collections import defaultdict
from pathlib import Path

# Nur einmal versuchen, die .env zu laden, falls sie existiert
_ENV_LOADED = False
_SECRET_ENV_PATH = Path("/etc/secrets/woocommerce_secrets.env")

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
    raise RuntimeError(f"Environment variable '{name}' is not set (env, /etc/secrets/woocommerce_secrets.env or local .env)")

def get_wcapi():
    return API(
        url=get_env_var("WOOCOMMERCE_API_URL"),
        consumer_key=get_env_var("WOOCOMMERCE_CONSUMER_KEY"),
        consumer_secret=get_env_var("WOOCOMMERCE_CONSUMER_SECRET"),
        version="wc/v3"
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def woocommerce_orders_view(request):
    wcapi = get_wcapi()

    requested_status = request.query_params.get("status")
    statuses = [requested_status] if requested_status else ["processing", "pending"]

    all_orders = []

    for status in statuses:
        response = wcapi.get("orders", params={"status": status, "per_page": 100})
        if response.status_code != 200:
            return Response({
                "detail": f"Fehler beim Abrufen der Bestellungen mit Status '{status}'.",
                "status_code": response.status_code,
                "response": response.text
            }, status=response.status_code)
        all_orders.extend(response.json())

    products_summary = defaultdict(lambda: {"total_quantity": 0, "orders": []})
    adapter_counter = defaultdict(int)
    total_adapter_count = 0

    for order in all_orders:
        for item in order["line_items"]:
            product_name = item["name"]
            quantity = item["quantity"]

            # Update product summary
            products_summary[product_name]["total_quantity"] += quantity
            products_summary[product_name]["orders"].append({
                "order_id": order["id"],
                "status": order["status"],
                "quantity": quantity,
                "total": order["total"],
                "currency": order["currency"]
            })

            # Update adapter counters
            total_adapter_count += quantity
            adapter_counter[product_name] += quantity

    return Response({
        "order_count": len(all_orders),
        "adapter_count": {
            "total": total_adapter_count,
            "by_type": adapter_counter
        },
        "products": products_summary
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def woocommerce_order_detail_view(request, order_id):
    wcapi = get_wcapi()
    response = wcapi.get(f"orders/{order_id}")

    if response.status_code != 200:
        return Response({
            "detail": f"Fehler beim Abrufen der Bestellung {order_id}.",
            "status_code": response.status_code,
            "response": response.text
        }, status=response.status_code)

    return Response(response.json())