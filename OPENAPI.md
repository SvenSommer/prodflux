# Prodflux OpenAPI Dokumentation

## Übersicht

Die Prodflux API stellt eine vollständige OpenAPI 3.0 Spezifikation bereit, die alle verfügbaren Endpunkte, Modelle und Authentifizierungsmethoden dokumentiert.

## Zugriff auf die API-Dokumentation

Nach dem Start des Entwicklungsservers stehen folgende Dokumentations-Endpunkte zur Verfügung:

### 🔵 Swagger UI (Interaktiv)
**URL:** http://localhost:8000/api/docs/

Die Swagger UI bietet eine interaktive Dokumentation, mit der Sie:
- Alle API-Endpunkte durchsuchen können
- API-Anfragen direkt im Browser testen können
- Authentifizierung mit JWT-Token durchführen können
- Request- und Response-Schemas einsehen können

### 📘 ReDoc (Lesbar)
**URL:** http://localhost:8000/api/redoc/

ReDoc bietet eine übersichtliche, lesbare Dokumentation mit **integriertem Login-Panel** 🆕:
- Linke Spalte: Navigation durch alle Endpunkte
- Mittlere Spalte: Detaillierte Beschreibungen
- Rechte Spalte: Code-Beispiele und Schemas
- Login-Panel: Token-Generierung und Anzeige für manuelle Verwendung

### 📄 OpenAPI Schema (JSON/YAML)
**URL:** http://localhost:8000/api/schema/

Das rohe OpenAPI 3.0 Schema zum Download oder zur Integration in andere Tools:
- `http://localhost:8000/api/schema/?format=json` - JSON Format
- `http://localhost:8000/api/schema/?format=yaml` - YAML Format

## Authentifizierung in der Dokumentation

### Swagger UI - Quick Login (Empfohlen) 🆕

Die Swagger UI verfügt jetzt über ein **integriertes Login-Panel** (rechts oben), das automatisch den JWT-Token setzt:

1. Öffnen Sie http://localhost:8000/api/docs/
2. Nutzen Sie das **"🔐 Quick Login"** Panel rechts oben
3. Geben Sie Username und Password ein
4. Klicken Sie auf **"Login & Authorize"**
5. Der Token wird automatisch gesetzt und in allen API-Requests verwendet! ✨

**Features:**
- ✅ Automatische Token-Verwaltung
- ✅ Token bleibt über Browser-Neustarts erhalten (localStorage)
- ✅ Sichtbare Anzeige des angemeldeten Benutzers
- ✅ Logout-Funktion zum Löschen des Tokens
- ✅ Enter-Taste zum schnellen Login

### Swagger UI - Manuelle Autorisierung (Alternative)

Falls Sie den Token manuell eingeben möchten:

1. Öffnen Sie http://localhost:8000/api/docs/
2. Klicken Sie auf "Authorize" (Schloss-Symbol rechts oben)
3. Geben Sie Ihren JWT-Token ein:
   - Mit Präfix: `Bearer <token>`
   - Oder nur: `<token>` (ohne "Bearer")
4. Klicken Sie auf "Authorize"
5. Klicken Sie auf "Close"

Der Token wird dann automatisch in allen API-Anfragen mitgesendet.

### Token erhalten

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your-username", "password": "your-password"}'

# Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

Verwenden Sie den `access` Token für die API-Authentifizierung.

## API-Struktur

### Core (Basismodule)
- **Workshops:** Verwaltung von Werkstätten
- **Authentication:** JWT-basierte Benutzerauthentifizierung

### Materials (Materialverwaltung)
- **Materials:** Materialstammdaten
- **Material Categories:** Materialkategorien
- **Material Movements:** Lagerbewegungen (Lieferung, Verbrauch, Transfer)
- **Material Transfers:** Transfers zwischen Werkstätten
- **Orders:** Bestellungen
- **Deliveries:** Lieferungen

### Products (Produktverwaltung)
- **Products:** Produktstammdaten
- **Product Versions:** Versionsverwaltung
- **Product Variants:** Produktvarianten
- **Product Materials:** Stückliste (Bill of Materials)
- **Product Stock:** Produktbestand pro Werkstatt
- **Manufacturing:** Fertigungsanforderungen und -prozesse

### Shopbridge (E-Commerce Integration)
- **WooCommerce Orders:** Integration mit WooCommerce-Shop

## Hauptendpunkte

### Authentifizierung
```
POST   /api/auth/login/          # JWT Token erhalten
POST   /api/auth/refresh/        # Token aktualisieren
GET    /api/auth/me/             # Eigenes Profil
```

### Materialien
```
GET    /api/materials/                                  # Alle Materialien
POST   /api/materials/                                  # Neues Material
GET    /api/materials/{id}/                             # Material Details
PUT    /api/materials/{id}/                             # Material aktualisieren
DELETE /api/materials/{id}/                             # Material löschen
GET    /api/materials/{id}/movements/                   # Lagerbewegungen
GET    /api/materials/{id}/stock                        # Lagerbestand
POST   /api/materials/{id}/inventory-correction/        # Inventurkorrektur
GET    /api/materials/{id}/alternatives/                # Alternative Materialien
```

### Produkte
```
GET    /api/products/                                   # Alle Produkte
POST   /api/products/                                   # Neues Produkt
GET    /api/products/{id}/                              # Produkt Details
GET    /api/products/{id}/requirements/                 # Materialanforderungen
GET    /api/products/{id}/stock                         # Produktbestand
GET    /api/products/{id}/producible                    # Produzierbare Einheiten
POST   /api/manufacture/                                # Produkt fertigen
```

### Werkstätten
```
GET    /api/workshops/                                  # Alle Werkstätten
POST   /api/workshops/                                  # Neue Werkstatt
GET    /api/workshops/{id}/                             # Werkstatt Details
GET    /api/workshops/{id}/material-stock/              # Materialbestand
GET    /api/workshops/{id}/products/overview/           # Produktübersicht
```

## Modelle

Die API verwendet folgende Hauptmodelle:

### Material
- ID, Name, Beschreibung
- Einheit, Kategorie
- Bild, Alternativen
- Workshop-Beziehung

### MaterialMovement
- Bewegungstyp (Lieferung, Verbrauch, Transfer, etc.)
- Menge, Material
- Quell-/Zielobjekt (Generic Foreign Key)
- Zeitstempel

### Product
- Name, Beschreibung, SKU
- Version, Variante
- Stückliste (ProductMaterial)
- Workshop-Bestand

### Workshop
- Name, Standort
- Zugeordnete Benutzer

## Datenmodell-Beziehungen

```
Workshop
  ├─> User (1:n)
  ├─> Material (1:n)
  ├─> Product (1:n)
  └─> ProductStock (1:n)

Material
  ├─> MaterialCategory (n:1)
  ├─> MaterialMovement (1:n)
  └─> Material (n:n) [alternatives]

Product
  ├─> ProductVersion (n:1)
  ├─> ProductVariant (n:n)
  ├─> ProductMaterial (1:n) [BOM]
  └─> ProductStock (1:n)
```

## OpenAPI-Schema exportieren

### Als JSON
```bash
curl http://localhost:8000/api/schema/?format=json > openapi.json
```

### Als YAML
```bash
curl http://localhost:8000/api/schema/?format=yaml > openapi.yaml
```

## Integration mit Tools

Das OpenAPI-Schema kann mit verschiedenen Tools verwendet werden:

### Postman
1. Importieren Sie das Schema über: File → Import → Link
2. URL: `http://localhost:8000/api/schema/?format=json`

### Insomnia
1. Importieren Sie das Schema über: Application → Preferences → Data → Import Data
2. URL: `http://localhost:8000/api/schema/?format=json`

### Code-Generierung
```bash
# OpenAPI Generator verwenden
npm install -g @openapitools/openapi-generator-cli

# TypeScript Client generieren
openapi-generator-cli generate \
  -i http://localhost:8000/api/schema/?format=json \
  -g typescript-axios \
  -o ./generated-client
```

## Entwicklung

### Schema aktualisieren

Das Schema wird automatisch aus den Django REST Framework Views und Serializers generiert. Änderungen an:
- Models
- Serializers
- Views
- URL-Patterns

werden automatisch in der OpenAPI-Dokumentation reflektiert.

### Custom Schema-Anpassungen

Verwenden Sie `@extend_schema` Decorator für erweiterte Dokumentation:

```python
from drf_spectacular.utils import extend_schema, OpenApiParameter

@extend_schema(
    summary="Materialbestand abrufen",
    description="Gibt den aktuellen Lagerbestand eines Materials zurück",
    parameters=[
        OpenApiParameter(
            name='workshop_id',
            type=int,
            description='ID der Werkstatt',
        ),
    ],
)
def material_stock_view(request, material_id):
    # ...
```

## Produktions-URLs

In der Produktionsumgebung (Render.com) sind die Endpunkte unter:

```
https://your-domain.com/api/docs/      # Swagger UI
https://your-domain.com/api/redoc/     # ReDoc
https://your-domain.com/api/schema/    # OpenAPI Schema
```

## Support

Bei Fragen oder Problemen mit der API-Dokumentation:
1. Überprüfen Sie die detaillierte Fehlermeldung in der Response
2. Stellen Sie sicher, dass Sie authentifiziert sind (JWT Token)
3. Überprüfen Sie die Workshop-ID in Ihren Anfragen
4. Konsultieren Sie die Swagger UI für Request/Response-Beispiele
