from django.contrib import admin
from .models import Supplier, MaterialSupplierPrice


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'kundenkonto']


@admin.register(MaterialSupplierPrice)
class MaterialSupplierPriceAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'material',
        'supplier',
        'price',
        'valid_from',
        'created_at'
    ]
    list_filter = ['supplier', 'valid_from']
    search_fields = ['material__bezeichnung', 'supplier__name', 'note']
    date_hierarchy = 'valid_from'
    ordering = ['-valid_from']


