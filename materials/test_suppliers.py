# materials/test_suppliers.py

from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

from core.models import Workshop
from materials.models import Material, MaterialCategory, Supplier


User = get_user_model()


class SupplierCRUDTestCase(APITestCase):
    """Tests for Supplier CRUD operations"""

    def setUp(self):
        """Create test user and authenticate"""
        self.workshop = Workshop.objects.create(name='Test Workshop')
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            workshop=self.workshop
        )
        self.client.force_authenticate(user=self.user)

    def test_create_supplier(self):
        """Test: POST /api/suppliers/ creates a supplier"""
        data = {
            'name': 'Test Supplier GmbH',
            'url': 'https://test-supplier.de',
            'kundenkonto': 'KONTO-12345',
            'notes': 'Test supplier notes',
            'is_active': True
        }

        response = self.client.post('/api/suppliers/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Test Supplier GmbH')
        self.assertEqual(response.data['url'], 'https://test-supplier.de')
        self.assertEqual(response.data['kundenkonto'], 'KONTO-12345')
        self.assertEqual(response.data['notes'], 'Test supplier notes')
        self.assertEqual(response.data['is_active'], True)
        self.assertIn('id', response.data)
        self.assertIn('created_at', response.data)
        self.assertIn('updated_at', response.data)

    def test_create_supplier_minimal(self):
        """Test: Creating supplier with only required field (name)"""
        data = {
            'name': 'Minimal Supplier'
        }

        response = self.client.post('/api/suppliers/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Minimal Supplier')
        self.assertEqual(response.data['url'], '')
        self.assertEqual(response.data['kundenkonto'], '')
        self.assertEqual(response.data['notes'], '')
        self.assertEqual(response.data['is_active'], True)  # default

    def test_list_suppliers(self):
        """Test: GET /api/suppliers/ lists suppliers"""
        Supplier.objects.create(
            name='Supplier A',
            url='https://supplier-a.de',
            is_active=True
        )
        Supplier.objects.create(
            name='Supplier B',
            is_active=False
        )

        response = self.client.get('/api/suppliers/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        # Check ordering (should be by name)
        self.assertEqual(response.data[0]['name'], 'Supplier A')
        self.assertEqual(response.data[1]['name'], 'Supplier B')

    def test_list_suppliers_filter_active(self):
        """Test: Filter suppliers by is_active"""
        Supplier.objects.create(name='Active Supplier', is_active=True)
        Supplier.objects.create(name='Inactive Supplier', is_active=False)

        response = self.client.get('/api/suppliers/?is_active=true')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Active Supplier')

    def test_retrieve_supplier(self):
        """Test: GET /api/suppliers/{id}/ retrieves supplier details"""
        supplier = Supplier.objects.create(
            name='Test Supplier',
            url='https://test.de',
            kundenkonto='K123'
        )

        response = self.client.get(f'/api/suppliers/{supplier.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], supplier.id)
        self.assertEqual(response.data['name'], 'Test Supplier')
        self.assertEqual(response.data['url'], 'https://test.de')

    def test_update_supplier(self):
        """Test: PATCH /api/suppliers/{id}/ updates supplier"""
        supplier = Supplier.objects.create(name='Old Name', is_active=True)

        data = {
            'name': 'New Name',
            'is_active': False
        }

        response = self.client.patch(
            f'/api/suppliers/{supplier.id}/',
            data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'New Name')
        self.assertEqual(response.data['is_active'], False)

        # Verify in database
        supplier.refresh_from_db()
        self.assertEqual(supplier.name, 'New Name')
        self.assertEqual(supplier.is_active, False)

    def test_delete_supplier(self):
        """Test: DELETE /api/suppliers/{id}/ deletes supplier"""
        supplier = Supplier.objects.create(name='To Delete')

        response = self.client.delete(f'/api/suppliers/{supplier.id}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Supplier.objects.filter(id=supplier.id).count(), 0)


class MaterialSupplierAssociationTestCase(APITestCase):
    """Tests for Material-Supplier many-to-many relationship"""

    def setUp(self):
        """Create test data"""
        self.workshop = Workshop.objects.create(name='Test Workshop')
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            workshop=self.workshop
        )
        self.client.force_authenticate(user=self.user)

        self.category = MaterialCategory.objects.create(
            name='Test Category',
            order=1
        )

        self.supplier1 = Supplier.objects.create(name='Supplier 1')
        self.supplier2 = Supplier.objects.create(name='Supplier 2')
        self.supplier3 = Supplier.objects.create(name='Supplier 3')

    def test_material_without_suppliers(self):
        """Test: Material without suppliers returns empty array"""
        material = Material.objects.create(
            bezeichnung='Test Material',
            category=self.category
        )

        response = self.client.get(f'/api/materials/{material.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['suppliers'], [])
        self.assertEqual(response.data['supplier_details'], [])

    def test_create_material_with_suppliers(self):
        """Test: Creating material with suppliers"""
        data = {
            'bezeichnung': 'New Material',
            'category_id': self.category.id,
            'suppliers': [self.supplier1.id, self.supplier2.id]
        }

        response = self.client.post('/api/materials/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['suppliers']), 2)
        self.assertIn(self.supplier1.id, response.data['suppliers'])
        self.assertIn(self.supplier2.id, response.data['suppliers'])

        # Check supplier_details
        self.assertEqual(len(response.data['supplier_details']), 2)
        supplier_names = [s['name'] for s in response.data['supplier_details']]
        self.assertIn('Supplier 1', supplier_names)
        self.assertIn('Supplier 2', supplier_names)

    def test_update_material_suppliers_patch(self):
        """Test: PATCH material to add/update suppliers"""
        material = Material.objects.create(
            bezeichnung='Test Material',
            category=self.category
        )
        material.suppliers.add(self.supplier1)

        # Update to new supplier list
        data = {
            'suppliers': [self.supplier2.id, self.supplier3.id]
        }

        response = self.client.patch(
            f'/api/materials/{material.id}/',
            data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['suppliers']), 2)
        self.assertIn(self.supplier2.id, response.data['suppliers'])
        self.assertIn(self.supplier3.id, response.data['suppliers'])
        self.assertNotIn(self.supplier1.id, response.data['suppliers'])

    def test_material_get_shows_supplier_details(self):
        """Test: Material GET includes supplier_details for UI"""
        material = Material.objects.create(
            bezeichnung='Test Material',
            category=self.category
        )
        material.suppliers.add(self.supplier1, self.supplier2)

        response = self.client.get(f'/api/materials/{material.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check suppliers (IDs)
        self.assertEqual(len(response.data['suppliers']), 2)

        # Check supplier_details (id + name for UI)
        self.assertEqual(len(response.data['supplier_details']), 2)
        detail1 = next(
            s for s in response.data['supplier_details']
            if s['id'] == self.supplier1.id
        )
        detail2 = next(
            s for s in response.data['supplier_details']
            if s['id'] == self.supplier2.id
        )

        self.assertEqual(detail1['name'], 'Supplier 1')
        self.assertEqual(detail2['name'], 'Supplier 2')

    def test_material_list_includes_suppliers(self):
        """Test: Material list includes supplier info"""
        material = Material.objects.create(
            bezeichnung='Material with Suppliers',
            category=self.category
        )
        material.suppliers.add(self.supplier1)

        response = self.client.get('/api/materials/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Response is grouped by category
        category_group = next(
            g for g in response.data
            if g['category_name'] == 'Test Category'
        )

        material_data = category_group['materials'][0]
        self.assertEqual(material_data['id'], material.id)
        self.assertEqual(len(material_data['suppliers']), 1)
        self.assertIn(self.supplier1.id, material_data['suppliers'])

    def test_remove_all_suppliers_from_material(self):
        """Test: Removing all suppliers from material"""
        material = Material.objects.create(
            bezeichnung='Test Material',
            category=self.category
        )
        material.suppliers.add(self.supplier1, self.supplier2)

        # Update with empty supplier list
        data = {
            'suppliers': []
        }

        response = self.client.patch(
            f'/api/materials/{material.id}/',
            data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['suppliers'], [])
        self.assertEqual(response.data['supplier_details'], [])

        # Verify in database
        material.refresh_from_db()
        self.assertEqual(material.suppliers.count(), 0)

    def test_invalid_supplier_id_returns_error(self):
        """Test: Invalid supplier ID returns error"""
        material = Material.objects.create(
            bezeichnung='Test Material',
            category=self.category
        )

        data = {
            'suppliers': [99999]  # Non-existent supplier
        }

        response = self.client.patch(
            f'/api/materials/{material.id}/',
            data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('suppliers', response.data)


class SupplierAuthenticationTestCase(APITestCase):
    """Tests for supplier API authentication"""

    def test_unauthenticated_access_denied(self):
        """Test: Unauthenticated requests are denied"""
        # GET list
        response = self.client.get('/api/suppliers/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # POST create
        response = self.client.post(
            '/api/suppliers/',
            {'name': 'Test'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
