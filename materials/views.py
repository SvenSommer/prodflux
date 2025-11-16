from decimal import Decimal
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Delivery, Material, MaterialCategory, MaterialMovement, MaterialTransfer, Order
from .serializers import DeliverySerializer, MaterialCategorySerializer, MaterialSerializer, MaterialMovementSerializer, MaterialTransferSerializer, OrderSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from collections import defaultdict
from rest_framework.exceptions import ValidationError  
from .utils import group_materials_by_category


class MaterialListCreateView(generics.ListCreateAPIView):
    queryset = Material.objects.select_related('category').all()
    serializer_class = MaterialSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        return Response(group_materials_by_category(queryset, request))

class MaterialDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    permission_classes = [IsAuthenticated]

class MaterialMovementListCreateView(generics.ListCreateAPIView):
    serializer_class = MaterialMovementSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["material"] = Material.objects.get(pk=self.kwargs["material_id"])
        return context

    def get_queryset(self):
        material_id = self.kwargs['material_id']
        workshop_id = self.request.query_params.get('workshop_id')

        queryset = MaterialMovement.objects.filter(material_id=material_id)

        if workshop_id:
            queryset = queryset.filter(workshop_id=workshop_id)

        return queryset
    
    def perform_create(self, serializer):
        try:
            material = Material.objects.get(pk=self.kwargs['material_id'])  
        except Material.DoesNotExist:
            raise ValidationError("Material nicht gefunden.")
        serializer.save(material=material)


class MaterialMovementDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MaterialMovement.objects.all()
    serializer_class = MaterialMovementSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.content_type:
            return Response(
                {"detail": "Verknüpfte Materialbewegungen (z.B. aus Lieferungen oder Transfers) können nicht bearbeitet werden."},
                status=400
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.content_type:
            return Response(
                {"detail": "Verknüpfte Materialbewegungen (z.B. aus Lieferungen oder Transfers) können nicht gelöscht werden."},
                status=400
            )
        return super().destroy(request, *args, **kwargs)

class MaterialTransferListCreateView(generics.ListCreateAPIView):
    queryset = MaterialTransfer.objects.all().order_by('-created_at')
    serializer_class = MaterialTransferSerializer
    permission_classes = [IsAuthenticated]

class MaterialTransferDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MaterialTransfer.objects.all()
    serializer_class = MaterialTransferSerializer
    permission_classes = [IsAuthenticated]

class MaterialCategoryListCreateView(generics.ListCreateAPIView):
    queryset = MaterialCategory.objects.all()
    serializer_class = MaterialCategorySerializer
    permission_classes = [IsAuthenticated]

class MaterialCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MaterialCategory.objects.all()
    serializer_class = MaterialCategorySerializer
    permission_classes = [IsAuthenticated]

class MaterialAlternativesView(generics.ListCreateAPIView):
    serializer_class = MaterialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        material_id = self.kwargs['pk']
        material = Material.objects.get(pk=material_id)
        return material.alternatives.all()

    def post(self, request, pk):
        material = Material.objects.get(pk=pk)
        alternative_id = request.data.get('alternative_material_id')

        if not alternative_id:
            return Response({'detail': 'alternative_material_id is required.'}, status=400)

        if int(alternative_id) == material.id:
            return Response({'detail': 'Ein Material kann nicht sich selbst als Alternative haben.'}, status=400)

        alternative = Material.objects.get(pk=alternative_id)

        # Alternative symmetrisch hinzufügen
        material.alternatives.add(alternative)
        alternative.alternatives.add(material)

        return Response({'detail': 'Alternative symmetrisch hinzugefügt.'}, status=201)

    def delete(self, request, pk, alternative_pk):
        material = Material.objects.get(pk=pk)
        alternative = Material.objects.get(pk=alternative_pk)

        material.alternatives.remove(alternative)
        alternative.alternatives.remove(material)

        return Response({'detail': 'Alternative symmetrisch entfernt.'}, status=204)

class DeliveryListCreateView(generics.ListCreateAPIView):
    queryset = Delivery.objects.all().order_by('-created_at')
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]

class DeliveryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]

class OrderListCreateView(generics.ListCreateAPIView):
    queryset = Order.objects.all().order_by('-bestellt_am')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def material_stock_view(request, material_id):
    workshop_id = request.query_params.get('workshop_id')
    if not workshop_id:
        return Response({'detail': 'workshop_id is required'}, status=400)

    try:
        material = Material.objects.select_related('category').prefetch_related('alternatives').get(pk=material_id)
    except Material.DoesNotExist:
        return Response({'detail': 'Material nicht gefunden.'}, status=404)

    # Bewegungen für Hauptmaterial
    movements = MaterialMovement.objects.filter(
        material=material,
        workshop_id=workshop_id
    )

    total_stock = Decimal(0)
    for m in movements:
        if m.change_type in ['lieferung', 'korrektur', 'transfer']:
            total_stock += m.quantity
        elif m.change_type in ['verbrauch', 'verlust']:
            total_stock -= m.quantity

    # Bewegungen für Alternativen
    alternative_stocks = []
    for alt_material in material.alternatives.all():
        alt_movements = MaterialMovement.objects.filter(
            material=alt_material,
            workshop_id=workshop_id
        )

        alt_total = Decimal(0)
        for m in alt_movements:
            if m.change_type in ['lieferung', 'korrektur', 'transfer']:
                alt_total += m.quantity
            elif m.change_type in ['verbrauch', 'verlust']:
                alt_total -= m.quantity

        # Bild-URL für Alternative holen
        bild_url = None
        if alt_material.bild:
            request_context = request if request else None
            if request_context:
                bild_url = request.build_absolute_uri(alt_material.bild.url)
            else:
                bild_url = alt_material.bild.url

        alternative_stocks.append({
            "id": alt_material.id,
            "bezeichnung": alt_material.bezeichnung,
            "hersteller_bezeichnung": alt_material.hersteller_bezeichnung,
            "bestell_nr": alt_material.bestell_nr,
            "category": MaterialCategorySerializer(alt_material.category).data if alt_material.category else None,
            "bild": alt_material.bild.url if alt_material.bild else None,
            "bild_url": bild_url,
            "current_stock": float(alt_total)
        })

    return Response({
        "material_id": material.id,
        "bezeichnung": material.bezeichnung,
        "bestell_nr": material.bestell_nr,
        "hersteller_bezeichnung": material.hersteller_bezeichnung,
        "category": material.category.name if material.category else None,
        "current_stock": float(total_stock),
        "workshop_id": int(workshop_id),
        "material_details": MaterialSerializer(material, context={'request': request}).data,
        "alternatives": alternative_stocks
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_materials_stock_by_workshop(request, workshop_id):
    from .utils import group_materials_by_category

    materials = Material.objects.all()
    materials_with_stock = []

    for material in materials:
        movements = MaterialMovement.objects.filter(
            material=material,
            workshop_id=workshop_id
        )

        total = 0
        for m in movements:
            if m.change_type in ['lieferung', 'korrektur', 'transfer']:
                total += m.quantity
            elif m.change_type in ['verbrauch', 'verlust']:
                total -= m.quantity

        material.current_stock = total
        materials_with_stock.append(material)

    return Response(group_materials_by_category(materials_with_stock, request))