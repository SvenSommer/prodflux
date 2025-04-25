# models.py (in materials)

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from core.models import Workshop
from decimal import Decimal, ROUND_HALF_UP


class Material(models.Model):
    bezeichnung = models.CharField(max_length=255)
    hersteller_bezeichnung = models.CharField(max_length=255, blank=True)
    bestell_nr = models.CharField(max_length=100, blank=True)
    bild = models.ImageField(upload_to='material_images/', null=True, blank=True)

    def __str__(self):
        return self.bezeichnung

class MaterialMovement(models.Model):
    CHANGE_TYPES = [
        ('lieferung', 'Lieferung'),
        ('verbrauch', 'Verbrauch'),
        ('verlust', 'Verlust'),
        ('korrektur', 'Korrektur'),
        ('transfer', 'Transfer'),
    ]
    workshop = models.ForeignKey(Workshop, on_delete=models.CASCADE)
    material = models.ForeignKey(Material, on_delete=models.CASCADE)
    change_type = models.CharField(max_length=50, choices=CHANGE_TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Erweiterung: Verknüpfung zu auslösendem Objekt (Lieferung, Transfer etc.)
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    source_object = GenericForeignKey('content_type', 'object_id')

class MaterialTransfer(models.Model):
    source_workshop = models.ForeignKey(Workshop, related_name='outgoing_transfers', on_delete=models.CASCADE)
    target_workshop = models.ForeignKey(Workshop, related_name='incoming_transfers', on_delete=models.CASCADE)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Transfer {self.id} von {self.source_workshop} zu {self.target_workshop}"

class MaterialTransferItem(models.Model):
    transfer = models.ForeignKey(MaterialTransfer, related_name='items', on_delete=models.CASCADE)
    material = models.ForeignKey(Material, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    note = models.TextField(blank=True)

class Order(models.Model):
    bestellt_am = models.DateField()
    angekommen_am = models.DateField(null=True, blank=True)
    versandkosten = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notiz = models.TextField(blank=True)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    material = models.ForeignKey(Material, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    preis_pro_stueck = models.DecimalField(max_digits=10, decimal_places=2)
    preis_pro_stueck_mit_versand = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    quelle = models.CharField(max_length=255, blank=True)

    def berechne_versandanteil(self):
        if not self.order.versandkosten or self.order.versandkosten == 0:
            return self.preis_pro_stueck

        gesamtmenge = sum(item.quantity for item in self.order.items.all())
        if gesamtmenge == 0:
            return self.preis_pro_stueck

        versand_anteil = (self.quantity / gesamtmenge) * self.order.versandkosten
        gesamtpreis = self.preis_pro_stueck + (versand_anteil / self.quantity)

        return Decimal(gesamtpreis).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    def save(self, *args, **kwargs):
        self.preis_pro_stueck_mit_versand = self.berechne_versandanteil()
        super().save(*args, **kwargs)

class Delivery(models.Model):
    workshop = models.ForeignKey(Workshop, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True)
    order = models.ForeignKey(Order, null=True, blank=True, on_delete=models.SET_NULL)

class DeliveryItem(models.Model):
    delivery = models.ForeignKey(Delivery, related_name='items', on_delete=models.CASCADE)
    material = models.ForeignKey(Material, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    note = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        # Lösche ggf. alte Bewegungen für diese Kombination
        MaterialMovement.objects.filter(
            workshop=self.delivery.workshop,
            material=self.material,
            change_type='lieferung',
            note__startswith=f"Lieferung #{self.delivery.id}"
        ).delete()

        super().save(*args, **kwargs)

        # Neue Bewegung anlegen
        MaterialMovement.objects.create(
            workshop=self.delivery.workshop,
            material=self.material,
            change_type='lieferung',
            quantity=self.quantity,
            note=f"Lieferung #{self.delivery.id} - {self.note}"
        )