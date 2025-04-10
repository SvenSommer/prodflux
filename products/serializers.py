from rest_framework import serializers
from .models import Product, ProductMaterial, ProductStock

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class ProductMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductMaterial
        fields = '__all__'

class ProductStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductStock
        fields = '__all__'