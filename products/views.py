from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Product, ProductMaterial, ProductStock, ProductVariant, ProductVersion
from materials.models import MaterialMovement, OrderItem
from .serializers import ProductMaterialSerializer, ProductSerializer, ProductVariantSerializer, ProductVersionSerializer
from decimal import Decimal
from django.db.models import Sum

class ProductVersionListCreateView(generics.ListCreateAPIView):
    queryset = ProductVersion.objects.all()
    serializer_class = ProductVersionSerializer
    permission_classes = [IsAuthenticated]

class ProductVersionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductVersion.objects.all()
    serializer_class = ProductVersionSerializer
    permission_classes = [IsAuthenticated]

class ProductVariantListCreateView(generics.ListCreateAPIView):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer
    permission_classes = [IsAuthenticated]

class ProductVariantDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer
    permission_classes = [IsAuthenticated]

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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def material_requirements_view(request, product_id):
    try:
        quantity = Decimal(str(request.query_params.get("quantity", "1")))
        workshop_id = int(request.query_params.get("workshop_id"))
    except (TypeError, ValueError):
        return Response({"detail": "Ungültige Eingaben."}, status=400)

    product = Product.objects.get(id=product_id)
    requirements = ProductMaterial.objects.filter(product=product)
    response = []

    for req in requirements:
        required_total = req.quantity_per_unit * quantity

        movements = MaterialMovement.objects.filter(
            material=req.material,
            workshop_id=workshop_id
        )

        total = Decimal(0)
        for m in movements:
            if m.change_type in ['lieferung', 'korrektur']:
                total += m.quantity
            elif m.change_type in ['verbrauch', 'verlust']:
                total -= m.quantity

        missing = max(Decimal(0), required_total - total)

        response.append({
            "material_id": req.material.id,
            "bezeichnung": req.material.bezeichnung,
            "required_quantity": float(required_total),
            "available_quantity": float(total),
            "missing_quantity": float(missing),
        })

    return Response(response)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def product_lifecycle_overview(request):
    workshop_id = request.query_params.get("workshop_id")
    if not workshop_id:
        return Response({'detail': 'workshop_id is required'}, status=400)

    result = []
    products = Product.objects.all()

    for product in products:
        # 1. Mögliche Einheiten aus offenen Bestellungen
        bestellung_limits = []
        for req in ProductMaterial.objects.filter(product=product):
            offene_bestellungen = OrderItem.objects.filter(
                material=req.material,
                order__angekommen_am__isnull=True
            ).aggregate(total=Sum("quantity"))["total"] or 0

            limit = offene_bestellungen // req.quantity_per_unit if req.quantity_per_unit > 0 else 0
            bestellung_limits.append(limit)

        bestellungen_moeglich = int(min(bestellung_limits)) if bestellung_limits else 0

        # 2. Mögliche Einheiten aus vorhandenem Lager
        lager_limits = []
        for req in ProductMaterial.objects.filter(product=product):
            bewegungen = MaterialMovement.objects.filter(
                material=req.material,
                workshop_id=workshop_id
            )

            lager = sum([
                m.quantity if m.change_type in ['lieferung', 'korrektur'] else -m.quantity
                for m in bewegungen
            ])
            limit = lager // req.quantity_per_unit if req.quantity_per_unit > 0 else 0
            lager_limits.append(limit)

        lager_fertigung_moeglich = int(min(lager_limits)) if lager_limits else 0

        # 3. Bestand an gefertigten Produkten
        try:
            bestand = ProductStock.objects.get(product=product, workshop_id=workshop_id).bestand
        except ProductStock.DoesNotExist:
            bestand = 0

        result.append({
            "product_id": product.id,
            "product": product.bezeichnung,
            "bestellungen_moeglich": bestellungen_moeglich,
            "lager_fertigung_moeglich": lager_fertigung_moeglich,
            "bestand_fertig": float(bestand),
            "verkauft": 0  # noch nicht implementiert
        })

    return Response(result)