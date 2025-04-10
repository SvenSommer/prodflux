# models.py (in materials)

from django.db import models
from core.models import Workshop

class Material(models.Model):
    bezeichnung = models.CharField(max_length=255)
    hersteller_bezeichnung = models.CharField(max_length=255, blank=True)
    preis_brutto = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    quelle = models.CharField(max_length=255, blank=True)
    bestell_nr = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.bezeichnung

class MaterialMovement(models.Model):
    CHANGE_TYPES = [
        ('lieferung', 'Lieferung'),
        ('verbrauch', 'Verbrauch'),
        ('verlust', 'Verlust'),
        ('korrektur', 'Korrektur'),
    ]
    workshop = models.ForeignKey(Workshop, on_delete=models.CASCADE)
    material = models.ForeignKey(Material, on_delete=models.CASCADE)
    change_type = models.CharField(max_length=50, choices=CHANGE_TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Delivery(models.Model):
    workshop = models.ForeignKey(Workshop, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True)

class DeliveryItem(models.Model):
    delivery = models.ForeignKey(Delivery, related_name='items', on_delete=models.CASCADE)
    material = models.ForeignKey(Material, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    note = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        MaterialMovement.objects.create(
            workshop=self.delivery.workshop,
            material=self.material,
            change_type='lieferung',
            quantity=self.quantity,
            note=f"Lieferung #{self.delivery.id} - {self.note}"
        )
