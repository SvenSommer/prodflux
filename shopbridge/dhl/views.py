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
from shopbridge.models import DHLLabel


# DHL Service definitions with product compatibility
DHL_SERVICES = [
    {
        'key': 'goGreen',
        'name': 'GoGreen',
        'description': 'Klimaneutraler Versand',
        'defaultEnabled': True,
        'products': ['V62KP', 'V01PAK', 'V66WPI', 'V53WPAK', 'V54EPAK'],
        'inputType': 'boolean',
    },
    {
        'key': 'premium',
        'name': 'Premium',
        'description': 'Premium-Versand (schnellere Zustellung)',
        'defaultEnabled': True,
        'products': ['V66WPI', 'V53WPAK'],
        'inputType': 'boolean',
    },
    {
        'key': 'economy',
        'name': 'Economy',
        'description': 'Economy-Versand (günstigere Option)',
        'defaultEnabled': False,
        'products': ['V66WPI', 'V53WPAK'],
        'inputType': 'boolean',
    },
    {
        'key': 'goGreenPlus',
        'name': 'GoGreen Plus',
        'description': 'Erweiterter Klimaschutz (kostenpflichtig)',
        'defaultEnabled': False,
        'products': ['V62KP', 'V01PAK', 'V66WPI', 'V53WPAK', 'V54EPAK'],
        'inputType': 'boolean',
    },
    {
        'key': 'preferredLocation',
        'name': 'Ablageort',
        'description': 'Wunschablageort (z.B. Garage, Terrasse)',
        'defaultEnabled': False,
        'products': ['V62KP', 'V01PAK'],
        'inputType': 'text',
        'placeholder': 'z.B. Garage, Terrasse',
        'maxLength': 100,
    },
    {
        'key': 'preferredNeighbour',
        'name': 'Wunschnachbar',
        'description': 'Abgabe bei bestimmtem Nachbarn',
        'defaultEnabled': False,
        'products': ['V01PAK'],
        'inputType': 'text',
        'placeholder': 'z.B. Familie Müller nebenan',
        'maxLength': 100,
    },
    {
        'key': 'parcelOutletRouting',
        'name': 'Filialrouting',
        'description': 'Zustellung an nächste Filiale (Email erforderlich)',
        'defaultEnabled': False,
        'products': ['V01PAK'],
        'inputType': 'email',
        'placeholder': 'Email für Benachrichtigung',
    },
    {
        'key': 'endorsement',
        'name': 'Rücksendung',
        'description': 'Sendung bei Unzustellbarkeit zurücksenden',
        'defaultEnabled': False,
        'products': ['V66WPI', 'V53WPAK'],
        'inputType': 'boolean',
    },
    {
        'key': 'noNeighbourDelivery',
        'name': 'Keine Nachbarzustellung',
        'description': 'Abgabe beim Nachbarn nicht erlaubt',
        'defaultEnabled': False,
        'products': ['V01PAK'],
        'inputType': 'boolean',
    },
]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dhl_services_view(request):
    """Get available DHL services with product compatibility."""
    product = request.query_params.get('product', None)
    
    if product:
        # Filter services for specific product
        services = [
            s for s in DHL_SERVICES if product in s['products']
        ]
    else:
        services = DHL_SERVICES
    
    return Response({
        'services': services,
        'products': [
            {'code': 'V62KP', 'name': 'DHL Kleinpaket'},
            {'code': 'V01PAK', 'name': 'DHL Paket'},
            {'code': 'V62KP', 'name': 'DHL Kleinpaket'},
            {'code': 'V66WPI', 'name': 'Warenpost International'},
            {'code': 'V53WPAK', 'name': 'DHL Paket International'},
            {'code': 'V54EPAK', 'name': 'DHL Europaket'},
        ]
    })


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
def dhl_validate_address_view(request):
    """Validate an address before creating a label."""
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
    
    # Create shipment for validation
    shipment = Shipment(
        shipper=shipper,
        consignee=consignee,
        details=details,
        product=data.get('product', 'V01PAK'),
        reference=data.get('reference'),
    )
    
    # Validate address
    result = service.validate_address(shipment)
    
    return Response(result)


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
    
    # Get services (Value Added Services)
    services = data.get('services', {})
    
    # Create shipment
    shipment = Shipment(
        shipper=shipper,
        consignee=consignee,
        details=details,
        product=data.get('product', 'V01PAK'),
        reference=data.get('reference'),
        services=services,
    )
    
    # Get print format
    print_format = data.get('print_format', '910-300-710')
    
    # Get WooCommerce order info if provided
    woocommerce_order_id = data.get('woocommerce_order_id')
    woocommerce_order_number = data.get('woocommerce_order_number')
    
    # Create label
    result = service.create_label(shipment, print_format)
    
    response_serializer = LabelResultSerializer(result.__dict__)
    
    if result.success:
        # Save label to database
        DHLLabel.objects.create(
            shipment_number=result.shipment_number,
            woocommerce_order_id=woocommerce_order_id,
            woocommerce_order_number=woocommerce_order_number,
            product=data.get('product', 'V01PAK'),
            reference=data.get('reference'),
            label_pdf_base64=result.label_pdf_base64,
            label_format='PDF',
            print_format=print_format,
            routing_code=result.routing_code,
            status='created',
        )
        return Response(response_serializer.data)
    else:
        # Return detailed error information for frontend debugging
        error_response = {
            **response_serializer.data,
            'error_details': result.error_details,
            'validation_errors': result.validation_errors,
            'debug_info': {
                'product': data.get('product'),
                'print_format': print_format,
                'reference': data.get('reference'),
            }
        }
        return Response(
            error_response,
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def dhl_delete_shipment_view(request, shipment_number):
    """Delete/cancel a DHL shipment."""
    service = ShipmentService()
    result = service.delete_shipment(shipment_number)
    
    if result.get('success'):
        # Mark label as deleted in database
        try:
            label = DHLLabel.objects.get(shipment_number=shipment_number)
            label.mark_as_deleted()
        except DHLLabel.DoesNotExist:
            pass  # Label not in our DB, but deletion at DHL was successful
        
        return Response({"status": "deleted"})
    else:
        return Response(
            {"error": result.get('error', 'Failed to delete shipment')},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dhl_labels_by_order_view(request, order_id):
    """Get all DHL labels for a WooCommerce order."""
    labels = DHLLabel.objects.filter(
        woocommerce_order_id=order_id,
        status__in=['created', 'printed']  # Exclude deleted
    ).order_by('-created_at')
    
    labels_data = []
    for label in labels:
        labels_data.append({
            'id': label.id,
            'shipment_number': label.shipment_number,
            'product': label.product,
            'reference': label.reference,
            'print_format': label.print_format,
            'routing_code': label.routing_code,
            'status': label.status,
            'created_at': label.created_at.isoformat(),
            'printed_at': label.printed_at.isoformat() if label.printed_at else None,
            'has_pdf': bool(label.label_pdf_base64),
        })
    
    return Response({
        'order_id': order_id,
        'labels': labels_data,
        'count': len(labels_data),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dhl_label_pdf_view(request, label_id):
    """Get the PDF data for a specific label."""
    try:
        label = DHLLabel.objects.get(id=label_id)
    except DHLLabel.DoesNotExist:
        return Response(
            {"error": "Label not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if not label.label_pdf_base64:
        return Response(
            {"error": "No PDF data available for this label"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    return Response({
        'id': label.id,
        'shipment_number': label.shipment_number,
        'label_b64': label.label_pdf_base64,
        'print_format': label.print_format,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dhl_label_mark_printed_view(request, label_id):
    """Mark a label as printed."""
    try:
        label = DHLLabel.objects.get(id=label_id)
    except DHLLabel.DoesNotExist:
        return Response(
            {"error": "Label not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    label.mark_as_printed()
    
    return Response({
        'id': label.id,
        'status': label.status,
        'printed_at': label.printed_at.isoformat(),
    })
