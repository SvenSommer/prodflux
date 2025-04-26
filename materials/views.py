from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Delivery, Material, MaterialCategory, MaterialMovement, MaterialTransfer, Order
from .serializers import DeliverySerializer, MaterialCategorySerializer, MaterialSerializer, MaterialMovementSerializer, MaterialTransferSerializer, OrderSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

class MaterialListCreateView(generics.ListCreateAPIView):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    permission_classes = [IsAuthenticated]

class MaterialDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    permission_classes = [IsAuthenticated]

class MaterialMovementListCreateView(generics.ListCreateAPIView):
    serializer_class = MaterialMovementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        material_id = self.kwargs['pk']
        workshop_id = self.request.query_params.get('workshop_id')

        queryset = MaterialMovement.objects.filter(material_id=material_id)

        if workshop_id:
            queryset = queryset.filter(workshop_id=workshop_id)

        return queryset

    def perform_create(self, serializer):
        material_id = self.kwargs['pk']
        serializer.save(material_id=material_id)
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

    movements = MaterialMovement.objects.filter(
        material_id=material_id,
        workshop_id=workshop_id
    )

    total = 0
    for m in movements:
        if m.change_type in ['lieferung', 'korrektur', 'transfer']:
            total += m.quantity
        elif m.change_type in ['verbrauch', 'verlust']:
            total -= m.quantity

    return Response({
        "material_id": material_id,
        "workshop_id": workshop_id,
        "current_stock": total
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_materials_stock_by_workshop(request, workshop_id):
    materials = Material.objects.all()
    response_data = []

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

        response_data.append({
            "material_id": material.id,
            "bezeichnung": material.bezeichnung,
            "bestand": total,
            "bild_url": request.build_absolute_uri(material.bild.url) if material.bild else None
        })

    return Response(response_data)
