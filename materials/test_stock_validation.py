# materials/test_stock_validation.py

from decimal import Decimal
from django.test import TestCase
from rest_framework.serializers import ValidationError

from core.models import Workshop
from materials.models import Material, MaterialCategory, MaterialMovement
from materials.serializers import MaterialTransferSerializer
from materials.validators import get_material_stock, validate_stock_movement


class StockValidationTestCase(TestCase):
    """Tests für die Bestandsvalidierung bei Material-Bewegungen"""

    def setUp(self):
        """Erstelle Test-Daten"""
        # Workshops
        self.potsdam = Workshop.objects.create(name='Potsdam')
        self.rauen = Workshop.objects.create(name='Rauen')

        # Kategorie
        self.category = MaterialCategory.objects.create(
            name='Gehäuseteile',
            order=1
        )

        # Material
        self.material = Material.objects.create(
            bezeichnung='Test Gehäuseteil',
            hersteller_bezeichnung='PETG',
            category=self.category
        )

        # Anfangsbestand: Potsdam 10 Stück, Rauen 5 Stück
        MaterialMovement.objects.create(
            workshop=self.potsdam,
            material=self.material,
            change_type='lieferung',
            quantity=Decimal('10.00'),
            note='Initial stock Potsdam'
        )
        MaterialMovement.objects.create(
            workshop=self.rauen,
            material=self.material,
            change_type='lieferung',
            quantity=Decimal('5.00'),
            note='Initial stock Rauen'
        )

    def test_get_material_stock(self):
        """Test: Bestandsabfrage funktioniert korrekt"""
        stock_potsdam = get_material_stock(
            self.material.id,
            self.potsdam.id
        )
        stock_rauen = get_material_stock(self.material.id, self.rauen.id)

        self.assertEqual(stock_potsdam, Decimal('10.00'))
        self.assertEqual(stock_rauen, Decimal('5.00'))

    def test_validate_valid_movement(self):
        """Test: Gültige Bewegung wird akzeptiert"""
        is_valid, current_stock, message = validate_stock_movement(
            self.material.id,
            self.potsdam.id,
            -5  # 5 Stück entnehmen von 10
        )

        self.assertTrue(is_valid)
        self.assertEqual(current_stock, Decimal('10.00'))
        self.assertEqual(message, 'OK')

    def test_validate_invalid_movement(self):
        """Test: Ungültige Bewegung wird abgelehnt"""
        is_valid, current_stock, message = validate_stock_movement(
            self.material.id,
            self.potsdam.id,
            -15  # 15 Stück entnehmen von 10 -> negativ!
        )

        self.assertFalse(is_valid)
        self.assertEqual(current_stock, Decimal('10.00'))
        self.assertIn('negativ werden', message)
        self.assertIn('Aktuell: 10', message)
        self.assertIn('Änderung: -15', message)

    def test_validate_zero_stock_movement(self):
        """Test: Bewegung auf exakt 0 ist erlaubt"""
        is_valid, current_stock, message = validate_stock_movement(
            self.material.id,
            self.potsdam.id,
            -10  # Kompletter Bestand
        )

        self.assertTrue(is_valid)
        self.assertEqual(message, 'OK')

    def test_transfer_with_sufficient_stock(self):
        """Test: Transfer mit ausreichendem Bestand funktioniert"""
        data = {
            'source_workshop': self.potsdam.id,
            'target_workshop': self.rauen.id,
            'note': 'Test Transfer',
            'items': [
                {
                    'material': self.material.id,
                    'quantity': 8,
                    'note': 'Valid transfer'
                }
            ]
        }

        serializer = MaterialTransferSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        transfer = serializer.save()

        # Prüfe dass Transfer erstellt wurde
        self.assertIsNotNone(transfer.id)
        self.assertEqual(transfer.items.count(), 1)

        # Prüfe Bestände nach Transfer
        stock_potsdam = get_material_stock(
            self.material.id,
            self.potsdam.id
        )
        stock_rauen = get_material_stock(self.material.id, self.rauen.id)

        self.assertEqual(stock_potsdam, Decimal('2.00'))  # 10 - 8
        self.assertEqual(stock_rauen, Decimal('13.00'))  # 5 + 8

    def test_transfer_with_insufficient_stock_fails(self):
        """Test: Transfer mit unzureichendem Bestand wird verhindert"""
        data = {
            'source_workshop': self.potsdam.id,
            'target_workshop': self.rauen.id,
            'note': 'Test Transfer - should fail',
            'items': [
                {
                    'material': self.material.id,
                    'quantity': 15,  # Mehr als verfügbar (10)
                    'note': 'Invalid transfer'
                }
            ]
        }

        serializer = MaterialTransferSerializer(data=data)

        # Validierung sollte fehlschlagen beim save()
        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True)
            serializer.save()  # Hier wird die ValidationError geworfen

        # Prüfe Fehlermeldung
        errors = context.exception.detail
        self.assertIn('items', errors)
        error_msg = str(errors['items'])
        self.assertIn('negativ werden', error_msg)
        self.assertIn(self.material.bezeichnung, error_msg)

        # Prüfe dass keine MaterialMovements erstellt wurden
        movements_count = MaterialMovement.objects.filter(
            material=self.material
        ).count()
        self.assertEqual(movements_count, 2)  # Nur die initialen

    def test_multiple_materials_transfer(self):
        """Test: Transfer mit mehreren Materialien"""
        # Erstelle zweites Material
        material2 = Material.objects.create(
            bezeichnung='Test Gehäuseteil 2',
            hersteller_bezeichnung='PETG',
            category=self.category
        )
        MaterialMovement.objects.create(
            workshop=self.potsdam,
            material=material2,
            change_type='lieferung',
            quantity=Decimal('3.00'),
            note='Initial stock material 2'
        )

        data = {
            'source_workshop': self.potsdam.id,
            'target_workshop': self.rauen.id,
            'note': 'Multi-material transfer',
            'items': [
                {
                    'material': self.material.id,
                    'quantity': 5,
                    'note': 'Material 1'
                },
                {
                    'material': material2.id,
                    'quantity': 2,
                    'note': 'Material 2'
                }
            ]
        }

        serializer = MaterialTransferSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        serializer.save()

        # Prüfe Bestände
        self.assertEqual(
            get_material_stock(self.material.id, self.potsdam.id),
            Decimal('5.00')
        )
        self.assertEqual(
            get_material_stock(material2.id, self.potsdam.id),
            Decimal('1.00')
        )

    def test_multiple_materials_transfer_one_insufficient(self):
        """Test: Transfer schlägt fehl wenn EIN Material nicht reicht"""
        # Erstelle zweites Material mit wenig Bestand
        material2 = Material.objects.create(
            bezeichnung='Test Gehäuseteil 2',
            hersteller_bezeichnung='PETG',
            category=self.category
        )
        MaterialMovement.objects.create(
            workshop=self.potsdam,
            material=material2,
            change_type='lieferung',
            quantity=Decimal('1.00'),  # Nur 1 Stück
            note='Initial stock material 2'
        )

        data = {
            'source_workshop': self.potsdam.id,
            'target_workshop': self.rauen.id,
            'note': 'Multi-material transfer - should fail',
            'items': [
                {
                    'material': self.material.id,
                    'quantity': 5,  # OK
                    'note': 'Material 1'
                },
                {
                    'material': material2.id,
                    'quantity': 3,  # NICHT OK - nur 1 verfügbar
                    'note': 'Material 2'
                }
            ]
        }

        serializer = MaterialTransferSerializer(data=data)

        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)
            serializer.save()  # Hier wird die ValidationError geworfen

        # Prüfe dass KEINE Movements erstellt wurden
        # (auch nicht für Material 1, obwohl das OK wäre)
        self.assertEqual(
            get_material_stock(self.material.id, self.potsdam.id),
            Decimal('10.00')  # Unverändert
        )
        self.assertEqual(
            get_material_stock(material2.id, self.potsdam.id),
            Decimal('1.00')  # Unverändert
        )
