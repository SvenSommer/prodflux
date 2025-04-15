from rest_framework import serializers
from .models import Product, ProductMaterial, ProductStock, ProductVariant, ProductVersion

class ProductVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVersion
        fields = ['id', 'name', 'description']

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'name', 'description']

class ProductSerializer(serializers.ModelSerializer):
    bild_url = serializers.SerializerMethodField()
    version = ProductVersionSerializer(read_only=True)
    version_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductVersion.objects.all(), source='version', write_only=True, required=False
    )
    varianten = ProductVariantSerializer(many=True, read_only=True)
    varianten_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        source='varianten',
        queryset=ProductVariant.objects.all(),
        required=False
    )

    class Meta:
        model = Product
        fields = [
            'id', 'bezeichnung', 'artikelnummer',
            'version', 'version_id',
            'varianten', 'varianten_ids',
            'bild', 'bild_url', 'angelegt_am'
        ]
        read_only_fields = ['id', 'angelegt_am']

    def get_bild_url(self, obj):
        request = self.context.get('request')
        if obj.bild and request:
            return request.build_absolute_uri(obj.bild.url)
        elif obj.bild:
            return obj.bild.url
        return None

class ProductMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductMaterial
        fields = '__all__'

class ProductStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductStock
        fields = '__all__'