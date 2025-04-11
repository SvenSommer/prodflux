# serializers.py (in products app)

from rest_framework import serializers
from .models import Product, ProductMaterial, ProductStock

class ProductSerializer(serializers.ModelSerializer):
    bild_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'bezeichnung', 'artikelnummer', 'bild', 'bild_url', 'angelegt_am']
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