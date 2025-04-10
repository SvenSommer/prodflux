from rest_framework import serializers
from .models import Material, MaterialMovement, Delivery, DeliveryItem

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'

class MaterialMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialMovement
        fields = '__all__'

class DeliveryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryItem
        fields = ['material', 'quantity', 'note']

class DeliverySerializer(serializers.ModelSerializer):
    items = DeliveryItemSerializer(many=True)

    class Meta:
        model = Delivery
        fields = ['id', 'workshop', 'created_at', 'note', 'items']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        delivery = Delivery.objects.create(**validated_data)
        for item_data in items_data:
            DeliveryItem.objects.create(delivery=delivery, **item_data)
        return delivery
