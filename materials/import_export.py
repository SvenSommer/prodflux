"""
Import/Export utilities for Suppliers, Orders and Material Supplier Prices
Supports JSON format for easy manual editing
Includes deduplication logic
"""

from decimal import Decimal
from datetime import datetime
from typing import Dict, List, Tuple
from django.db import transaction
from .models import Supplier, Order, OrderItem, Material, MaterialSupplierPrice


class SupplierImportExport:
    """Handle import/export of Suppliers"""
    
    @staticmethod
    def export_suppliers(suppliers_queryset) -> List[Dict]:
        """Export suppliers to JSON-serializable format"""
        result = []
        for supplier in suppliers_queryset:
            result.append({
                'name': supplier.name,
                'url': supplier.url,
                'kundenkonto': supplier.kundenkonto,
                'notes': supplier.notes,
                'is_active': supplier.is_active,
            })
        return result
    
    @staticmethod
    def import_suppliers(data: List[Dict]) -> Tuple[List[Supplier], List[str]]:
        """
        Import suppliers from JSON data
        
        Returns:
            Tuple of (created_suppliers, messages)
            - created_suppliers: List of newly created Supplier objects
            - messages: List of status messages (skipped, created, updated)
        """
        created = []
        messages = []
        
        with transaction.atomic():
            for item in data:
                name = item.get('name', '').strip()
                if not name:
                    messages.append("⚠️  Skipped: Supplier without name")
                    continue
                
                # Check for existing supplier by name
                existing = Supplier.objects.filter(name=name).first()
                
                if existing:
                    # Update existing supplier
                    existing.url = item.get('url', '')
                    existing.kundenkonto = item.get('kundenkonto', '')
                    existing.notes = item.get('notes', '')
                    existing.is_active = item.get('is_active', True)
                    existing.save()
                    messages.append(f"✓ Updated: {name}")
                else:
                    # Create new supplier
                    supplier = Supplier.objects.create(
                        name=name,
                        url=item.get('url', ''),
                        kundenkonto=item.get('kundenkonto', ''),
                        notes=item.get('notes', ''),
                        is_active=item.get('is_active', True),
                    )
                    created.append(supplier)
                    messages.append(f"✓ Created: {name}")
        
        return created, messages


class OrderImportExport:
    """Handle import/export of Orders"""
    
    @staticmethod
    def export_orders(orders_queryset) -> List[Dict]:
        """Export orders with items to JSON-serializable format"""
        result = []
        for order in orders_queryset:
            items = []
            for item in order.items.all():
                items.append({
                    'material_id': item.material.id,
                    'material_bezeichnung': item.material.bezeichnung,  # For reference
                    'quantity': str(item.quantity),
                    'preis_pro_stueck': str(item.preis_pro_stueck),
                    'mwst_satz': str(item.mwst_satz),
                    'artikelnummer': item.artikelnummer,
                })
            
            result.append({
                'order_number': order.order_number,
                'supplier_id': order.supplier.id,
                'supplier_name': order.supplier.name,  # For reference
                'bestellt_am': order.bestellt_am.isoformat(),
                'versandkosten': str(order.versandkosten) if order.versandkosten else None,
                'versandkosten_mwst_satz': str(order.versandkosten_mwst_satz),
                'notiz': order.notiz,
                'is_historical': order.is_historical,
                'items': items,
            })
        return result
    
    @staticmethod
    def import_orders(data: List[Dict]) -> Tuple[List[Order], List[str]]:
        """
        Import orders from JSON data
        
        Returns:
            Tuple of (created_orders, messages)
            - created_orders: List of newly created Order objects
            - messages: List of status messages (skipped, created, updated)
        """
        created = []
        messages = []
        
        with transaction.atomic():
            for item in data:
                order_number = item.get('order_number', '').strip()
                
                # Check for existing order by order_number
                if order_number:
                    existing = Order.objects.filter(order_number=order_number).first()
                    if existing:
                        messages.append(f"⚠️  Skipped: Order {order_number} already exists")
                        continue
                
                # Validate supplier
                supplier_id = item.get('supplier_id')
                if not supplier_id:
                    messages.append(f"⚠️  Skipped: Order without supplier_id")
                    continue
                
                try:
                    supplier = Supplier.objects.get(id=supplier_id)
                except Supplier.DoesNotExist:
                    messages.append(
                        f"⚠️  Skipped: Order {order_number or 'unnamed'} - "
                        f"Supplier ID {supplier_id} not found. "
                        f"Import suppliers first!"
                    )
                    continue
                
                # Parse date
                try:
                    bestellt_am = datetime.fromisoformat(
                        item.get('bestellt_am', '')
                    ).date()
                except (ValueError, TypeError):
                    messages.append(
                        f"⚠️  Skipped: Order {order_number or 'unnamed'} - "
                        f"Invalid date format"
                    )
                    continue
                
                # Parse versandkosten
                versandkosten = None
                if item.get('versandkosten'):
                    try:
                        versandkosten = Decimal(str(item['versandkosten']))
                    except (ValueError, TypeError):
                        pass
                
                # Parse versandkosten_mwst_satz
                versandkosten_mwst_satz = Decimal('19.00')
                if item.get('versandkosten_mwst_satz'):
                    try:
                        versandkosten_mwst_satz = Decimal(
                            str(item['versandkosten_mwst_satz'])
                        )
                    except (ValueError, TypeError):
                        pass
                
                # Create order
                order = Order.objects.create(
                    order_number=order_number,
                    supplier=supplier,
                    bestellt_am=bestellt_am,
                    versandkosten=versandkosten,
                    versandkosten_mwst_satz=versandkosten_mwst_satz,
                    notiz=item.get('notiz', ''),
                    is_historical=item.get('is_historical', False),
                )
                
                # Create order items
                items_data = item.get('items', [])
                items_created = 0
                for order_item in items_data:
                    material_id = order_item.get('material_id')
                    if not material_id:
                        messages.append(
                            f"  ⚠️  Skipped item in {order_number}: "
                            f"No material_id"
                        )
                        continue
                    
                    try:
                        material = Material.objects.get(id=material_id)
                    except Material.DoesNotExist:
                        messages.append(
                            f"  ⚠️  Skipped item in {order_number}: "
                            f"Material ID {material_id} not found"
                        )
                        continue
                    
                    try:
                        quantity = Decimal(str(order_item.get('quantity', '0')))
                        preis_pro_stueck = Decimal(
                            str(order_item.get('preis_pro_stueck', '0'))
                        )
                        mwst_satz = Decimal(
                            str(order_item.get('mwst_satz', '19.00'))
                        )
                    except (ValueError, TypeError):
                        messages.append(
                            f"  ⚠️  Skipped item in {order_number}: "
                            f"Invalid number format"
                        )
                        continue
                    
                    OrderItem.objects.create(
                        order=order,
                        material=material,
                        quantity=quantity,
                        preis_pro_stueck=preis_pro_stueck,
                        mwst_satz=mwst_satz,
                        artikelnummer=order_item.get('artikelnummer', ''),
                    )
                    items_created += 1
                
                created.append(order)
                messages.append(
                    f"✓ Created: Order {order_number} with {items_created} items"
                )
        
        return created, messages


class MaterialSupplierPriceImportExport:
    """Handle import/export of Material Supplier Prices"""
    
    @staticmethod
    def export_prices(prices_queryset) -> List[Dict]:
        """Export material supplier prices to JSON-serializable format"""
        result = []
        for price in prices_queryset:
            result.append({
                'material_id': price.material.id,
                'material_bezeichnung': price.material.bezeichnung,  # For reference
                'supplier_id': price.supplier.id,
                'supplier_name': price.supplier.name,  # For reference
                'price': str(price.price),
                'valid_from': price.valid_from.isoformat(),
                'note': price.note,
            })
        return result
    
    @staticmethod
    def import_prices(data: List[Dict]) -> Tuple[List[MaterialSupplierPrice], List[str]]:
        """
        Import material supplier prices from JSON data
        
        Returns:
            Tuple of (created_prices, messages)
            - created_prices: List of newly created MaterialSupplierPrice objects
            - messages: List of status messages (skipped, created, updated)
        """
        created = []
        messages = []
        
        with transaction.atomic():
            for item in data:
                # Validate material
                material_id = item.get('material_id')
                if not material_id:
                    messages.append("⚠️  Skipped: Price without material_id")
                    continue
                
                try:
                    material = Material.objects.get(id=material_id)
                except Material.DoesNotExist:
                    messages.append(
                        f"⚠️  Skipped: Material ID {material_id} not found"
                    )
                    continue
                
                # Validate supplier
                supplier_id = item.get('supplier_id')
                if not supplier_id:
                    messages.append(
                        f"⚠️  Skipped: Price for {material.bezeichnung} without supplier_id"
                    )
                    continue
                
                try:
                    supplier = Supplier.objects.get(id=supplier_id)
                except Supplier.DoesNotExist:
                    messages.append(
                        f"⚠️  Skipped: Price for {material.bezeichnung} - "
                        f"Supplier ID {supplier_id} not found"
                    )
                    continue
                
                # Parse date
                try:
                    valid_from = datetime.fromisoformat(
                        item.get('valid_from', '')
                    ).date()
                except (ValueError, TypeError):
                    messages.append(
                        f"⚠️  Skipped: Price for {material.bezeichnung} from {supplier.name} - "
                        f"Invalid date format"
                    )
                    continue
                
                # Parse price
                try:
                    price = Decimal(str(item.get('price', '0')))
                except (ValueError, TypeError):
                    messages.append(
                        f"⚠️  Skipped: Price for {material.bezeichnung} from {supplier.name} - "
                        f"Invalid price format"
                    )
                    continue
                
                # Check for existing price (unique together: material, supplier, valid_from)
                existing = MaterialSupplierPrice.objects.filter(
                    material=material,
                    supplier=supplier,
                    valid_from=valid_from
                ).first()
                
                if existing:
                    # Update existing price
                    existing.price = price
                    existing.note = item.get('note', '')
                    existing.save()
                    messages.append(
                        f"✓ Updated: {material.bezeichnung} - {supplier.name} ({valid_from})"
                    )
                else:
                    # Create new price
                    price_obj = MaterialSupplierPrice.objects.create(
                        material=material,
                        supplier=supplier,
                        price=price,
                        valid_from=valid_from,
                        note=item.get('note', ''),
                    )
                    created.append(price_obj)
                    messages.append(
                        f"✓ Created: {material.bezeichnung} - {supplier.name} ({valid_from})"
                    )
        
        return created, messages
