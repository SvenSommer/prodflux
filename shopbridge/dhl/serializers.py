"""Serializers for DHL API endpoints."""
from rest_framework import serializers


class AddressSerializer(serializers.Serializer):
    """Serializer for postal addresses."""
    
    name1 = serializers.CharField(max_length=50)
    name2 = serializers.CharField(max_length=50, required=False, allow_blank=True)
    name3 = serializers.CharField(max_length=50, required=False, allow_blank=True)
    street = serializers.CharField(max_length=50)
    house_number = serializers.CharField(max_length=10)
    postal_code = serializers.CharField(max_length=10)
    city = serializers.CharField(max_length=50)
    country = serializers.CharField(max_length=3, default="DEU")
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)


class ShipmentDetailsSerializer(serializers.Serializer):
    """Serializer for shipment weight and dimensions."""
    
    weight_kg = serializers.FloatField(min_value=0.01, max_value=31.5)
    length_cm = serializers.IntegerField(min_value=1, required=False)
    width_cm = serializers.IntegerField(min_value=1, required=False)
    height_cm = serializers.IntegerField(min_value=1, required=False)


class CreateLabelRequestSerializer(serializers.Serializer):
    """Serializer for label creation request."""
    
    consignee = AddressSerializer()
    details = ShipmentDetailsSerializer()
    product = serializers.ChoiceField(
        choices=[
            ("V62KP", "DHL Kleinpaket"),
            ("V01PAK", "DHL Paket"),
            ("V62WP", "Warenpost National"),
            ("V66WPI", "Warenpost International"),
        ],
        default="V62KP"
    )
    reference = serializers.CharField(max_length=35, required=False)
    shipper = AddressSerializer(required=False)
    print_format = serializers.ChoiceField(
        choices=[
            ("910-300-356", "100x150 Thermo"),
            ("910-300-300", "100x200 Thermo"),
            ("910-300-700", "A4"),
            ("910-300-710", "100x200"),
            ("910-300-600", "103x199"),
            ("910-300-400", "100x70 (Warenpost)"),
        ],
        default="910-300-356",
        required=False
    )
    services = serializers.DictField(
        child=serializers.JSONField(),
        required=False
    )
    # Optional WooCommerce order tracking
    woocommerce_order_id = serializers.IntegerField(required=False)
    woocommerce_order_number = serializers.CharField(
        max_length=50, required=False, allow_blank=True
    )


class LabelResultSerializer(serializers.Serializer):
    """Serializer for label creation response."""
    
    success = serializers.BooleanField()
    shipment_number = serializers.CharField(allow_null=True)
    label_pdf_base64 = serializers.CharField(allow_null=True)
    label_format = serializers.CharField()
    routing_code = serializers.CharField(allow_null=True)
    reference = serializers.CharField(allow_null=True)
    warnings = serializers.ListField(
        child=serializers.CharField(),
        default=list
    )
    error = serializers.CharField(allow_null=True)


class CreateLabelFromOrderSerializer(serializers.Serializer):
    """Simplified serializer for creating label from WooCommerce order."""
    
    order_id = serializers.IntegerField()
    product = serializers.ChoiceField(
        choices=[
            ("V62KP", "DHL Kleinpaket"),
            ("V01PAK", "DHL Paket"),
            ("V62WP", "Warenpost National"),
            ("V66WPI", "Warenpost International"),
        ],
        default="V62KP"
    )
    weight_kg = serializers.FloatField(min_value=0.01, default=0.5)


class DHLConfigSerializer(serializers.Serializer):
    """Serializer for DHL configuration status."""
    
    environment = serializers.CharField()
    is_sandbox = serializers.BooleanField()
    customer_number = serializers.CharField()
    api_configured = serializers.BooleanField()
