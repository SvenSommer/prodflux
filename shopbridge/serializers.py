from rest_framework import serializers
from .models import EmailTemplate, ShippingCountryConfig


class EmailTemplateSerializer(serializers.ModelSerializer):
    language_display = serializers.CharField(
        source='get_language_display',
        read_only=True
    )
    template_type_display = serializers.CharField(
        source='get_template_type_display',
        read_only=True
    )

    class Meta:
        model = EmailTemplate
        fields = [
            'id',
            'name',
            'language',
            'language_display',
            'template_type',
            'template_type_display',
            'subject',
            'body',
            'is_active',
            'is_default',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class EmailTemplateRenderSerializer(serializers.Serializer):
    """Serializer für das Rendern eines Templates mit Kontext."""
    template_id = serializers.IntegerField(required=False, allow_null=True)
    language = serializers.CharField(max_length=5, required=False, allow_blank=True)
    template_type = serializers.CharField(
        max_length=50,
        default='order_shipped',
        required=False
    )

    # Kontext für Platzhalter
    first_name = serializers.CharField(
        max_length=100, required=False, allow_blank=True
    )
    last_name = serializers.CharField(
        max_length=100, required=False, allow_blank=True
    )
    order_number = serializers.CharField(
        max_length=50, required=False, allow_blank=True
    )
    tracking_link = serializers.CharField(
        max_length=500, required=False, allow_blank=True
    )
    company_name = serializers.CharField(
        max_length=200, required=False, allow_blank=True
    )
    email = serializers.CharField(
        max_length=254, required=True, allow_blank=False
    )

    def validate_email(self, value):
        """E-Mail-Adresse validieren, aber nicht zu strikt."""
        if not value or '@' not in value:
            raise serializers.ValidationError("Gültige E-Mail-Adresse erforderlich")
        return value

    def validate(self, data):
        if not data.get('template_id') and not data.get('language'):
            raise serializers.ValidationError(
                "Entweder 'template_id' oder 'language' muss angegeben werden."
            )
        return data


class ShippingCountryConfigSerializer(serializers.ModelSerializer):
    """Serializer für Versandkonfiguration pro Land."""
    
    shipping_type_display = serializers.CharField(
        source='get_shipping_type_display',
        read_only=True
    )
    dhl_product_display = serializers.CharField(
        source='get_dhl_product_display',
        read_only=True
    )

    class Meta:
        model = ShippingCountryConfig
        fields = [
            'id',
            'country_code',
            'country_name',
            'shipping_type',
            'shipping_type_display',
            'dhl_product',
            'dhl_product_display',
            'external_link',
            'external_link_label',
            'is_active',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_country_code(self, value):
        """Ländercode in Großbuchstaben umwandeln."""
        return value.upper() if value else value

    def validate(self, data):
        """Validiert die Konfiguration basierend auf dem Versandtyp."""
        shipping_type = data.get('shipping_type', 'dhl_product')
        
        if shipping_type == 'dhl_product':
            if not data.get('dhl_product'):
                raise serializers.ValidationError({
                    'dhl_product': 'DHL Produkt ist erforderlich.'
                })
        elif shipping_type == 'external_link':
            if not data.get('external_link'):
                raise serializers.ValidationError({
                    'external_link': 'Externer Link ist erforderlich.'
                })
        
        return data
