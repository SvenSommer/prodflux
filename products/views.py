from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Product, ProductMaterial, ProductStock
from materials.models import MaterialMovement
from .serializers import ProductMaterialSerializer, ProductSerializer
from decimal import Decimal

class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

class ProductMaterialCreateView(generics.CreateAPIView):
    queryset = ProductMaterial.objects.all()
    serializer_class = ProductMaterialSerializer
    permission_classes = [IsAuthenticated]

class ProductMaterialDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductMaterial.objects.all()
    serializer_class = ProductMaterialSerializer
    permission_classes = [IsAuthenticated]

class ProductMaterialListView(generics.ListAPIView):
    serializer_class = ProductMaterialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ProductMaterial.objects.filter(product_id=self.kwargs['product_id'])


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def manufacture_product(request):
    product_id = request.data.get("product_id")
    workshop_id = request.data.get("workshop_id")
    quantity = request.data.get("quantity")

    try:
        quantity = Decimal(str(quantity))
    except:
        return Response({"detail": "Ungültige Menge."}, status=400)

    product = Product.objects.get(id=product_id)
    materials = ProductMaterial.objects.filter(product=product)

    for pm in materials:
        required_total = pm.quantity_per_unit * quantity
        MaterialMovement.objects.create(
            workshop_id=workshop_id,
            material=pm.material,
            change_type='verbrauch',
            quantity=required_total,
            note=f"Fertigung {quantity}x {product.bezeichnung}"
        )

    ps, created = ProductStock.objects.get_or_create(workshop_id=workshop_id, product=product)
    ps.bestand += quantity
    ps.save()

    return Response({"message": f"{quantity}x {product.bezeichnung} gefertigt."})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def product_stock_view(request, product_id):
    workshop_id = request.query_params.get('workshop_id')
    if not workshop_id:
        return Response({'detail': 'workshop_id is required'}, status=400)

    try:
        stock = ProductStock.objects.get(workshop_id=workshop_id, product_id=product_id)
        value = float(stock.bestand)
    except ProductStock.DoesNotExist:
        value = 0

    return Response({
        "product_id": product_id,
        "workshop_id": workshop_id,
        "current_stock": value
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def producible_units_view(request, product_id):
    workshop_id = request.query_params.get('workshop_id')
    if not workshop_id:
        return Response({'detail': 'workshop_id is required'}, status=400)

    requirements = ProductMaterial.objects.filter(product_id=product_id)
    limits = []

    for req in requirements:
        movements = MaterialMovement.objects.filter(
            material=req.material,
            workshop_id=workshop_id
        )

        total = 0
        for m in movements:
            if m.change_type in ['lieferung', 'korrektur']:
                total += m.quantity
            elif m.change_type in ['verbrauch', 'verlust']:
                total -= m.quantity

        if req.quantity_per_unit > 0:
            limit = total // req.quantity_per_unit
        else:
            limit = 0

        limits.append(limit)

    producible = int(min(limits)) if limits else 0

    return Response({
        "product_id": product_id,
        "workshop_id": workshop_id,
        "possible_units": producible
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def producible_overview_view(request):
    workshop_id = request.query_params.get('workshop_id')
    if not workshop_id:
        return Response({'detail': 'workshop_id is required'}, status=400)

    overview = []
    products = Product.objects.all()

    for product in products:
        requirements = ProductMaterial.objects.filter(product=product)
        limits = []

        for req in requirements:
            movements = MaterialMovement.objects.filter(
                material=req.material,
                workshop_id=workshop_id
            )

            total = 0
            for m in movements:
                if m.change_type in ['lieferung', 'korrektur']:
                    total += m.quantity
                elif m.change_type in ['verbrauch', 'verlust']:
                    total -= m.quantity

            if req.quantity_per_unit > 0:
                limit = total // req.quantity_per_unit
            else:
                limit = 0

            limits.append(limit)

        possible_units = int(min(limits)) if limits else 0

        overview.append({
            "product_id": product.id,
            "product": product.bezeichnung,
            "possible_units": possible_units
        })

    return Response(overview)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def workshop_products_overview(request, workshop_id):
    stocks = ProductStock.objects.filter(workshop_id=workshop_id).select_related('product')
    result = []

    for stock in stocks:
        result.append({
            "product_id": stock.product.id,
            "bezeichnung": stock.product.bezeichnung,
            "artikelnummer": stock.product.artikelnummer,
            "version": stock.product.version,
            "bestand": stock.bestand
        })

    return Response(result)