from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Delivery, Material, MaterialMovement
from .serializers import DeliverySerializer, MaterialSerializer, MaterialMovementSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum
from .models import MaterialMovement

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
        return MaterialMovement.objects.filter(material_id=material_id)

    def perform_create(self, serializer):
        material_id = self.kwargs['pk']
        serializer.save(material_id=material_id)

class DeliveryListCreateView(generics.ListCreateAPIView):
    queryset = Delivery.objects.all().order_by('-created_at')
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]

class DeliveryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
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
        if m.change_type in ['lieferung', 'korrektur']:
            total += m.quantity
        elif m.change_type in ['verbrauch', 'verlust']:
            total -= m.quantity

    return Response({
        "material_id": material_id,
        "workshop_id": workshop_id,
        "current_stock": total
    })