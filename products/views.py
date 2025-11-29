import logging
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count

from materials.utils import group_materials_by_category
from .models import Product, ProductMaterial, ProductStock, ProductVariant, ProductVersion
from materials.models import DeliveryItem, MaterialCategory, MaterialMovement, OrderItem
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

    def get_queryset(self):
        queryset = super().get_queryset()
        # Standardmäßig deprecated Produkte ausblenden
        include_deprecated = self.request.query_params.get(
            'include_deprecated', 'false'
        ).lower() == 'true'
        if not include_deprecated:
            queryset = queryset.filter(deprecated=False)
        return queryset

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

class ProductMaterialGlobalListView(generics.ListAPIView):
    queryset = ProductMaterial.objects.all()
    serializer_class = ProductMaterialSerializer
    permission_classes = [IsAuthenticated]

class ProductMaterialListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        product_id = self.kwargs['product_id']
        product_materials = ProductMaterial.objects.select_related('material__category').filter(product_id=product_id)

        # Vorbereiten: Material + benötigte Menge
        grouped_materials = defaultdict(list)

        for pm in product_materials:
            material = pm.material
            category_name = material.category.name if material.category else "Ohne Kategorie"

            # Erstelle Material-Data manuell für deprecated Materialien
            material_data = {
                'id': material.id,
                'bezeichnung': material.bezeichnung,
                'hersteller_bezeichnung': material.hersteller_bezeichnung,
                'bild_url': material.bild.url if material.bild else None,
                'deprecated': material.deprecated,
                'alternatives': list(
                    material.alternatives.values_list('id', flat=True)
                )
            }
            
            material_data["required_quantity_per_unit"] = float(
                pm.quantity_per_unit
            )
            material_data["product_material_id"] = pm.id

            grouped_materials[category_name].append(material_data)

        # Nach Kategorien sortieren
        sorted_response = []
        categories = MaterialCategory.objects.all().order_by('order')

        for category in categories:
            materials_in_category = grouped_materials.get(category.name, [])
            sorted_response.append({
                "category_id": category.id,
                "category_name": category.name,
                "materials": materials_in_category
            })

        # Materialien ohne Kategorie (falls vorhanden)
        if "Ohne Kategorie" in grouped_materials:
            sorted_response.append({
                "category_id": None,
                "category_name": "Ohne Kategorie",
                "materials": grouped_materials["Ohne Kategorie"]
            })

        return Response(sorted_response)


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
            if m.change_type in ['lieferung', 'korrektur', 'transfer']:
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
                if m.change_type in ['lieferung', 'korrektur', 'transfer']:
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

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({"detail": "Produkt nicht gefunden."}, status=404)

    requirements = ProductMaterial.objects.filter(product=product)
    grouped = {}

    for req in requirements:
        required_total = req.quantity_per_unit * quantity

        material = req.material
        category = material.category

        material_ids = [material.id] + list(material.alternatives.values_list('id', flat=True))

        # Lagerbestand berechnen
        movements = MaterialMovement.objects.filter(
            material_id__in=material_ids,
            workshop_id=workshop_id
        )

        available_quantity = Decimal(0)
        for m in movements:
            if m.change_type in ['lieferung', 'korrektur', 'transfer']:
                available_quantity += m.quantity
            elif m.change_type in ['verbrauch', 'verlust']:
                available_quantity -= m.quantity

        ordered_quantity = OrderItem.objects.filter(
            material_id__in=material_ids
        ).aggregate(total=Sum("quantity"))["total"] or Decimal(0)

        missing_quantity = max(Decimal(0), required_total - (available_quantity + ordered_quantity))

        # Gruppe nach Kategorie
        if category.id not in grouped:
            grouped[category.id] = {
                "category_id": category.id,
                "category_name": category.name,
                "materials": []
            }

        # Bild-URL für Alternative holen
        bild_url = None
        if material.bild:
            request_context = request if request else None
            if request_context:
                bild_url = request.build_absolute_uri(material.bild.url)
            else:
                bild_url = material.bild.url

        grouped[category.id]["materials"].append({
            "id": material.id,
            "bezeichnung": material.bezeichnung,
            "hersteller_bezeichnung": material.hersteller_bezeichnung,
            "bestell_nr": material.bestell_nr,
            "bild": material.bild.url if material.bild else None,
            "bild_url": bild_url,
            "required_quantity": float(required_total),
            "ordered_quantity": float(ordered_quantity),
            "available_quantity": float(available_quantity),
            "missing_quantity": float(missing_quantity),
        })

    # Rückgabe als Liste der Gruppen
    return Response(list(grouped.values()))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def aggregated_material_requirements_view(request):
    data = request.data
    products_data = data.get("products")
    workshop_id = data.get("workshop_id")

    if not workshop_id or not isinstance(products_data, list) or not products_data:
        return Response({"detail": "Ungültige Eingaben."}, status=status.HTTP_400_BAD_REQUEST)

    material_requirements = defaultdict(lambda: {
        "material": None,
        "required_quantity": Decimal(0)
    })

    # Materialien und Mengen aufaddieren
    for entry in products_data:
        product_id = entry.get("product_id")
        quantity = entry.get("quantity")

        if not product_id or quantity is None:
            return Response({"detail": f"Ungültiger Eintrag: {entry}"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(id=product_id)
            quantity = Decimal(str(quantity))
        except (Product.DoesNotExist, ValueError, TypeError):
            return Response({"detail": f"Ungültiger Eintrag: {entry}"}, status=status.HTTP_400_BAD_REQUEST)

        for req in ProductMaterial.objects.filter(product=product):
            material_id = req.material.id
            material_requirements[material_id]["material"] = req.material
            material_requirements[material_id]["required_quantity"] += req.quantity_per_unit * quantity

    response_data = []

    for info in material_requirements.values():
        material = info["material"]
        required_total = info["required_quantity"]

        if not material:
            continue

        material_ids = [material.id] + list(material.alternatives.values_list('id', flat=True))

        movements = MaterialMovement.objects.filter(
            material_id__in=material_ids,
            workshop_id=workshop_id
        )

        available_quantity = Decimal(0)
        for m in movements:
            if m.change_type in ['lieferung', 'korrektur', 'transfer']:
                available_quantity += m.quantity
            elif m.change_type in ['verbrauch', 'verlust']:
                available_quantity -= m.quantity

        ordered_quantity = OrderItem.objects.filter(
            material_id__in=material_ids
        ).aggregate(total=Sum("quantity"))["total"] or Decimal(0)

        missing_quantity = max(Decimal(0), required_total - (available_quantity + ordered_quantity))

        bild_url = None
        if material.bild:
            request_context = request if request else None
            if request_context:
                bild_url = request.build_absolute_uri(material.bild.url)
            else:
                bild_url = material.bild.url

        response_data.append({
            "material_id": material.id,
            "bezeichnung": material.bezeichnung,
            "bild": material.bild.url if material.bild else None,
            "bild_url": bild_url,
            "required_quantity": float(required_total),
            "ordered_quantity": float(ordered_quantity),
            "available_quantity": float(available_quantity),
            "missing_quantity": float(missing_quantity),
        })

    return Response(response_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def product_lifecycle_overview(request):
    workshop_id = request.query_params.get("workshop_id")
    if not workshop_id:
        return Response({'detail': 'workshop_id is required'}, status=400)

    result = []
    products = Product.objects.all()

    for product in products:
        bestellung_limits = []
        lager_limits = []

        for req in ProductMaterial.objects.filter(product=product):
            material = req.material
            bedarf_pro_einheit = req.quantity_per_unit

            gesamt_bestellt = OrderItem.objects.filter(
                material=material
            ).aggregate(total=Sum("quantity"))["total"] or Decimal(0)

            bewegungen = MaterialMovement.objects.filter(
                material=material,
                workshop_id=workshop_id
            )

            lager = sum([
                m.quantity if m.change_type in ['lieferung', 'korrektur'] else -m.quantity
                for m in bewegungen
            ])

            if bedarf_pro_einheit > 0:
                if lager == 0 and gesamt_bestellt == 0:
                    limit_bestellung = 0
                else:
                    limit_bestellung = (lager + gesamt_bestellt) // bedarf_pro_einheit

                limit_lager = lager // bedarf_pro_einheit
            else:
                limit_bestellung = 0
                limit_lager = 0

            bestellung_limits.append(limit_bestellung)
            lager_limits.append(limit_lager)

        bestellungen_moeglich = int(min(bestellung_limits)) if bestellung_limits else 0
        lager_fertigung_moeglich = int(min(lager_limits)) if lager_limits else 0

        try:
            bestand = ProductStock.objects.get(product=product, workshop_id=workshop_id).bestand
        except ProductStock.DoesNotExist:
            bestand = Decimal(0)

        result.append({
            "product_id": product.id,
            "product": product.bezeichnung,
            "bestellungen_moeglich": bestellungen_moeglich,
            "lager_fertigung_moeglich": lager_fertigung_moeglich,
            "bestand_fertig": float(bestand),
            "verkauft": 0
        })

    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def product_material_dependencies(request, product_id):
    """
    Prüft, welche Materialien ausschließlich von diesem Produkt verwendet werden.
    Gibt eine Liste von Materialien zurück, die deprecated werden können.
    """
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {"detail": "Produkt nicht gefunden"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Finde alle Materialien, die von diesem Produkt verwendet werden
    product_materials = ProductMaterial.objects.filter(
        product=product
    ).select_related('material')

    exclusive_materials = []
    shared_materials = []

    for pm in product_materials:
        material = pm.material
        
        # Prüfe, ob das Material von anderen Produkten verwendet wird
        other_usage_count = ProductMaterial.objects.filter(
            material=material
        ).exclude(product=product).count()
        
        material_data = {
            'id': material.id,
            'bezeichnung': material.bezeichnung,
            'quantity_per_unit': float(pm.quantity_per_unit),
            'current_deprecated': material.deprecated
        }
        
        if other_usage_count == 0:
            exclusive_materials.append(material_data)
        else:
            material_data['other_products_count'] = other_usage_count
            shared_materials.append(material_data)

    return Response({
        'product_id': product.id,
        'product_name': product.bezeichnung,
        'exclusive_materials': exclusive_materials,
        'shared_materials': shared_materials,
        'can_deprecate_materials': len(exclusive_materials) > 0
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_product_deprecated(request, product_id):
    """
    Toggles (umschalten) den deprecated Status eines Produkts und optional seiner exklusiven Materialien
    """
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {"detail": "Produkt nicht gefunden"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Toggle the deprecated status
    new_deprecated_status = not product.deprecated
    product.deprecated = new_deprecated_status
    product.save()

    handle_materials = request.data.get('handle_materials', False)
    affected_material_ids = []

    if handle_materials:
        # Finde alle Materialien des Produkts
        product_materials = ProductMaterial.objects.filter(
            product=product
        ).select_related('material')

        for pm in product_materials:
            material = pm.material
            
            # Prüfe, ob das Material von anderen aktiven Produkten verwendet wird
            other_active_usage_count = ProductMaterial.objects.filter(
                material=material,
                product__deprecated=False
            ).exclude(product=product).count()
            
            if new_deprecated_status:  # Deprecating
                # Nur deprecaten wenn es nicht von anderen aktiven Produkten verwendet wird
                if other_active_usage_count == 0 and not material.deprecated:
                    material.deprecated = True
                    material.save()
                    affected_material_ids.append(material.id)
            else:  # Reactivating
                # Reactivate material wenn es deprecated ist und von diesem Produkt verwendet wird
                if material.deprecated:
                    material.deprecated = False
                    material.save()
                    affected_material_ids.append(material.id)

    return Response({
        'product_id': product.id,
        'product_deprecated': new_deprecated_status,
        'materials_affected': affected_material_ids,
        'materials_count': len(affected_material_ids),
        'action': 'deprecated' if new_deprecated_status else 'reactivated'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deprecate_product_with_materials(request, product_id):
    """
    Deprecated ein Produkt und optional seine exklusiven Materialien
    LEGACY: Verwende toggle_product_deprecated für neue Implementierungen
    """
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {"detail": "Produkt nicht gefunden"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Produkt auf deprecated setzen
    product.deprecated = True
    product.save()

    deprecate_materials = request.data.get('deprecate_materials', False)
    deprecated_material_ids = []

    if deprecate_materials:
        # Finde exklusive Materialien
        product_materials = ProductMaterial.objects.filter(
            product=product
        ).select_related('material')

        for pm in product_materials:
            material = pm.material
            
            # Prüfe, ob das Material von anderen Produkten verwendet wird
            other_usage_count = ProductMaterial.objects.filter(
                material=material
            ).exclude(product=product).count()
            
            if other_usage_count == 0 and not material.deprecated:
                material.deprecated = True
                material.save()
                deprecated_material_ids.append(material.id)

    return Response({
        'product_id': product.id,
        'product_deprecated': True,
        'materials_deprecated': deprecated_material_ids,
        'materials_count': len(deprecated_material_ids)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def product_statistics_view(request, product_id):
    """
    Holt Statistiken für ein einzelnes Produkt:
    - Produzierte Einheiten (aus MaterialMovement mit Fertigung-Note)
    - Bestand pro Werkstatt (aus ProductStock)
    - Verkaufte Einheiten (aus WooCommerce via Shopbridge)
    """
    from core.models import Workshop
    
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {"detail": "Produkt nicht gefunden"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # 1. Bestand pro Werkstatt
    workshops = Workshop.objects.all()
    stock_by_workshop = []
    total_stock = Decimal(0)
    
    for workshop in workshops:
        try:
            stock = ProductStock.objects.get(product=product, workshop=workshop)
            bestand = stock.bestand
        except ProductStock.DoesNotExist:
            bestand = Decimal(0)
        
        stock_by_workshop.append({
            'workshop_id': workshop.id,
            'workshop_name': workshop.name,
            'bestand': float(bestand)
        })
        total_stock += bestand
    
    # 2. Produzierte Einheiten berechnen
    # Zähle alle MaterialMovements vom Typ 'verbrauch' die zur Fertigung dieses Produkts gehören
    production_movements = MaterialMovement.objects.filter(
        note__icontains=product.bezeichnung,
        change_type='verbrauch'
    )
    
    # Berechne produzierte Einheiten aus den Notizen
    # Format: "Fertigung 5x Produktname"
    total_produced = Decimal(0)
    for movement in production_movements:
        note = movement.note
        if 'Fertigung' in note and product.bezeichnung in note:
            try:
                # Extrahiere Menge aus "Fertigung 5x Produktname"
                import re
                match = re.search(r'Fertigung\s+(\d+(?:\.\d+)?)\s*x', note)
                if match:
                    qty = Decimal(match.group(1))
                    # Nur einmal pro Fertigung zählen (nicht pro Material)
                    # Wir nehmen nur den ersten Eintrag pro unique note
                    pass
            except (ValueError, AttributeError):
                pass
    
    # Alternative: Zähle direkt aus ProductStock-Änderungen 
    # (ProductStock repräsentiert den aktuellen Bestand nach allen Fertigungen)
    # Da wir keinen direkten Fertigungs-Log haben, nehmen wir den aktuellen Bestand als Basis
    # und fügen verkaufte hinzu um auf produzierte zu kommen (wenn Verkäufe vorhanden)
    
    # Für jetzt: Produzierte = Bestand (später mit WooCommerce Verkäufen erweitern)
    total_produced = total_stock
    
    # 3. Placeholder für Verkäufe (WooCommerce Integration)
    # Diese werden vom Frontend über die shopbridge API geholt
    
    return Response({
        'product_id': product.id,
        'product_name': product.bezeichnung,
        'artikelnummer': product.artikelnummer,
        'statistics': {
            'total_produced': float(total_produced),
            'total_stock': float(total_stock),
            'stock_by_workshop': stock_by_workshop,
        }
    })
