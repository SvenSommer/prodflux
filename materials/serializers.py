# serializers.py (in materials)

from decimal import Decimal
from rest_framework import serializers

from core.models import Workshop
from .models import (
    Material,
    MaterialCategory,
    MaterialMovement,
    Delivery,
    DeliveryItem,
    MaterialTransfer,
    MaterialTransferItem,
    Order,
    OrderItem,
    Supplier,
    MaterialSupplierPrice
)
from .validators import validate_stock_movement
from django.contrib.contenttypes.models import ContentType
from django.db.models import Sum


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'url', 'kundenkonto', 'notes', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class MaterialCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialCategory
        fields = ['id', 'name', 'order']

class MaterialSerializer(serializers.ModelSerializer):
    bild_url = serializers.SerializerMethodField()
    category = MaterialCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=MaterialCategory.objects.all(), source='category', write_only=True, required=False)
    alternatives = serializers.PrimaryKeyRelatedField(queryset=Material.objects.all(), many=True, required=False)
    suppliers = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.all(),
        many=True,
        required=False
    )
    supplier_details = serializers.SerializerMethodField()
    current_stock = serializers.SerializerMethodField()

    class Meta:
        model = Material
        fields = [
            'id', 'bezeichnung', 'hersteller_bezeichnung', 'bestell_nr',
            'bild', 'bild_url',
            'category', 'category_id',
            'alternatives', 'suppliers', 'supplier_details', 'deprecated',
            'current_stock'
        ]

    def get_bild_url(self, obj):
        request = self.context.get('request')
        if obj.bild and request:
            return request.build_absolute_uri(obj.bild.url)
        elif obj.bild:
            return obj.bild.url
        return None

    def get_supplier_details(self, obj):
        return [
            {'id': supplier.id, 'name': supplier.name}
            for supplier in obj.suppliers.all()
        ]

    def get_current_stock(self, obj):
        return getattr(obj, 'current_stock', None)

class MaterialMovementSerializer(serializers.ModelSerializer):
    workshop_id = serializers.PrimaryKeyRelatedField(
        queryset=Workshop.objects.all(),
        source='workshop',
        write_only=True
    )

    class Meta:
        model = MaterialMovement
        fields = [
            'id', 'workshop_id', 'change_type', 'quantity', 'note',
            'created_at', 'content_type', 'object_id'
        ]
        read_only_fields = ['id', 'created_at', 'content_type', 'object_id']

    def create(self, validated_data):
        change_type = validated_data.get("change_type")

        if change_type == "inventur":
            workshop = validated_data["workshop"]
            material = self.context["material"]  # vom View übergeben (s. unten)

            # Aktuellen Bestand berechnen
            bestand = MaterialMovement.objects.filter(workshop=workshop, material=material).aggregate(
                total=Sum("quantity"))["total"] or Decimal("0.00")

            zielwert = validated_data["quantity"]
            differenz = zielwert - bestand
            note = "Inventur-Korrektur: Sollwert {} - Istwert {} = Differenz {}".format(
                zielwert, bestand, differenz
            )

            validated_data["note"] = note

            # Wenn keine Änderung nötig → nichts speichern
            if differenz == 0:
                raise serializers.ValidationError("Der Bestand ist bereits korrekt.")

            validated_data["quantity"] = differenz
            validated_data["change_type"] = "korrektur"
            validated_data["material"] = material

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Prüfen: Gehört diese Bewegung zu einem Transfer oder einer Lieferung?
        if instance.content_type:
            raise serializers.ValidationError("Verknüpfte Materialbewegungen können nicht bearbeitet werden.")
        return super().update(instance, validated_data)

    def delete(self, instance):
        # (falls du Löschfunktion in Serializer selbst kontrollierst)
        if instance.content_type:
            raise serializers.ValidationError("Verknüpfte Materialbewegungen können nicht gelöscht werden.")
        return super().delete(instance)


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
        
        # Validiere alle Transfers BEVOR der Transfer erstellt wird
        for item_data in items_data:
            material = item_data['material']
            quantity = item_data['quantity']
            
            # Prüfe ob genug Material in der Quellwerkstatt vorhanden ist
            is_valid, current_stock, message = validate_stock_movement(
                material.id,
                validated_data['source_workshop'].id,
                -quantity  # Negativ, weil Abgang
            )
            
            if not is_valid:
                raise serializers.ValidationError({
                    'items': f"Material '{material.bezeichnung}' in "
                    f"'{validated_data['source_workshop'].name}': {message}"
                })
        
        # Alle Validierungen erfolgreich - Transfer erstellen
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

        # Validiere alle Transfers BEVOR die Bewegungen erstellt werden
        for item_data in items_data:
            material = item_data['material']
            quantity = item_data['quantity']
            
            # Prüfe ob genug Material in der Quellwerkstatt vorhanden ist
            # Berücksichtige dabei die alten Bewegungen, die gelöscht werden
            is_valid, current_stock, message = validate_stock_movement(
                material.id,
                validated_data.get('source_workshop', instance.source_workshop).id,
                -quantity  # Negativ, weil Abgang
            )
            
            if not is_valid:
                raise serializers.ValidationError({
                    'items': f"Material '{material.bezeichnung}': {message}"
                })

        # Update Basisdaten
        instance.source_workshop = validated_data.get(
            'source_workshop', instance.source_workshop
        )
        instance.target_workshop = validated_data.get(
            'target_workshop', instance.target_workshop
        )
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
    order_detail = serializers.SerializerMethodField()

    class Meta:
        model = Delivery
        fields = [
            'id', 'workshop', 'created_at', 'delivered_at', 'note', 'order',
            'order_detail', 'is_historical', 'items'
        ]
        read_only_fields = ['id', 'created_at']

    def get_order_detail(self, obj):
        """
        Return order details if delivery is linked to an order.
        Returns None if no order is associated.
        """
        if not obj.order:
            return None
        return {
            'id': obj.order.id,
            'order_number': obj.order.order_number,
            'supplier': obj.order.supplier_id,
            'supplier_name': obj.order.supplier.name,
        }

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        delivery = Delivery.objects.create(**validated_data)
        
        # Check if this delivery is historical OR linked to a historical order
        is_historical = (
            delivery.is_historical or
            (delivery.order and delivery.order.is_historical)
        )
        
        for item_data in items_data:
            DeliveryItem.objects.create(delivery=delivery, **item_data)

            # Only create MaterialMovement if not historical
            if not is_historical:
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
        instance.order = validated_data.get('order', instance.order)
        instance.is_historical = validated_data.get(
            'is_historical', instance.is_historical
        )
        instance.save()

        # Check if this delivery is historical OR linked to a historical order
        is_historical = (
            instance.is_historical or
            (instance.order and instance.order.is_historical)
        )

        # Alte Items und zugehörige Bewegungen löschen
        instance.items.all().delete()
        MaterialMovement.objects.filter(
            content_type=ContentType.objects.get_for_model(Delivery),
            object_id=instance.id
        ).delete()

        # Neue Items und Bewegungen anlegen
        for item_data in items_data:
            DeliveryItem.objects.create(delivery=instance, **item_data)

            # Only create MaterialMovement if not historical
            if not is_historical:
                MaterialMovement.objects.create(
                    workshop=instance.workshop,
                    material=item_data['material'],
                    change_type='lieferung',
                    quantity=item_data['quantity'],
                    note=(
                        f"Lieferung #{instance.id} - "
                        f"{item_data.get('note', '')}"
                    ),
                    content_type=ContentType.objects.get_for_model(instance),
                    object_id=instance.id
                )

        return instance


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id', 'material', 'quantity',
            'preis_pro_stueck', 'mwst_satz',
            'preis_pro_stueck_mit_versand', 'artikelnummer'
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    angekommen_am = serializers.DateField(
        source='delivered_at',
        read_only=True
    )

    class Meta:
        model = Order
        fields = [
            'id', 'supplier', 'order_number', 'bestellt_am',
            'angekommen_am', 'versandkosten', 'versandkosten_mwst_satz',
            'notiz', 'is_historical', 'items'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        
        # Auto-generate order_number if empty
        if not order.order_number:
            year = order.bestellt_am.year if order.bestellt_am else ''
            if year:
                order.order_number = f'ORD-{year}-{order.id:05d}'
            else:
                order.order_number = f'ORD-{order.id:05d}'
            order.save(update_fields=['order_number'])
        
        # Add supplier to materials if not already assigned
        if order.supplier:
            for item in items_data:
                material = item['material']
                supplier_id = order.supplier.id
                if not material.suppliers.filter(id=supplier_id).exists():
                    material.suppliers.add(order.supplier)
        
        for item in items_data:
            OrderItem.objects.create(order=order, **item)
        return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        
        # Update order fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Auto-generate order_number if empty
        if not instance.order_number:
            year = instance.bestellt_am.year if instance.bestellt_am else ''
            if year:
                instance.order_number = f'ORD-{year}-{instance.id:05d}'
            else:
                instance.order_number = f'ORD-{instance.id:05d}'
            instance.save(update_fields=['order_number'])

        # Add supplier to materials if not already assigned
        if instance.supplier:
            for item in items_data:
                material = item['material']
                supplier_id = instance.supplier.id
                if not material.suppliers.filter(id=supplier_id).exists():
                    material.suppliers.add(instance.supplier)

        # Replace items
        instance.items.all().delete()
        for item in items_data:
            OrderItem.objects.create(order=instance, **item)

        return instance


class MaterialSupplierPriceSerializer(serializers.ModelSerializer):
    """Serializer für manuelle Lieferantenpreise"""
    supplier_name = serializers.CharField(
        source='supplier.name',
        read_only=True
    )
    material_name = serializers.CharField(
        source='material.bezeichnung',
        read_only=True
    )

    class Meta:
        model = MaterialSupplierPrice
        fields = [
            'id', 'material', 'material_name', 'supplier', 'supplier_name',
            'price', 'valid_from', 'note', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MaterialSupplierPriceOverviewSerializer(serializers.Serializer):
    """
    Übersicht über Lieferantenpreise für ein Material.
    Kombiniert manuelle Preise und letzte Bestellpreise.
    """
    supplier_id = serializers.IntegerField()
    supplier_name = serializers.CharField()
    manual_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=5,
        allow_null=True
    )
    manual_price_valid_from = serializers.DateField(allow_null=True)
    manual_price_note = serializers.CharField(allow_null=True)
    last_order_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=5,
        allow_null=True
    )
    last_order_price_with_shipping = serializers.DecimalField(
        max_digits=10,
        decimal_places=5,
        allow_null=True
    )
    last_order_date = serializers.DateField(allow_null=True)
    last_order_number = serializers.CharField(allow_null=True)

