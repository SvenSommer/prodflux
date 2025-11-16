# Prodflux - Technical Documentation

## Quick Start Guide

### Development Setup

1. **Backend Setup:**
   ```bash
   # Activate virtual environment
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Run migrations
   python manage.py migrate
   
   # Create superuser (optional)
   python manage.py createsuperuser
   
   # Start Django server
   ./start_local.sh
   ```

2. **Frontend Setup:**
   ```bash
   cd prodflux-frontend
   npm install
   npm start
   # OR use the convenience script
   ./start_frontend.sh
   ```

3. **Full Development:**
   ```bash
   # Start both servers simultaneously
   ./start_dev.sh
   ```

### API Authentication

All API endpoints require JWT authentication. Get token:

```http
POST /api/auth/login/
Content-Type: application/json

{
    "username": "your_username",
    "password": "your_password"
}
```

Use token in subsequent requests:
```http
Authorization: Bearer your_jwt_token_here
```

## Core Data Models & Relationships

### Workshop-based Architecture
```
Workshop
├── Users (workshop.users)
├── Material Stock (via MaterialMovement)
├── Product Stock (ProductStock)
├── Material Transfers (source/target)
└── Deliveries
```

### Material Management Flow
```
Order → OrderItem → Delivery → DeliveryItem → MaterialMovement
                                                      ↓
Material ← MaterialCategory                    Workshop Stock
    ↓
ProductMaterial (BOM) → Product → ProductStock
```

### Key Model Relationships

**Material System:**
- `Material.category` → `MaterialCategory` (ForeignKey)
- `Material.alternatives` → `Material` (ManyToMany self)
- `MaterialMovement.material` → `Material` (ForeignKey)
- `MaterialMovement.workshop` → `Workshop` (ForeignKey)

**Product System:**
- `Product.version` → `ProductVersion` (ForeignKey)
- `Product.varianten` → `ProductVariant` (ManyToMany)
- `ProductMaterial.product` → `Product` (ForeignKey)
- `ProductMaterial.material` → `Material` (ForeignKey)

**Transfer System:**
- `MaterialTransfer.source_workshop` → `Workshop`
- `MaterialTransfer.target_workshop` → `Workshop`
- `MaterialTransferItem.transfer` → `MaterialTransfer`
- `MaterialTransferItem.material` → `Material`

## API Endpoints Reference

### Authentication
- `POST /api/auth/login/` - Get JWT token
- `POST /api/auth/refresh/` - Refresh JWT token
- `GET /api/auth/me/` - Get current user profile

### Core Management
- `GET /api/` - Health check
- `GET|POST /api/workshops/` - Workshop list/create
- `GET|PUT|DELETE /api/workshops/{id}/` - Workshop detail

### Material Management
- `GET|POST /api/materials/` - Material list/create
- `GET|PUT|DELETE /api/materials/{id}/` - Material detail
- `GET|POST /api/materials/{id}/movements/` - Material movements
- `GET|POST /api/material-categories/` - Categories
- `GET|POST /api/material-transfers/` - Transfer operations
- `GET|POST /api/deliveries/` - Delivery management
- `GET|POST /api/orders/` - Purchase orders

### Product Management
- `GET|POST /api/products/` - Product list/create
- `GET|PUT|DELETE /api/products/{id}/` - Product detail
- `GET|POST /api/product-versions/` - Version management
- `GET|POST /api/product-variants/` - Variant management
- `GET|POST /api/product-materials/` - Bill of Materials

### Manufacturing & Analytics
- `GET /api/materials/stock/workshop/{workshop_id}/` - Workshop stock
- `GET /api/products/{id}/material-requirements/` - BOM requirements
- `GET /api/products/{id}/producible-units/` - Manufacturing capacity
- `POST /api/products/{id}/manufacture/` - Execute manufacturing

### External Integration
- `GET /api/shopbridge/orders/` - WooCommerce orders
- `GET /api/shopbridge/orders/{id}/` - Order detail

## Database Schema Highlights

### Material Movement Types
```python
CHANGE_TYPES = [
    ('lieferung', 'Lieferung'),      # Incoming delivery
    ('verbrauch', 'Verbrauch'),      # Consumption/usage
    ('verlust', 'Verlust'),          # Loss/damage
    ('korrektur', 'Korrektur'),      # Stock correction
    ('transfer', 'Transfer'),        # Workshop transfer
    ('inventur', 'Inventur'),        # Inventory count
]
```

### Generic Relationships
MaterialMovement uses Django's ContentType framework to link to various source objects:
```python
# Links movement to its source (Delivery, Transfer, etc.)
content_type = models.ForeignKey(ContentType, ...)
object_id = models.PositiveIntegerField(...)
source_object = GenericForeignKey('content_type', 'object_id')
```

## Development Patterns

### Adding New Material Features
```python
# 1. Always create MaterialMovement for stock changes
def process_delivery(delivery_item):
    MaterialMovement.objects.create(
        workshop=delivery_item.delivery.workshop,
        material=delivery_item.material,
        change_type='lieferung',
        quantity=delivery_item.quantity,
        source_object=delivery_item.delivery
    )

# 2. Use workshop-based filtering
materials = Material.objects.filter(
    movements__workshop=request.user.workshop
).distinct()

# 3. Calculate current stock with aggregation
from django.db.models import Sum
current_stock = MaterialMovement.objects.filter(
    material=material,
    workshop=workshop
).aggregate(Sum('quantity'))['quantity__sum'] or 0
```

### Serializer Patterns
```python
class MaterialSerializer(serializers.ModelSerializer):
    # Computed fields
    bild_url = serializers.SerializerMethodField()
    current_stock = serializers.SerializerMethodField()
    
    # Nested relationships
    category = MaterialCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=MaterialCategory.objects.all(),
        source='category',
        write_only=True,
        required=False
    )
    
    def get_bild_url(self, obj):
        request = self.context.get('request')
        if obj.bild and request:
            return request.build_absolute_uri(obj.bild.url)
        return None
```

### View Patterns
```python
class MaterialListCreateView(generics.ListCreateAPIView):
    queryset = Material.objects.select_related('category').all()
    serializer_class = MaterialSerializer
    permission_classes = [IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        # Custom list behavior
        queryset = self.get_queryset()
        return Response(group_materials_by_category(queryset, request))
```

## Configuration Files

### Environment Variables (.env)
```bash
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
RENDER=False
SERVE_FRONTEND=False
```

### Production Settings (render.yaml)
```yaml
services:
  - type: web
    name: prodflux-api
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "gunicorn prodflux.wsgi:application"
    envVars:
      - key: DEBUG
        value: "False"
      - key: RENDER
        value: "True"
```

## Troubleshooting

### Common Issues

1. **CORS Errors in Development:**
   - Ensure `django-cors-headers` is installed
   - Check CORS_ALLOW_ALL_ORIGINS in settings.py

2. **Frontend 404 on Refresh:**
   - Verify catch-all route in urls.py
   - Check SERVE_FRONTEND environment variable

3. **JWT Token Issues:**
   - Check token expiration (7 days default)
   - Verify Authorization header format

4. **Database Migration Errors:**
   ```bash
   python manage.py showmigrations
   python manage.py migrate --fake-initial
   ```

5. **Static Files Not Loading:**
   - Run `python manage.py collectstatic`
   - Check STATIC_ROOT and STATICFILES_DIRS

### Development Tools

- **API Testing:** Use `api-test.http` files with VS Code REST Client
- **Database Inspection:** Django Admin at `/admin/`
- **Debug Toolbar:** Available in development mode
- **Logs:** Check console output for Django and Angular

## Deployment Checklist

1. **Environment Variables Set:**
   - DEBUG=False
   - RENDER=True
   - Database URL configured
   - Secret key secure

2. **Static Files:**
   - Angular build completed
   - collectstatic run
   - WhiteNoise configured

3. **Database:**
   - Migrations applied
   - Superuser created

4. **Security:**
   - ALLOWED_HOSTS configured
   - CORS settings appropriate
   - Media files secured

---

This documentation should help developers understand the Prodflux system architecture and development patterns quickly.