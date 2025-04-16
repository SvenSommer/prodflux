import logging
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Product, ProductMaterial, ProductStock, ProductVariant, ProductVersion
from materials.models import DeliveryItem, MaterialMovement, OrderItem
from .serializers import ProductMaterialSerializer, ProductSerializer, ProductVariantSerializer, ProductVersionSerializer
from decimal import Decimal
from django.db.models import Sum
from collections import defaultdict


logger = logging.getLogger(__name__)

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

        # 1. Lagerbestand
        movements = MaterialMovement.objects.filter(
            material=req.material,
            workshop_id=workshop_id
        )

        available_quantity = Decimal(0)
        for m in movements:
            if m.change_type in ['lieferung', 'korrektur']:
                available_quantity += m.quantity
            elif m.change_type in ['verbrauch', 'verlust']:
                available_quantity -= m.quantity

        # 2. Bestellte Menge (alle Bestellungen)
        ordered_quantity = OrderItem.objects.filter(
            material=req.material
        ).aggregate(total=Sum("quantity"))["total"] or Decimal(0)

        # 3. Fehlmenge berechnen unter Berücksichtigung von Bestellungen
        missing_quantity = max(Decimal(0), required_total - (available_quantity + ordered_quantity))

        response.append({
            "material_id": req.material.id,
            "bezeichnung": req.material.bezeichnung,
            "required_quantity": float(required_total),
            "ordered_quantity": float(ordered_quantity),
            "available_quantity": float(available_quantity),
            "missing_quantity": float(missing_quantity),
        })

    return Response(response)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def aggregated_material_requirements_view(request):
    data = request.data
    products_data = data.get("products", [])
    workshop_id = data.get("workshop_id")

    if not workshop_id or not isinstance(products_data, list):
        return Response({"detail": "Ungültige Eingaben."}, status=status.HTTP_400_BAD_REQUEST)

    # Materialbedarfe aufsummieren: {material_id: total_required_quantity}
    material_requirements = defaultdict(lambda: {
        "bezeichnung": "",
        "required_quantity": Decimal(0)
    })

    for entry in products_data:
        try:
            product_id = int(entry["product_id"])
            quantity = Decimal(str(entry["quantity"]))
        except (KeyError, ValueError, TypeError):
            return Response({"detail": f"Ungültiger Eintrag: {entry}"}, status=400)

        product = Product.objects.get(id=product_id)
        for req in ProductMaterial.objects.filter(product=product):
            material_id = req.material.id
            material_requirements[material_id]["bezeichnung"] = req.material.bezeichnung
            material_requirements[material_id]["required_quantity"] += req.quantity_per_unit * quantity

    response = []

    for material_id, info in material_requirements.items():
        required_total = info["required_quantity"]

        # 1. Lagerbestand
        movements = MaterialMovement.objects.filter(
            material_id=material_id,
            workshop_id=workshop_id
        )

        available_quantity = Decimal(0)
        for m in movements:
            if m.change_type in ['lieferung', 'korrektur']:
                available_quantity += m.quantity
            elif m.change_type in ['verbrauch', 'verlust']:
                available_quantity -= m.quantity

        # 2. Bestellte Menge
        ordered_quantity = OrderItem.objects.filter(
            material_id=material_id
        ).aggregate(total=Sum("quantity"))["total"] or Decimal(0)

        # 3. Fehlmenge (unter Berücksichtigung von Bestellung)
        missing_quantity = max(Decimal(0), required_total - (available_quantity + ordered_quantity))

        response.append({
            "material_id": material_id,
            "bezeichnung": info["bezeichnung"],
            "required_quantity": float(required_total),
            "ordered_quantity": float(ordered_quantity),
            "available_quantity": float(available_quantity),
            "missing_quantity": float(missing_quantity)
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

    logger.info(f"🔄 Starte Lifecycle-Auswertung für Werkstatt {workshop_id}")

    for product in products:
        logger.info(f"➡️ Produkt: {product.bezeichnung} (ID: {product.id})")

        bestellung_limits = []
        lager_limits = []

        for req in ProductMaterial.objects.filter(product=product):
            material = req.material
            bedarf_pro_einheit = req.quantity_per_unit

            logger.info(f"  📦 Material: {material.bezeichnung} (ID: {material.id})")
            logger.info(f"    Bedarf pro Einheit: {bedarf_pro_einheit}")

            # 🔹 Gesamtmenge aus allen Bestellungen
            gesamt_bestellt = OrderItem.objects.filter(
                material=material
            ).aggregate(total=Sum("quantity"))["total"] or Decimal(0)

            logger.info(f"    Bestellt insgesamt: {gesamt_bestellt}")

            # 🔹 Lagerbestand berechnen
            bewegungen = MaterialMovement.objects.filter(
                material=material,
                workshop_id=workshop_id
            )

            lager = sum([
                m.quantity if m.change_type in ['lieferung', 'korrektur'] else -m.quantity
                for m in bewegungen
            ])

            logger.info(f"    Lagerbestand: {lager}")

            # 🔹 Einheiten berechnen
            if bedarf_pro_einheit > 0:
                if lager == 0 and gesamt_bestellt == 0:
                    # Wirklich limitiert – kein Lager, keine Bestellung
                    limit_bestellung = 0
                else:
                    # Bestellung oder Lager vorhanden – berücksichtige beide
                    limit_bestellung = (lager + gesamt_bestellt) // bedarf_pro_einheit

                limit_lager = lager // bedarf_pro_einheit
            else:
                limit_bestellung = 0
                limit_lager = 0

            logger.info(f"    => bestellungen_moeglich: {limit_bestellung}")
            logger.info(f"    => lager_fertigung_moeglich: {limit_lager}")

            bestellung_limits.append(limit_bestellung)
            lager_limits.append(limit_lager)

        # 🔹 Minimum über alle benötigten Materialien
        bestellungen_moeglich = int(min(bestellung_limits)) if bestellung_limits else 0
        lager_fertigung_moeglich = int(min(lager_limits)) if lager_limits else 0

        try:
            bestand = ProductStock.objects.get(product=product, workshop_id=workshop_id).bestand
        except ProductStock.DoesNotExist:
            bestand = Decimal(0)

        logger.info(f"✅ Ergebnis für {product.bezeichnung}:")
        logger.info(f"    bestellungen_moeglich: {bestellungen_moeglich}")
        logger.info(f"    lager_fertigung_moeglich: {lager_fertigung_moeglich}")
        logger.info(f"    bestand_fertig: {bestand}")

        result.append({
            "product_id": product.id,
            "product": product.bezeichnung,
            "bestellungen_moeglich": bestellungen_moeglich,
            "lager_fertigung_moeglich": lager_fertigung_moeglich,
            "bestand_fertig": float(bestand),
            "verkauft": 0  # kann später ergänzt werden
        })

    return Response(result)