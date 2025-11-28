"""DHL API Views."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .config import DHLConfig
from .client import DHLClient, DHLClientError
from .shipment_service import ShipmentService
from .models import Shipment, Address, ShipmentDetails
from .serializers import (
    CreateLabelRequestSerializer,
    LabelResultSerializer,
    DHLConfigSerializer,
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dhl_config_view(request):
    """Get current DHL configuration status."""
    config = DHLConfig.from_env()
    
    data = {
        "environment": config.environment,
        "is_sandbox": config.is_sandbox,
        "customer_number": config.customer_number[:4] + "******",
        "api_configured": bool(config.api_key and config.user),
    }
    
    serializer = DHLConfigSerializer(data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dhl_health_check_view(request):
    """Check DHL API connection."""
    try:
        config = DHLConfig.from_env()
        client = DHLClient(config)
        is_healthy = client.health_check()
        
        return Response({
            "status": "ok" if is_healthy else "error",
            "environment": config.environment,
            "message": "API connection successful" if is_healthy else "Failed",
        })
    except Exception as e:
        return Response({
            "status": "error",
            "message": str(e),
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dhl_create_label_view(request):
    """Create a DHL shipping label."""
    serializer = CreateLabelRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    data = serializer.validated_data
    service = ShipmentService()
    
    # Build consignee address
    consignee_data = data['consignee']
    consignee = Address(
        name1=consignee_data['name1'],
        name2=consignee_data.get('name2'),
        name3=consignee_data.get('name3'),
        street=consignee_data['street'],
        house_number=consignee_data['house_number'],
        postal_code=consignee_data['postal_code'],
        city=consignee_data['city'],
        country=consignee_data.get('country', 'DEU'),
        email=consignee_data.get('email'),
        phone=consignee_data.get('phone'),
    )
    
    # Build shipper (use provided or default)
    if 'shipper' in data and data['shipper']:
        shipper_data = data['shipper']
        shipper = Address(
            name1=shipper_data['name1'],
            street=shipper_data['street'],
            house_number=shipper_data['house_number'],
            postal_code=shipper_data['postal_code'],
            city=shipper_data['city'],
            country=shipper_data.get('country', 'DEU'),
        )
    else:
        shipper = service.get_default_shipper()
    
    # Build shipment details
    details_data = data['details']
    details = ShipmentDetails(
        weight_kg=details_data['weight_kg'],
        length_cm=details_data.get('length_cm'),
        width_cm=details_data.get('width_cm'),
        height_cm=details_data.get('height_cm'),
    )
    
    # Create shipment
    shipment = Shipment(
        shipper=shipper,
        consignee=consignee,
        details=details,
        product=data.get('product', 'V01PAK'),
        reference=data.get('reference'),
    )
    
    # Get print format
    print_format = data.get('print_format', '910-300-710')
    
    # Create label
    result = service.create_label(shipment, print_format)
    
    response_serializer = LabelResultSerializer(result.__dict__)
    
    if result.success:
        return Response(response_serializer.data)
    else:
        return Response(
            response_serializer.data,
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def dhl_delete_shipment_view(request, shipment_number):
    """Delete/cancel a DHL shipment."""
    service = ShipmentService()
    success = service.delete_shipment(shipment_number)
    
    if success:
        return Response({"status": "deleted"})
    else:
        return Response(
            {"error": "Failed to delete shipment"},
            status=status.HTTP_400_BAD_REQUEST
        )
