# Prodflux - GitHub Copilot Project Instructions

## Project Overview

**Prodflux** is a comprehensive production and materials management system built with Django REST Framework backend and Angular frontend. It's designed for managing workshops, materials, products, and their manufacturing processes.

### Architecture & Technology Stack

**Backend (Django 5.2.8):**
- Django REST Framework 3.16.0 for API
- JWT Authentication (djangorestframework_simplejwt)
- PostgreSQL (production) / SQLite (development)
- WhiteNoise for static file serving
- Pillow for image handling
- CORS headers for cross-origin requests

**Frontend (Angular 19):**
- Angular Material for UI components
- RxJS for reactive programming
- TypeScript 5.7.2
- Responsive design with Material Design

**Deployment:**
- Render.com for production hosting
- Gunicorn WSGI server
- Environment-based configuration

### Core Applications & Models

#### 1. Core App (`core/`)
**Purpose:** Base functionality, authentication, and workshop management

**Models:**
- `User` (extends AbstractUser): Custom user model with workshop association
- `Workshop`: Represents physical workshop locations

**Key Features:**
- Custom user authentication with JWT
- Workshop-based data separation
- Health check endpoint
- SPA frontend serving

#### 2. Materials App (`materials/`)
**Purpose:** Complete materials inventory and movement management

**Models:**
- `Material`: Individual materials with categories and alternatives
- `MaterialCategory`: Categorization with custom ordering
- `MaterialMovement`: All stock movements (delivery, consumption, transfer, etc.)
- `MaterialTransfer` + `MaterialTransferItem`: Inter-workshop transfers
- `Order` + `OrderItem`: Purchase orders with cost calculation
- `Delivery` + `DeliveryItem`: Incoming deliveries

**Key Features:**
- Comprehensive stock tracking per workshop
- Material alternatives system
- Automatic cost calculation with shipping
- Generic foreign key relationships for movement tracking
- Categorized material display with grouping

#### 3. Products App (`products/`)
**Purpose:** Product definitions and manufacturing requirements

**Models:**
- `Product`: Main product entity with versions and variants
- `ProductVersion`: Version control for products
- `ProductVariant`: Different variants of products
- `ProductMaterial`: Bill of materials (BOM) - materials required per product
- `ProductStock`: Product inventory per workshop

**Key Features:**
- Bill of Materials (BOM) management
- Version and variant tracking
- Manufacturing requirement calculations
- Stock level monitoring per workshop

#### 4. Manufacturing App (`manufacturing/`)
**Purpose:** Production process management (placeholder for future expansion)

#### 5. Shopbridge App (`shopbridge/`)
**Purpose:** WooCommerce integration for e-commerce

**Features:**
- WooCommerce API integration
- Order synchronization
- External shop connectivity

### API Structure & Patterns

**Authentication:**
- JWT-based authentication required for all API endpoints
- Login: `POST /api/auth/login/`
- Token refresh: `POST /api/auth/refresh/`
- User profile: `GET /api/auth/me/`

**RESTful API Patterns:**
- List & Create: `GET/POST /api/{resource}/`
- Detail operations: `GET/PUT/PATCH/DELETE /api/{resource}/{id}/`
- Nested resources: `/api/materials/{id}/movements/`

**Key API Endpoints:**
```
/api/materials/                    # Materials CRUD
/api/materials/{id}/movements/     # Material movements
/api/material-categories/          # Material categories
/api/products/                     # Products CRUD
/api/product-materials/           # Bill of Materials
/api/workshops/                   # Workshop management
/api/shopbridge/orders/           # WooCommerce integration
```

### Development Workflow & Scripts

**Development Scripts:**
- `./start_dev.sh`: Start both Django (8000) and Angular (4200) servers
- `./start_local.sh`: Start only Django backend server
- `./start_frontend.sh`: Start only Angular frontend server

**Environment Configuration:**
- Development: Separate servers, CORS enabled
- Production: Django serves Angular build, WhiteNoise for static files

### Database Design Patterns

**Key Relationships:**
- Workshop-based data isolation
- Material alternatives (many-to-many to self)
- Generic foreign keys for flexible associations
- Constraint-based data integrity

**Stock Management:**
- Movement-based inventory tracking
- Automatic cost calculation with shipping distribution
- Transfer workflows between workshops

### Frontend Architecture

**Angular Structure:**
- Material Design components
- Reactive forms and data handling
- Service-based API communication
- Responsive layout design
- **Detail Page Design Pattern:** See [DETAIL_PAGE_DESIGN_TEMPLATE.md](DETAIL_PAGE_DESIGN_TEMPLATE.md) for comprehensive guide on implementing card-based detail pages with consistent styling, layout, and component patterns
- **Overview Page Design Pattern:** See [OVERVIEW_PAGE_DESIGN_TEMPLATE.md](OVERVIEW_PAGE_DESIGN_TEMPLATE.md) for comprehensive guide on implementing table-based list/overview pages with expandable rows, filtering, and consistent styling

**Build & Deployment:**
- Development: `ng serve` on port 4200
- Production: `ng build` → Django static files

### Code Style & Conventions

**Django Conventions:**
- Class-based views with DRF generics
- Serializer-based API responses
- Permission classes for authentication
- Custom managers and querysets where needed

**API Response Patterns:**
- Nested serializers for related data
- SerializerMethodField for computed values
- Proper HTTP status codes
- Consistent error handling

**File Organization:**
- Models in `models.py`
- Serializers in `serializers.py`
- Views in `views.py`
- URLs in `urls.py`
- Utilities in `utils.py`

### Common Development Tasks

**Adding New Models:**
1. Define model in `models.py`
2. Create serializer in `serializers.py`
3. Implement views in `views.py`
4. Add URL patterns in `urls.py`
5. Run migrations: `python manage.py makemigrations && python manage.py migrate`

**Material Management Features:**
- Always consider workshop-based filtering
- Use MaterialMovement for all stock changes
- Include proper change_type categorization
- Link movements to source objects when applicable

**Product Manufacturing:**
- ProductMaterial defines BOM relationships
- Calculate material requirements based on quantity_per_unit
- Consider workshop stock levels for manufacturing feasibility

### Security & Best Practices

**Authentication:**
- JWT tokens for API access
- Workshop-based data isolation
- Permission classes on all views

**File Handling:**
- Images stored in media/ directory
- Proper upload paths for materials and products
- URL generation through serializers

**Environment Variables:**
- Use .env for local development
- Render environment variables for production
- Database URL configuration with dj-database-url

### Testing & Quality

**API Testing:**
- Use `api-test.http` files for endpoint testing
- JWT token management in requests
- Workshop-based test data

**Development Database:**
- SQLite for local development
- PostgreSQL for production
- Migrations tracked in git

### Integration Points

**WooCommerce Integration:**
- API key authentication
- Order synchronization
- Product mapping between systems

**Frontend-Backend Communication:**
- CORS configuration for development
- JWT token handling in Angular
- RESTful API consumption patterns

### Performance Considerations

**Database Queries:**
- Use select_related/prefetch_related for related data
- Material stock calculations with aggregation
- Efficient workshop-based filtering

**Static Files:**
- WhiteNoise for production static serving
- Angular build optimization
- Media file handling with proper URLs

---

## Development Guidelines for Copilot

When working on this project:

1. **Always consider workshop-based data separation** - most models should filter by workshop
2. **Use MaterialMovement for all inventory changes** - never directly modify stock values
3. **Follow DRF patterns** - use generics, serializers, and proper HTTP methods
4. **Maintain API consistency** - follow established URL patterns and response formats
5. **Consider manufacturing workflows** - ProductMaterial relationships are crucial for BOM
6. **Test API endpoints** - use the provided .http files for testing
7. **Handle authentication properly** - all endpoints require JWT tokens
8. **Respect model relationships** - understand the foreign key and many-to-many relationships
9. **Use proper error handling** - return appropriate HTTP status codes
10. **Consider frontend integration** - API responses should be frontend-friendly

This system is designed for scalability and workshop-based multi-tenancy, so always consider these aspects when implementing new features.