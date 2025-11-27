# 🏭 Prodflux - Production & Materials Management System


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
python manage.py runserver
# OR use the convenience script
./scripts/startup/start_local.sh
```

### 3. Frontend Setup
```bash
cd prodflux-frontend
npm install
npm start
# OR use the convenience script from root
./scripts/startup/start_frontend.sh
```

### 4. Development Mode (Both Servers)
```bash
# Start both Django (8000) and Angular (4200) servers
./start_dev.sh
```

## 📡 API Documentation

### 📖 Interactive API Documentation

Prodflux provides comprehensive **OpenAPI 3.0** documentation with interactive interfaces:

#### 🔵 Swagger UI (Recommended)
**URL:** http://localhost:8000/api/docs/

**Features:**
- **🔐 Quick Login Panel** - Integriertes Login-Panel (rechts oben) 🆕
  - Automatische Token-Verwaltung
  - Token bleibt über Browser-Neustarts erhalten (localStorage)
  - Sichtbare Anzeige des angemeldeten Benutzers
  - Logout-Funktion
  - Keyboard-Support (Enter für Login)
- **Interactive Testing** - Alle API-Endpunkte direkt im Browser testen
- **Auto-Authorization** - Bearer-Token wird automatisch in allen Requests mitgesendet
- **Request/Response Examples** - Live-Beispiele für alle Endpunkte

**Quick Start:**
1. Öffnen Sie http://localhost:8000/api/docs/
2. Nutzen Sie das "🔐 Quick Login" Panel rechts oben
3. Username + Password eingeben → "Login & Authorize" klicken
4. Fertig! Alle API-Endpunkte sind sofort nutzbar ✨

#### 📘 ReDoc (Readable Documentation)
**URL:** http://localhost:8000/api/redoc/

**Features:**
- **Integriertes Login-Panel** - Token-Generierung und Anzeige 🆕
- **Three-Column Layout** - Übersichtliche Darstellung
- **Detailed Schemas** - Vollständige Modell-Dokumentation
- **Navigation** - Schneller Zugriff auf alle Endpunkte
- **Code Examples** - Request/Response-Beispiele

#### 📄 OpenAPI Schema (JSON/YAML)
**URL:** http://localhost:8000/api/schema/

**Verwendung:**
```bash
# Als JSON herunterladen
curl http://localhost:8000/api/schema/?format=json > openapi.json

# Als YAML herunterladen
curl http://localhost:8000/api/schema/?format=yaml > openapi.yaml
```

**Integration:**
- **Postman:** File → Import → Link → Schema-URL eingeben
- **Insomnia:** Application → Preferences → Data → Import Data
- **Code Generation:** OpenAPI Generator für Client-Code

For detailed information, see [OPENAPI.md](docs/OPENAPI.md)

### 🔑 Key API Endpoints

#### Authentication
```
POST   /api/auth/login/           # JWT Token erhalten
POST   /api/auth/refresh/         # Token aktualisieren
GET    /api/auth/me/              # Eigenes Profil
```

#### Materials (Materialverwaltung)
```
GET    /api/materials/                             # Alle Materialien
POST   /api/materials/                             # Neues Material
GET    /api/materials/{id}/                        # Material Details
PUT    /api/materials/{id}/                        # Material aktualisieren
DELETE /api/materials/{id}/                        # Material löschen
GET    /api/materials/{id}/movements/              # Lagerbewegungen
GET    /api/materials/{id}/stock                   # Lagerbestand
POST   /api/materials/{id}/inventory-correction/   # Inventurkorrektur
GET    /api/materials/{id}/alternatives/           # Alternative Materialien

GET    /api/material-categories/                   # Materialkategorien
POST   /api/material-transfers/                    # Transfer zwischen Werkstätten
GET    /api/orders/                                # Bestellungen
POST   /api/deliveries/                            # Lieferungen erfassen
```

#### Products (Produktverwaltung)
```
GET    /api/products/                              # Alle Produkte
POST   /api/products/                              # Neues Produkt
GET    /api/products/{id}/                         # Produkt Details
GET    /api/products/{id}/requirements/            # Materialanforderungen (BOM)
GET    /api/products/{id}/stock                    # Produktbestand
GET    /api/products/{id}/producible               # Produzierbare Einheiten
POST   /api/manufacture/                           # Produkt fertigen

GET    /api/product-materials/                     # Bill of Materials (BOM)
GET    /api/product-versions/                      # Produktversionen
GET    /api/product-variants/                      # Produktvarianten
```

#### Workshops (Werkstattverwaltung)
```
GET    /api/workshops/                             # Alle Werkstätten
POST   /api/workshops/                             # Neue Werkstatt
GET    /api/workshops/{id}/                        # Werkstatt Details
GET    /api/workshops/{id}/material-stock/         # Materialbestand
GET    /api/workshops/{id}/products/overview/      # Produktübersicht
```

#### Suppliers (Lieferantenverwaltung)
```
GET    /api/suppliers/                             # Alle Lieferanten
POST   /api/suppliers/                             # Neuer Lieferant
GET    /api/material-supplier-prices/              # Lieferantenpreise
```

**📚 Complete API documentation:** [OPENAPI.md](docs/OPENAPI.md) | [DEVELOPMENT.md](docs/DEVELOPMENT.md)

## 🏗️ Project Structure

```
prodflux/
├── api-tests/              # HTTP API test files
│   ├── api-test.http      # General API tests
│   ├── api-test-suppliers.http
│   └── ...
├── backups/                # Database backups
├── core/                   # Core app (auth, workshops)
│   ├── models.py          # User, Workshop models
│   ├── views.py           # Authentication views
│   └── serializers.py     # API serializers
├── docs/                   # Project documentation
│   ├── DEVELOPMENT.md     # Development guide
│   ├── OPENAPI.md         # API documentation
│   ├── prodflux.yaml      # OpenAPI schema
│   └── schema.yaml        # OpenAPI schema (alternative)
├── materials/              # Materials management
│   ├── models.py          # Material, Movement, Transfer models
│   ├── views.py           # Material API views
│   └── utils.py           # Helper functions
├── products/               # Product management
│   ├── models.py          # Product, BOM models
│   └── views.py           # Product API views
├── shopbridge/             # E-commerce integration
├── manufacturing/          # Production management
├── scripts/                # Utility scripts
│   ├── startup/           # Startup scripts
│   │   ├── start_local.sh
│   │   └── start_frontend.sh
│   └── seed_materials.py  # Database seeding
├── prodflux-frontend/      # Angular frontend
│   ├── src/app/           # Angular application
│   └── package.json       # Frontend dependencies
├── start_dev.sh           # Development startup (both servers)
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
Use the provided HTTP test files in the `api-tests/` folder:
- `api-tests/api-test.http` - General API testing
- `api-tests/api-test-openapi.http` - OpenAPI endpoint testing
- `api-tests/api-test-workshops.http` - Workshop-specific tests
- `api-tests/api-test-suppliers.http` - Supplier management tests
- `api-tests/api-test-material-supplier-prices.http` - Material pricing tests
- `api-tests/api-test-import-export.http` - Import/Export tests

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

### OpenAPI Schema Export
```bash
# Export as JSON
curl http://localhost:8000/api/schema/?format=json > openapi.json

# Export as YAML
curl http://localhost:8000/api/schema/?format=yaml > openapi.yaml

# Use with code generators
npm install -g @openapitools/openapi-generator-cli
openapi-generator-cli generate \
  -i http://localhost:8000/api/schema/?format=json \
  -g typescript-axios \
  -o ./generated-client
```

## 📋 Data Model Overview

### API Structure

Die API ist in folgende Module strukturiert:

**Core (Basismodule)**
- Workshops - Verwaltung von Werkstätten
- Authentication - JWT-basierte Benutzerauthentifizierung

**Materials (Materialverwaltung)**
- Materials - Materialstammdaten
- Material Categories - Materialkategorien
- Material Movements - Lagerbewegungen (Lieferung, Verbrauch, Transfer)
- Material Transfers - Transfers zwischen Werkstätten
- Orders - Bestellungen
- Deliveries - Lieferungen
- Suppliers - Lieferantenverwaltung

**Products (Produktverwaltung)**
- Products - Produktstammdaten
- Product Versions - Versionsverwaltung
- Product Variants - Produktvarianten
- Product Materials - Stückliste (Bill of Materials)
- Product Stock - Produktbestand pro Werkstatt
- Manufacturing - Fertigungsanforderungen und -prozesse

**Shopbridge (E-Commerce Integration)**
- WooCommerce Orders - Integration mit WooCommerce-Shop

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

### Model Relationships

```
Workshop
  ├─> User (1:n)
  ├─> Material (1:n)
  ├─> Product (1:n)
  └─> ProductStock (1:n)

Material
  ├─> MaterialCategory (n:1)
  ├─> MaterialMovement (1:n)
  ├─> Material (n:n) [alternatives]
  └─> Supplier (n:n) [via MaterialSupplierPrice]

Product
  ├─> ProductVersion (n:1)
  ├─> ProductVariant (n:n)
  ├─> ProductMaterial (1:n) [BOM]
  └─> ProductStock (1:n)
```

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

- [Development Guide](docs/DEVELOPMENT.md) - Detailed technical documentation
- [OpenAPI Documentation](docs/OPENAPI.md) - API documentation and usage
- [Supplier Implementation](docs/SUPPLIER_IMPLEMENTATION.md) - Supplier management details
- [Material Supplier Prices](docs/MATERIAL_SUPPLIER_PRICES.md) - Pricing system documentation
- [GitHub Copilot Instructions](.github/copilot-instructions.md) - AI assistant configuration

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Django REST Framework for the excellent API framework
- Angular Material for the beautiful UI components
- The open-source community for inspiration and tools

---

**Made with ❤️ for efficient production management**