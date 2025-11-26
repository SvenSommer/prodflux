# 🏭 Prodflux - Production & Materials Management System








































































































































































































Die Swagger UI ist jetzt ein **All-in-One Tool** für API-Entwicklung und Testing!✅ **Zeitersparnis** bei jedem API-Test  ✅ **Bessere Developer Experience**  ✅ **Automatische Token-Verwaltung**  ✅ **Schneller Login** direkt in der Dokumentation  ✅ **Keine externen Tools** mehr notwendig  Das Quick Login Feature macht die API-Dokumentation zu einem vollständigen Entwicklungstool:## Zusammenfassung- Keine Standard-Credentials im Template- CORS richtig konfigurieren- HTTPS verwenden (Token-Sicherheit)**Wichtig:**```https://your-domain.com/api/docs/```In Produktion funktioniert das Feature identisch:## Produktionsumgebung- Browser-Einstellungen für Cookies/Storage prüfen- Private/Incognito-Modus löscht localStorage- LocalStorage könnte deaktiviert sein### Token bleibt nicht erhalten- Browser-Cache leeren- Logout und erneuter Login- Prüfen Sie, ob das Schloss-Symbol geschlossen ist### Token funktioniert nicht bei API-Requests- Network-Tab prüfen für failed requests- Nach JavaScript-Fehlern suchen- Browser-Console öffnen (F12)### Token wird nicht gesetzt- Stellen Sie sicher, dass der Benutzer in der Datenbank existiert- Überprüfen Sie Username/Password### "Login failed: Invalid credentials"## Fehlerbehebung```const LOGIN_URL = API_BASE_URL + '/api/custom-auth/';// In templates/swagger_ui.html```javascriptWenn Sie einen anderen Auth-Endpoint verwenden:### Unterschiedliche Login-URLs```}    /* Position, Farben, etc. anpassen */#login-panel {/* In templates/swagger_ui.html <style> section */```cssDas Login-Panel kann über CSS angepasst werden:### Styling anpassen⚠️ **Warnung:** Nur für lokale Entwicklung! Niemals in Produktion!```<input type="password" id="password" placeholder="Password" value="admin"><input type="text" id="username" placeholder="Username" value="admin"><!-- In templates/swagger_ui.html -->```htmlFür Entwicklung können Sie Standard-Credentials im Template setzen:### Standard-Benutzer## Anpassungen**Zeitersparnis:** ~90%3. ✓ Fertig!2. "Login & Authorize" klicken1. Username + Password eingeben### Jetzt (Integriert):6. Bei jedem Browser-Neustart wiederholen5. Token manuell einfügen4. "Authorize" klicken3. In Swagger UI wechseln2. Token aus Response kopieren1. Login-Request in separatem Tool (curl, Postman, etc.)### Vorher (Manuell):## Vorteile gegenüber manueller Autorisierung```7. UI wird auf "logged-in" Status aktualisiert   ↓6. Swagger UI setzt "Authorization: Bearer {token}" in alle Requests   ↓5. JavaScript ruft ui.preauthorizeApiKey("Bearer", token)   ↓4. JavaScript speichert Access Token in localStorage   ↓3. Django gibt JWT Access + Refresh Token zurück   ↓2. JavaScript sendet POST zu /api/auth/login/   ↓1. Benutzer gibt Credentials ein```### Login-Flow- Logout löscht Token vollständig- Token wird nur für API-Requests verwendet- LocalStorage ist domain-spezifisch**Sicherheit:**- Automatisches Laden beim Öffnen der Swagger UI- Kein erneuter Login bei Seitenaktualisierung- Token bleibt über Browser-Neustarts erhalten**Vorteile:**```localStorage.setItem('username', username);localStorage.setItem('jwt_token', token);```javascriptDer Token wird im Browser's localStorage gespeichert:### Token-Speicherung- Login-Endpoint: `/api/auth/login/` (JWT SimpleJWT)- Template: `templates/swagger_ui.html`- Custom View: `core/swagger_views.py` - `CustomSwaggerView`**Backend (Django):**- SwaggerUIBundle.preauthorizeApiKey() für Token-Verwaltung- Fetch API für Login-Request- LocalStorage für Token-Persistenz- Custom Swagger UI Template mit integriertem Login-Formular**Frontend (JavaScript):**### Implementierung## Technische Details```3. Autorisierung wird aus Swagger UI entfernt2. Token wird gelöscht1. Klicken Sie den roten "Logout" Button im Login-Panel```### 3. Logout- Sie können sofort API-Endpunkte testen- Der Bearer-Token wird automatisch in allen Requests mitgesendet- Alle API-Endpunkte zeigen das geschlossene Schloss-Symbol ✓Nach dem Login:### 2. API verwenden- ✓ Alle API-Endpunkte sind sofort nutzbar- ✓ Ihr Username wird angezeigt- ✓ Panel wechselt zu grünem Hintergrund- ✓ Token wird automatisch in Swagger UI gesetzt- ✓ Erfolgsmeldung wird angezeigt**Ergebnis:**```5. Klicken Sie "Login & Authorize" (oder drücken Enter)4. Geben Sie Ihr Password ein3. Geben Sie Ihren Username ein2. Finden Sie das "🔐 Quick Login" Panel rechts oben1. Öffnen Sie: http://localhost:8000/api/docs/```### 1. Login## Verwendung✅ **Keyboard-Support** - Enter-Taste für schnellen Login  ✅ **Logout-Funktion** - Einfaches Löschen des Tokens  ✅ **Benutzeranzeige** - Sichtbare Anzeige des angemeldeten Benutzers  ✅ **Persistenz** - Token bleibt über Browser-Neustarts erhalten  ✅ **Automatische Autorisierung** - Token wird sofort in Swagger UI gesetzt  ✅ **Direkter Login** - Keine manuelle Token-Verwaltung notwendig  Das Login-Panel befindet sich **rechts oben** in der Swagger UI und bietet:### 🔐 Quick Login Panel## FeaturesDie Swagger UI wurde mit einem integrierten Login-Panel erweitert, das die Authentifizierung vereinfacht und den JWT-Token automatisch verwaltet.## ÜberblickA comprehensive production and materials management system built with Django REST Framework and Angular.

[![Django](https://img.shields.io/badge/Django-5.2.8-green.svg)](https://www.djangoproject.com/)
[![Angular](https://img.shields.io/badge/Angular-19-red.svg)](https://angular.io/)
[![DRF](https://img.shields.io/badge/DRF-3.16.0-blue.svg)](https://www.django-rest-framework.org/)

## 🚀 Features

### 📦 Material Management
- **Inventory Tracking:** Real-time stock management across multiple workshops
- **Material Categories:** Organized categorization with custom ordering
- **Alternative Materials:** Link alternative/substitute materials
- **Movement History:** Complete audit trail of all stock changes
- **Workshop Transfers:** Transfer materials between different workshops
- **Purchase Orders:** Order management with automatic cost calculation
- **Delivery Processing:** Handle incoming deliveries with batch processing

### 🏭 Production Management
- **Bill of Materials (BOM):** Define material requirements for products
- **Product Versions & Variants:** Version control and variant management
- **Manufacturing Capacity:** Calculate producible quantities based on available materials
- **Product Stock:** Track finished product inventory per workshop
- **Manufacturing Execution:** Process production runs with automatic material consumption

### 🏪 Workshop Management
- **Multi-Workshop Support:** Manage multiple workshop locations
- **User-Workshop Association:** Workshop-based access control
- **Workshop-Specific Inventory:** Separate stock management per location
- **Transfer Operations:** Seamless material transfers between workshops

### 🔗 E-Commerce Integration
- **WooCommerce Integration:** Connect with external online shops
- **Order Synchronization:** Sync orders and inventory levels
- **Product Mapping:** Link internal products to external shop items

### 🔐 Security & Authentication
- **JWT Authentication:** Secure API access with JSON Web Tokens
- **Workshop-Based Permissions:** Access control based on workshop association
- **Secure File Handling:** Safe image uploads for materials and products

## 🛠️ Technology Stack

### Backend
- **Django 5.2.8** - Web framework
- **Django REST Framework 3.16.0** - API framework
- **drf-spectacular 0.27.2** - OpenAPI 3.0 schema generation
- **PostgreSQL** (Production) / **SQLite** (Development) - Database
- **JWT Authentication** - djangorestframework_simplejwt
- **WhiteNoise** - Static file serving
- **Pillow** - Image processing
- **Gunicorn** - WSGI server

### Frontend
- **Angular 19** - Frontend framework
- **Angular Material** - UI component library
- **TypeScript 5.7.2** - Programming language
- **RxJS** - Reactive programming
- **Responsive Design** - Mobile-first approach

### Deployment
- **Render.com** - Cloud hosting platform
- **Environment-based Configuration** - Flexible deployment settings

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/prodflux.git
cd prodflux
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start Django server
./start_local.sh
```

### 3. Frontend Setup
```bash
cd prodflux-frontend
npm install
npm start
# OR use the convenience script
./start_frontend.sh
```

### 4. Development Mode (Both Servers)
```bash
# Start both Django (8000) and Angular (4200) servers
./start_dev.sh
```

## 📡 API Documentation

### 📖 Interactive API Documentation

Prodflux provides comprehensive OpenAPI 3.0 documentation with interactive interfaces:

- **🔵 Swagger UI:** http://localhost:8000/api/docs/
  - **Integriertes Login-Panel** für schnelle Authentifizierung 🆕
  - Automatische Token-Verwaltung
  - Interactive API testing
  - Built-in authentication
  - Request/Response examples
  
- **📘 ReDoc:** http://localhost:8000/api/redoc/
  - Beautiful, readable documentation
  - Three-column layout
  - Detailed schemas

- **📄 OpenAPI Schema:** http://localhost:8000/api/schema/
  - Download as JSON or YAML
  - Import into Postman, Insomnia, etc.
  - Code generation support

For detailed information, see [OPENAPI.md](OPENAPI.md)

### Key API Endpoints

#### Authentication
- `POST /api/auth/login/` - Login and get JWT token
- `POST /api/auth/refresh/` - Refresh JWT token
- `GET /api/auth/me/` - Get current user profile

#### Materials
- `GET|POST /api/materials/` - List/Create materials
- `GET|PUT|DELETE /api/materials/{id}/` - Material operations
- `GET|POST /api/materials/{id}/movements/` - Material movements
- `GET|POST /api/material-categories/` - Material categories

#### Products
- `GET|POST /api/products/` - List/Create products
- `GET|PUT|DELETE /api/products/{id}/` - Product operations
- `GET|POST /api/product-materials/` - Bill of Materials

#### Workshops
- `GET|POST /api/workshops/` - Workshop management
- `GET|PUT|DELETE /api/workshops/{id}/` - Workshop operations

For complete API documentation, see [DEVELOPMENT.md](DEVELOPMENT.md) and [OPENAPI.md](OPENAPI.md)

## 🏗️ Project Structure

```
prodflux/
├── core/                    # Core app (auth, workshops)
│   ├── models.py           # User, Workshop models
│   ├── views.py            # Authentication views
│   └── serializers.py      # API serializers
├── materials/              # Materials management
│   ├── models.py           # Material, Movement, Transfer models
│   ├── views.py            # Material API views
│   └── utils.py            # Helper functions
├── products/               # Product management
│   ├── models.py           # Product, BOM models
│   └── views.py            # Product API views
├── shopbridge/             # E-commerce integration
├── manufacturing/          # Production management
├── prodflux-frontend/      # Angular frontend
│   ├── src/app/           # Angular application
│   └── package.json       # Frontend dependencies
├── start_dev.sh           # Development startup script
├── start_local.sh         # Backend only script
├── start_frontend.sh      # Frontend only script
└── requirements.txt       # Python dependencies
```

## 🔧 Development

### Environment Variables
Create a `.env` file with:
```bash
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///db.sqlite3
RENDER=False
SERVE_FRONTEND=False
```

### API Testing
Use the provided HTTP test files:
- `api-test.http` - General API testing
- `api-test-openapi.http` - OpenAPI endpoint testing
- `api-test Workshops.http` - Workshop-specific tests

Or use the interactive Swagger UI at http://localhost:8000/api/docs/

### Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Static Files
```bash
python manage.py collectstatic
```

## 📋 Data Model Overview

### Core Models
- **Workshop:** Physical workshop locations
- **User:** Extended user model with workshop association

### Material Models
- **Material:** Individual materials with categories and alternatives
- **MaterialCategory:** Categorization system
- **MaterialMovement:** All stock movements with audit trail
- **MaterialTransfer:** Inter-workshop material transfers
- **Order/OrderItem:** Purchase order management
- **Delivery/DeliveryItem:** Incoming delivery processing

### Product Models
- **Product:** Main product entity
- **ProductVersion:** Version control for products
- **ProductVariant:** Product variants management
- **ProductMaterial:** Bill of Materials (BOM) relationships
- **ProductStock:** Product inventory per workshop

## 🚀 Deployment

### Production Deployment (Render.com)
1. Set environment variables in Render dashboard
2. Configure database (PostgreSQL)
3. Deploy using `render.yaml` configuration

### Environment Configuration
- **Development:** Separate Django/Angular servers with CORS
- **Production:** Django serves Angular build via WhiteNoise

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 Documentation

- [Development Guide](DEVELOPMENT.md) - Detailed technical documentation
- [OpenAPI Documentation](OPENAPI.md) - API documentation and usage
- [GitHub Copilot Instructions](.github/copilot-instructions.md) - AI assistant configuration

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Django REST Framework for the excellent API framework
- Angular Material for the beautiful UI components
- The open-source community for inspiration and tools

---

**Made with ❤️ for efficient production management**