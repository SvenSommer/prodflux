# materials/validators.py

from decimal import Decimal
from django.db.models import Sum


def get_material_stock(material_id, workshop_id):
    """
    Berechnet den aktuellen Bestand eines Materials in einer Werkstatt.
    
    Args:
        material_id: ID des Materials
        workshop_id: ID der Werkstatt
        
    Returns:
        Decimal: Aktueller Bestand
    """
    # Import hier um Circular Import zu vermeiden
    from materials.models import MaterialMovement
    
    stock = MaterialMovement.objects.filter(
        material_id=material_id,
        workshop_id=workshop_id
    ).aggregate(total=Sum('quantity'))['total']
    
    return stock or Decimal('0')


def validate_stock_movement(material_id, workshop_id, quantity_change):
    """
    Validiert, ob eine Material-Bewegung den Bestand nicht negativ
    machen würde.
    
    Args:
        material_id: ID des Materials
        workshop_id: ID der Werkstatt
        quantity_change: Geplante Bestandsänderung (negativ für Entnahme)
        
    Returns:
        tuple: (is_valid: bool, current_stock: Decimal, message: str)
    """
    current_stock = get_material_stock(material_id, workshop_id)
    new_stock = current_stock + Decimal(str(quantity_change))
    
    if new_stock < 0:
        return (
            False,
            current_stock,
            f"Bestand würde negativ werden. Aktuell: {current_stock}, "
            f"Änderung: {quantity_change}, Ergebnis: {new_stock}"
        )
    
    return (True, current_stock, "OK")
