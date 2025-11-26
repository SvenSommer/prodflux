# models.py (in materials)

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from core.models import Workshop
from decimal import Decimal, ROUND_HALF_UP


class Supplier(models.Model):
    """Lieferant für Materialien"""
    name = models.CharField(max_length=255)
    url = models.URLField(blank=True)
    kundenkonto = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class MaterialCategory(models.Model):
    name = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class Material(models.Model):
    bezeichnung = models.CharField(max_length=255)
    hersteller_bezeichnung = models.CharField(max_length=255, blank=True)
    bestell_nr = models.CharField(max_length=100, blank=True)
    bild = models.ImageField(upload_to='material_images/', null=True, blank=True)
    category = models.ForeignKey(MaterialCategory, null=True, blank=True, on_delete=models.SET_NULL, related_name='materials')
    alternatives = models.ManyToManyField('self', symmetrical=False, blank=True, related_name='alternative_to')
    suppliers = models.ManyToManyField(Supplier, blank=True, related_name='materials')
    deprecated = models.BooleanField(
        default=False,
        help_text="Material ist veraltet und wird nicht mehr verwendet"
    )

    def __str__(self):
        return self.bezeichnung

class MaterialMovement(models.Model):
    CHANGE_TYPES = [
        ('lieferung', 'Lieferung'),
        ('verbrauch', 'Verbrauch'),
        ('verlust', 'Verlust'),
        ('korrektur', 'Korrektur'),
        ('transfer', 'Transfer'),
        ('inventur', 'Inventur'),
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
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.PROTECT,
        related_name='orders'
    )
    order_number = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        help_text='Bestellnummer (z.B. ORD-2025-001)'
    )
    bestellt_am = models.DateField()
    versandkosten = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    versandkosten_mwst_satz = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=19.00,
        help_text='MwSt.-Satz für Versandkosten in Prozent'
    )
    notiz = models.TextField(blank=True)
    is_historical = models.BooleanField(
        default=False,
        help_text=(
            'Historische Bestellungen haben keine Auswirkung '
            'auf den Materialbestand'
        )
    )
    
    @property
    def delivered_at(self):
        """Returns the earliest delivery date (as date, not datetime) or None"""
        # Handle both old related_name (delivery_set) and new (deliveries)
        try:
            deliveries = self.deliveries.all()
        except AttributeError:
            deliveries = self.delivery_set.all()
        
        earliest = deliveries.order_by('created_at').values_list('created_at', flat=True).first()
        return earliest.date() if earliest else None

class OrderItem(models.Model):
    order = models.ForeignKey(
        Order, related_name='items', on_delete=models.CASCADE
    )
    material = models.ForeignKey(Material, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    preis_pro_stueck = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Netto-Preis pro Stück'
    )
    mwst_satz = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=19.00,
        help_text='MwSt.-Satz in Prozent (z.B. 19.00 für 19%)'
    )
    preis_pro_stueck_mit_versand = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
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
    delivered_at = models.DateField(
        null=True,
        blank=True,
        help_text='Datum der tatsächlichen Lieferung'
    )
    note = models.TextField(blank=True)
    order = models.ForeignKey(
        Order,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='deliveries'
    )
    is_historical = models.BooleanField(
        default=False,
        help_text=(
            'Historische Lieferungen haben keine Auswirkung '
            'auf den Materialbestand'
        )
    )


class DeliveryItem(models.Model):
    delivery = models.ForeignKey(
        Delivery,
        related_name='items',
        on_delete=models.CASCADE
    )
    material = models.ForeignKey(Material, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    note = models.TextField(blank=True)
