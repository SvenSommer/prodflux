# serializers.py (in materials)

from rest_framework import serializers
from .models import Material, MaterialMovement, Delivery, DeliveryItem, Order, OrderItem

class MaterialSerializer(serializers.ModelSerializer):
    bild_url = serializers.SerializerMethodField()

    class Meta:
        model = Material
        fields = ['id', 'bezeichnung', 'hersteller_bezeichnung', 'bestell_nr', 'bild', 'bild_url']

    def get_bild_url(self, obj):
        request = self.context.get('request')
        if obj.bild and request:
            return request.build_absolute_uri(obj.bild.url)
        elif obj.bild:
            return obj.bild.url
        return None

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

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        instance.note = validated_data.get('note', instance.note)
        instance.workshop = validated_data.get('workshop', instance.workshop)
        instance.save()

        instance.items.all().delete()
        for item_data in items_data:
            DeliveryItem.objects.create(delivery=instance, **item_data)

        return instance

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'material', 'quantity', 'preis_pro_stueck', 'preis_pro_stueck_mit_versand', 'quelle']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['id', 'bestellt_am', 'angekommen_am', 'versandkosten', 'notiz', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item in items_data:
            OrderItem.objects.create(order=order, **item)
        return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        instance.items.all().delete()
        for item in items_data:
            OrderItem.objects.create(order=instance, **item)

        return instance