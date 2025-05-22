from woocommerce import API
from dotenv import load_dotenv
import os
from collections import defaultdict

# .env im aktuellen Verzeichnis laden
load_dotenv()

# Umgebungsvariablen auslesen
url = os.getenv("WOOCOMMERCE_API_URL")
consumer_key = os.getenv("WOOCOMMERCE_CONSUMER_KEY")
consumer_secret = os.getenv("WOOCOMMERCE_CONSUMER_SECRET")

if not url or not consumer_key or not consumer_secret:
    raise RuntimeError("Fehlende Umgebungsvariablen! Bitte prüfe deine .env-Datei.")

# WooCommerce API Client initialisieren
wcapi = API(
    url=url,
    consumer_key=consumer_key,
    consumer_secret=consumer_secret,
    version="wc/v3"
)

# Bestellungen mit Status "processing" abrufen
response = wcapi.get("orders", params={"status": "processing"})

if response.status_code != 200:
    print(f"Fehler beim Abrufen der Bestellungen: {response.status_code}")
    print(response.text)
    exit()

orders = response.json()

# Produkte gruppieren: name → {gesamtmenge, liste bestellungen}
products_summary = defaultdict(lambda: {"total_quantity": 0, "orders": []})

for order in orders:
    for item in order["line_items"]:
        product_name = item["name"]
        quantity = item["quantity"]
        products_summary[product_name]["total_quantity"] += quantity
        products_summary[product_name]["orders"].append({
            "order_id": order["id"],
            "quantity": quantity,
            "total": order["total"],
            "currency": order["currency"]
        })

# Ausgabe
print(f"{len(orders)} Bestellungen im Status 'processing' gefunden.\n")
print("Produkte gruppiert nach Name:\n")

for product_name, data in products_summary.items():
    print(f"{product_name}: Gesamtmenge {data['total_quantity']}")
    for o in data["orders"]:
        print(f"  - Bestellung #{o['order_id']} ({o['quantity']} Stück, {o['total']} {o['currency']})")
    print("-" * 40)