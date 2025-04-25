# serializers.py (in materials)

from rest_framework import serializers
from .models import Material, MaterialMovement, Delivery, DeliveryItem, MaterialTransfer, MaterialTransferItem, Order, OrderItem
from django.contrib.contenttypes.models import ContentType

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


class MaterialTransferItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialTransferItem
        fields = ['material', 'quantity', 'note']

class MaterialTransferSerializer(serializers.ModelSerializer):
    items = MaterialTransferItemSerializer(many=True)

    class Meta:
        model = MaterialTransfer
        fields = ['id', 'source_workshop', 'target_workshop', 'note', 'created_at', 'items']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        transfer = MaterialTransfer.objects.create(**validated_data)
        for item_data in items_data:
            MaterialTransferItem.objects.create(transfer=transfer, **item_data)

            # Jetzt MaterialMovements erzeugen (Verbrauch + Lieferung)
            material = item_data['material']
            quantity = item_data['quantity']
            note = item_data.get('note', '')

           # Verbrauch im Quell-Workshop (change_type = 'transfer')
            MaterialMovement.objects.create(
                workshop=transfer.source_workshop,
                material=material,
                change_type='transfer', 
                quantity=-quantity,  # <<< Abgang = negatives Lager
                note=f"Transfer #{transfer.id} - {note}",
                content_type=ContentType.objects.get_for_model(transfer),
                object_id=transfer.id
            )

            # Zugang im Ziel-Workshop (change_type = 'transfer')
            MaterialMovement.objects.create(
                workshop=transfer.target_workshop,
                material=material,
                change_type='transfer',
                quantity=quantity,  # <<< Zugang = positives Lager
                note=f"Transfer #{transfer.id} - {note}",
                content_type=ContentType.objects.get_for_model(transfer),
                object_id=transfer.id
            )
        return transfer

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])

        # Update Basisdaten
        instance.source_workshop = validated_data.get('source_workshop', instance.source_workshop)
        instance.target_workshop = validated_data.get('target_workshop', instance.target_workshop)
        instance.note = validated_data.get('note', instance.note)
        instance.save()

        # Bisherige Items und zugehörige Bewegungen löschen
        instance.items.all().delete()
        MaterialMovement.objects.filter(
            content_type=ContentType.objects.get_for_model(MaterialTransfer),
            object_id=instance.id
        ).delete()

        # Neue Items und Bewegungen anlegen
        for item_data in items_data:
            MaterialTransferItem.objects.create(transfer=instance, **item_data)

            material = item_data['material']
            quantity = item_data['quantity']
            note = item_data.get('note', '')

            MaterialMovement.objects.create(
                workshop=instance.source_workshop,
                material=material,
                change_type='transfer',
                quantity=-quantity,
                note=f"Transfer #{instance.id} - {note}",
                content_type=ContentType.objects.get_for_model(instance),
                object_id=instance.id
            )

            MaterialMovement.objects.create(
                workshop=instance.target_workshop,
                material=material,
                change_type='transfer',
                quantity=quantity,
                note=f"Transfer #{instance.id} - {note}",
                content_type=ContentType.objects.get_for_model(instance),
                object_id=instance.id
            )

        return instance

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

            # MaterialMovement erstellen
            MaterialMovement.objects.create(
                workshop=delivery.workshop,
                material=item_data['material'],
                change_type='lieferung',
                quantity=item_data['quantity'],
                note=f"Lieferung #{delivery.id} - {item_data.get('note', '')}",
                content_type=ContentType.objects.get_for_model(delivery),
                object_id=delivery.id
            )

        return delivery

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])

        instance.note = validated_data.get('note', instance.note)
        instance.workshop = validated_data.get('workshop', instance.workshop)
        instance.save()

        # Alte Items und zugehörige Bewegungen löschen
        instance.items.all().delete()
        MaterialMovement.objects.filter(
            content_type=ContentType.objects.get_for_model(Delivery),
            object_id=instance.id
        ).delete()

        # Neue Items und Bewegungen anlegen
        for item_data in items_data:
            DeliveryItem.objects.create(delivery=instance, **item_data)

            MaterialMovement.objects.create(
                workshop=instance.workshop,
                material=item_data['material'],
                change_type='lieferung',
                quantity=item_data['quantity'],
                note=f"Lieferung #{instance.id} - {item_data.get('note', '')}",
                content_type=ContentType.objects.get_for_model(instance),
                object_id=instance.id
            )

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