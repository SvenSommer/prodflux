from django.db import models
from core.models import Workshop
from materials.models import Material, MaterialMovement

class Product(models.Model):
    bezeichnung = models.CharField(max_length=255)
    artikelnummer = models.CharField(max_length=100, unique=True)
    bild = models.ImageField(upload_to='product_images/', null=True, blank=True)
    angelegt_am = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.bezeichnung

class ProductMaterial(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    material = models.ForeignKey(Material, on_delete=models.CASCADE)
    quantity_per_unit = models.DecimalField(max_digits=10, decimal_places=2)

class ProductStock(models.Model):
    workshop = models.ForeignKey(Workshop, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    bestand = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        unique_together = ('workshop', 'product')