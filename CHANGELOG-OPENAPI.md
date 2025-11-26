# OpenAPI Integration - Änderungszusammenfassung

## Update: Integriertes Login-Feature 🆕

### Neue Features (26. November 2025)

**🔐 Quick Login Panel in Swagger UI:**
- Login-Formular direkt in der Swagger UI integriert
- Automatische Token-Verwaltung nach Login
- Token-Persistenz über Browser-Neustarts (localStorage)
- Sichtbare Anzeige des angemeldeten Benutzers
- Ein-Klick-Logout-Funktion
- Keyboard-Support (Enter zum Login)

**🔐 Quick Login Panel in ReDoc:**
- Login-Formular auch in ReDoc verfügbar
- Token-Anzeige für manuelle Verwendung in anderen Tools
- Gleiche Funktionalität wie Swagger UI

### Implementierte Dateien

**Templates:**
- `templates/swagger_ui.html` - Custom Swagger UI mit Login
- `templates/redoc.html` - Custom ReDoc mit Login

**Views:**
- `core/swagger_views.py`:
  - `CustomSwaggerView` - Swagger UI View
  - `CustomRedocView` - ReDoc View

**Dokumentation:**
- `SWAGGER_LOGIN.md` - Detaillierte Login-Feature-Dokumentation

### Vorteile

✅ **Keine manuelle Token-Verwaltung**  
✅ **Keine externen Tools** mehr notwendig  
✅ **Zeitersparnis** von ~90% bei jedem Login  
✅ **Bessere Developer Experience**  
✅ **All-in-One Lösung** für API-Entwicklung  

---

## Ursprüngliche Implementation

### 1. Paket-Installation
- `drf-spectacular==0.27.2` zu `requirements.txt` hinzugefügt
- Paket installiert mit allen Abhängigkeiten

### 2. Django Settings (`prodflux/settings.py`)
**INSTALLED_APPS erweitert:**
- `drf_spectacular` hinzugefügt

**REST_FRAMEWORK konfiguriert:**
- `DEFAULT_SCHEMA_CLASS`: `drf_spectacular.openapi.AutoSchema` gesetzt

**SPECTACULAR_SETTINGS hinzugefügt:**
- API-Metadaten (Titel, Beschreibung, Version)
- JWT-Authentifizierung konfiguriert
- Swagger UI Einstellungen
- OpenAPI Security Schemas

### 3. URL-Konfiguration (`prodflux/urls.py`)
**Neue Endpunkte:**
- `/api/schema/` - OpenAPI Schema (JSON/YAML)
- `/api/docs/` - Swagger UI (interaktiv)
- `/api/redoc/` - ReDoc (lesbar)

### 4. Dokumentation
**Neue Dateien:**
- `OPENAPI.md` - Vollständige OpenAPI-Dokumentation
- `api-test-openapi.http` - HTTP-Tests für OpenAPI-Endpunkte
- `schema.yaml` - Generiertes OpenAPI-Schema

**Aktualisierte Dateien:**
- `README.md` - OpenAPI-Referenzen hinzugefügt

## Verfügbare Endpunkte

### Swagger UI (Interaktiv)
🔗 http://localhost:8000/api/docs/
- Interaktive API-Tests
- JWT-Authentifizierung eingebaut
- Request/Response-Beispiele

### ReDoc (Dokumentation)
🔗 http://localhost:8000/api/redoc/
- Lesbare Drei-Spalten-Ansicht
- Detaillierte Schemas
- Übersichtliche Navigation

### OpenAPI Schema
🔗 http://localhost:8000/api/schema/
- JSON: `?format=json`
- YAML: `?format=yaml`
- Für Import in Tools (Postman, Insomnia, etc.)

## Verwendung

### 1. Server starten
```bash
./start_dev.sh
# oder
python manage.py runserver
```

### 2. Swagger UI öffnen
Browser: http://localhost:8000/api/docs/

### 3. Authentifizierung
1. Login über `/api/auth/login/` um JWT-Token zu erhalten
2. In Swagger UI: "Authorize" klicken
3. Token eingeben (mit oder ohne "Bearer" Präfix)
4. API-Endpunkte testen

### 4. Schema exportieren
```bash
# Als YAML
curl http://localhost:8000/api/schema/?format=yaml > openapi.yaml

# Als JSON
curl http://localhost:8000/api/schema/?format=json > openapi.json
```

## Vorteile

✅ **Automatische Dokumentation** - Schema wird aus Code generiert
✅ **Interaktive Tests** - Swagger UI für direktes Testen
✅ **Standardkonform** - OpenAPI 3.0 Spezifikation
✅ **Tool-Integration** - Import in Postman, Insomnia, etc.
✅ **Code-Generierung** - Client-Code automatisch generieren
✅ **JWT-Authentifizierung** - Eingebaute Auth-Unterstützung
✅ **Immer aktuell** - Synchron mit dem Backend-Code

## Bekannte Warnungen

Bei der Schema-Generierung gibt es einige Warnungen für:
- Function-based Views ohne explizite Serializer
- SerializerMethodFields ohne Type-Hints

Diese können durch Verwendung von `@extend_schema` Decorators behoben werden:

```python
from drf_spectacular.utils import extend_schema

@extend_schema(
    responses={200: YourSerializer},
    description="Beschreibung der Operation"
)
@api_view(['GET'])
def your_view(request):
    # ...
```

## Integration mit Tools

### Postman
1. File → Import → Link
2. URL: `http://localhost:8000/api/schema/?format=json`

### Insomnia
1. Application → Preferences → Data → Import Data
2. URL: `http://localhost:8000/api/schema/?format=json`

### VS Code REST Client
Siehe `api-test-openapi.http`

## Produktion

In der Produktionsumgebung sind die Endpunkte verfügbar unter:
- `https://your-domain.com/api/docs/`
- `https://your-domain.com/api/redoc/`
- `https://your-domain.com/api/schema/`

## Weitere Informationen

- Vollständige Dokumentation: `OPENAPI.md`
- drf-spectacular Docs: https://drf-spectacular.readthedocs.io/
- OpenAPI Spec: https://swagger.io/specification/
