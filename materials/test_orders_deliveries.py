# materials/test_orders_deliveries.py

from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from datetime import date, timedelta

from core.models import Workshop
from materials.models import (
    Material, MaterialCategory, Supplier, Order, OrderItem,
    Delivery, DeliveryItem
)


User = get_user_model()


class OrderSupplierRequirementTestCase(APITestCase):
    """Tests for Order supplier requirement"""

    def setUp(self):
        """Create test user and authenticate"""
        self.workshop = Workshop.objects.create(name='Test Workshop')
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            workshop=self.workshop
        )
        self.client.force_authenticate(user=self.user)

        # Create test data
        self.supplier = Supplier.objects.create(
            name='Test Supplier',
            is_active=True
        )
        self.material = Material.objects.create(
            bezeichnung='Test Material',
            hersteller_bezeichnung='Test Manufacturer'
        )

    def test_create_order_without_supplier_fails(self):
        """Test: POST /api/orders/ without supplier returns 400"""
        data = {
            'bestellt_am': str(date.today()),
            'versandkosten': 5.99,
            'notiz': 'Test order',
            'items': [
                {
                    'material': self.material.id,
                    'quantity': 10,
                    'preis_pro_stueck': 12.50,
                    'quelle': 'Test source'
                }
            ]
        }

        response = self.client.post('/api/orders/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('supplier', response.data)

    def test_create_order_with_supplier_succeeds(self):
        """Test: POST /api/orders/ with supplier returns 201"""
        data = {
            'supplier': self.supplier.id,
            'bestellt_am': str(date.today()),
            'versandkosten': 5.99,
            'notiz': 'Test order',
            'items': [
                {
                    'material': self.material.id,
                    'quantity': 10,
                    'preis_pro_stueck': 12.50,
                    'quelle': 'Test source'
                }
            ]
        }

        response = self.client.post('/api/orders/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['supplier'], self.supplier.id)
        self.assertIn('id', response.data)


class OrderNumberAutoGenerationTestCase(APITestCase):
    """Tests for order_number auto-generation"""

    def setUp(self):
        """Create test user and authenticate"""
        self.workshop = Workshop.objects.create(name='Test Workshop')
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            workshop=self.workshop
        )
        self.client.force_authenticate(user=self.user)

        # Create test data
        self.supplier = Supplier.objects.create(
            name='Test Supplier',
            is_active=True
        )
        self.material = Material.objects.create(
            bezeichnung='Test Material',
            hersteller_bezeichnung='Test Manufacturer'
        )

    def test_order_number_auto_generated_when_empty(self):
        """Test: order_number is auto-generated when not provided"""
        data = {
            'supplier': self.supplier.id,
            'order_number': '',
            'bestellt_am': str(date.today()),
            'versandkosten': 5.99,
            'items': [
                {
                    'material': self.material.id,
                    'quantity': 10,
                    'preis_pro_stueck': 12.50,
                    'quelle': 'Test'
                }
            ]
        }

        response = self.client.post('/api/orders/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNotNone(response.data['order_number'])
        self.assertNotEqual(response.data['order_number'], '')
        # Should contain year and ID
        self.assertIn(str(date.today().year), response.data['order_number'])

    def test_order_number_custom_value_preserved(self):
        """Test: Custom order_number is preserved when provided"""
        custom_number = 'CUSTOM-ORDER-001'
        data = {
            'supplier': self.supplier.id,
            'order_number': custom_number,
            'bestellt_am': str(date.today()),
            'items': [
                {
                    'material': self.material.id,
                    'quantity': 10,
                    'preis_pro_stueck': 12.50,
                    'quelle': 'Test'
                }
            ]
        }

        response = self.client.post('/api/orders/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['order_number'], custom_number)

    def test_order_number_is_unique(self):
        """Test: Duplicate order_number is rejected"""
        # Create first order
        order1 = Order.objects.create(
            supplier=self.supplier,
            order_number='ORD-2025-00001',
            bestellt_am=date.today()
        )

        # Try to create second order with same number
        data = {
            'supplier': self.supplier.id,
            'order_number': 'ORD-2025-00001',
            'bestellt_am': str(date.today()),
            'items': [
                {
                    'material': self.material.id,
                    'quantity': 10,
                    'preis_pro_stueck': 12.50,
                    'quelle': 'Test'
                }
            ]
        }

        response = self.client.post('/api/orders/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('order_number', response.data)


class OrderAngekommenAmComputedTestCase(APITestCase):
    """Tests for angekommen_am computed from Deliveries"""

    def setUp(self):
        """Create test user and authenticate"""
        self.workshop = Workshop.objects.create(name='Test Workshop')
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            workshop=self.workshop
        )
        self.client.force_authenticate(user=self.user)

        # Create test data
        self.supplier = Supplier.objects.create(
            name='Test Supplier',
            is_active=True
        )
        self.material = Material.objects.create(
            bezeichnung='Test Material',
            hersteller_bezeichnung='Test Manufacturer'
        )

    def test_angekommen_am_is_null_when_no_delivery(self):
        """Test: angekommen_am is null when Order has no Deliveries"""
        # Create order
        order_data = {
            'supplier': self.supplier.id,
            'bestellt_am': str(date.today()),
            'items': [
                {
                    'material': self.material.id,
                    'quantity': 10,
                    'preis_pro_stueck': 12.50,
                    'quelle': 'Test'
                }
            ]
        }

        response = self.client.post('/api/orders/', order_data, format='json')
        order_id = response.data['id']

        # Get order detail
        response = self.client.get(f'/api/orders/{order_id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['angekommen_am'])

    def test_angekommen_am_derived_from_delivery(self):
        """Test: angekommen_am equals delivery.created_at.date()"""
        # Create order
        order_data = {
            'supplier': self.supplier.id,
            'bestellt_am': str(date.today()),
            'items': [
                {
                    'material': self.material.id,
                    'quantity': 10,
                    'preis_pro_stueck': 12.50,
                    'quelle': 'Test'
                }
            ]
        }

        response = self.client.post('/api/orders/', order_data, format='json')
        order_id = response.data['id']

        # Create delivery linked to order
        delivery_data = {
            'workshop': self.workshop.id,
            'note': 'Test delivery',
            'order': order_id,
            'items': [
                {
                    'material': self.material.id,
                    'quantity': 5,
                    'note': 'Partial delivery'
                }
            ]
        }

        delivery_response = self.client.post(
            '/api/deliveries/',
            delivery_data,
            format='json'
        )
        self.assertEqual(delivery_response.status_code, status.HTTP_201_CREATED)

        # Get order detail
        response = self.client.get(f'/api/orders/{order_id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['angekommen_am'])

        # angekommen_am should be today (delivery.created_at is now)
        self.assertEqual(
            response.data['angekommen_am'],
            str(date.today())
        )

    def test_angekommen_am_is_earliest_delivery(self):
        """Test: angekommen_am is the earliest delivery date"""
        # Create order
        order = Order.objects.create(
            supplier=self.supplier,
            bestellt_am=date.today() - timedelta(days=5)
        )
        OrderItem.objects.create(
            order=order,
            material=self.material,
            quantity=20,
            preis_pro_stueck=10.00
        )

        # Create two deliveries (manually to control timestamps)
        from django.utils import timezone

        # First delivery (older)
        delivery1 = Delivery.objects.create(
            workshop=self.workshop,
            order=order,
            note='First delivery'
        )
        delivery1.created_at = timezone.now() - timedelta(days=2)
        delivery1.save()

        DeliveryItem.objects.create(
            delivery=delivery1,
            material=self.material,
            quantity=10
        )

        # Second delivery (newer)
        delivery2 = Delivery.objects.create(
            workshop=self.workshop,
            order=order,
            note='Second delivery'
        )
        DeliveryItem.objects.create(
            delivery=delivery2,
            material=self.material,
            quantity=10
        )

        # Get order via API
        response = self.client.get(f'/api/orders/{order.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return the earlier delivery date
        expected_date = (timezone.now() - timedelta(days=2)).date()
        self.assertEqual(
            response.data['angekommen_am'],
            str(expected_date)
        )


class DeliveryOrderFieldTestCase(APITestCase):
    """Tests for Delivery.order field in API"""

    def setUp(self):
        """Create test user and authenticate"""
        self.workshop = Workshop.objects.create(name='Test Workshop')
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            workshop=self.workshop
        )
        self.client.force_authenticate(user=self.user)

        # Create test data
        self.supplier = Supplier.objects.create(
            name='Test Supplier',
            is_active=True
        )
        self.material = Material.objects.create(
            bezeichnung='Test Material',
            hersteller_bezeichnung='Test Manufacturer'
        )

    def test_delivery_without_order(self):
        """Test: Delivery can be created without order (manual delivery)"""
        data = {
            'workshop': self.workshop.id,
            'note': 'Manual delivery',
            'items': [
                {
                    'material': self.material.id,
                    'quantity': 10,
                    'note': 'Test item'
                }
            ]
        }

        response = self.client.post('/api/deliveries/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data.get('order'))

    def test_delivery_with_order(self):
        """Test: Delivery can be linked to an Order"""
        # Create order first
        order = Order.objects.create(
            supplier=self.supplier,
            bestellt_am=date.today()
        )
        OrderItem.objects.create(
            order=order,
            material=self.material,
            quantity=20,
            preis_pro_stueck=10.00
        )

        # Create delivery linked to order
        data = {
            'workshop': self.workshop.id,
            'note': 'Order delivery',
            'order': order.id,
            'items': [
                {
                    'material': self.material.id,  # Fixed: use .id
                    'quantity': 10,
                    'note': 'Partial delivery'
                }
            ]
        }

        response = self.client.post('/api/deliveries/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['order'], order.id)

    def test_delivery_order_field_in_response(self):
        """Test: GET /api/deliveries/ returns order field"""
        # Create order and delivery
        order = Order.objects.create(
            supplier=self.supplier,
            bestellt_am=date.today()
        )

        delivery = Delivery.objects.create(
            workshop=self.workshop,
            order=order,
            note='Test delivery'
        )
        DeliveryItem.objects.create(
            delivery=delivery,
            material=self.material,
            quantity=5
        )

        # Get delivery detail
        response = self.client.get(f'/api/deliveries/{delivery.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('order', response.data)
        self.assertEqual(response.data['order'], order.id)

    def test_delivery_update_with_order(self):
        """Test: Delivery order can be updated"""
        # Create two orders with unique order_numbers
        order1 = Order.objects.create(
            supplier=self.supplier,
            order_number='ORD-TEST-001',
            bestellt_am=date.today()
        )
        order2 = Order.objects.create(
            supplier=self.supplier,
            order_number='ORD-TEST-002',
            bestellt_am=date.today()
        )

        # Create delivery linked to order1
        delivery = Delivery.objects.create(
            workshop=self.workshop,
            order=order1,
            note='Initial delivery'
        )
        DeliveryItem.objects.create(
            delivery=delivery,
            material=self.material,
            quantity=5
        )

        # Update delivery to link to order2
        data = {
            'workshop': self.workshop.id,
            'note': 'Updated delivery',
            'order': order2.id,
            'items': [
                {
                    'material': self.material.id,
                    'quantity': 5,
                    'note': 'Updated item'
                }
            ]
        }

        response = self.client.put(
            f'/api/deliveries/{delivery.id}/',
            data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['order'], order2.id)


class OrderDeliveriesEndpointTestCase(APITestCase):
    """Tests for GET /api/orders/{id}/deliveries/ endpoint"""

    def setUp(self):
        """Create test user and authenticate"""
        self.workshop = Workshop.objects.create(name='Test Workshop')
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            workshop=self.workshop
        )
        self.client.force_authenticate(user=self.user)

        # Create test data
        self.supplier = Supplier.objects.create(
            name='Test Supplier',
            is_active=True
        )
        self.material = Material.objects.create(
            bezeichnung='Test Material',
            hersteller_bezeichnung='Test Manufacturer'
        )

        # Create orders
        self.order1 = Order.objects.create(
            supplier=self.supplier,
            order_number='ORD-TEST-001',
            bestellt_am=date.today()
        )
        self.order2 = Order.objects.create(
            supplier=self.supplier,
            order_number='ORD-TEST-002',
            bestellt_am=date.today()
        )

    def test_unauthenticated_access_denied(self):
        """Test: Unauthenticated request returns 401"""
        self.client.force_authenticate(user=None)
        response = self.client.get(
            f'/api/orders/{self.order1.id}/deliveries/'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_empty_result_when_no_deliveries(self):
        """Test: Returns empty array when order has no deliveries"""
        response = self.client.get(
            f'/api/orders/{self.order1.id}/deliveries/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_returns_only_deliveries_for_order(self):
        """Test: Only returns deliveries linked to the specified order"""
        # Create delivery for order1
        delivery1 = Delivery.objects.create(
            workshop=self.workshop,
            order=self.order1,
            note='Delivery for order 1'
        )
        DeliveryItem.objects.create(
            delivery=delivery1,
            material=self.material,
            quantity=5
        )

        # Create delivery for order2
        delivery2 = Delivery.objects.create(
            workshop=self.workshop,
            order=self.order2,
            note='Delivery for order 2'
        )
        DeliveryItem.objects.create(
            delivery=delivery2,
            material=self.material,
            quantity=3
        )

        # Create delivery without order
        delivery_no_order = Delivery.objects.create(
            workshop=self.workshop,
            order=None,
            note='Manual delivery'
        )
        DeliveryItem.objects.create(
            delivery=delivery_no_order,
            material=self.material,
            quantity=2
        )

        # Request deliveries for order1
        response = self.client.get(
            f'/api/orders/{self.order1.id}/deliveries/'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], delivery1.id)
        self.assertEqual(response.data[0]['order'], self.order1.id)

    def test_deliveries_ordered_by_created_at_desc(self):
        """Test: Deliveries are ordered by created_at descending"""
        # Create deliveries with different timestamps
        from datetime import datetime, timezone

        delivery1 = Delivery.objects.create(
            workshop=self.workshop,
            order=self.order1,
            note='First delivery'
        )
        delivery1.created_at = datetime(
            2025, 11, 20, 10, 0, 0, tzinfo=timezone.utc
        )
        delivery1.save()

        delivery2 = Delivery.objects.create(
            workshop=self.workshop,
            order=self.order1,
            note='Second delivery'
        )
        delivery2.created_at = datetime(
            2025, 11, 25, 10, 0, 0, tzinfo=timezone.utc
        )
        delivery2.save()

        delivery3 = Delivery.objects.create(
            workshop=self.workshop,
            order=self.order1,
            note='Third delivery'
        )
        delivery3.created_at = datetime(
            2025, 11, 22, 10, 0, 0, tzinfo=timezone.utc
        )
        delivery3.save()

        # Request deliveries for order1
        response = self.client.get(
            f'/api/orders/{self.order1.id}/deliveries/'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

        # Check ordering (newest first)
        self.assertEqual(response.data[0]['id'], delivery2.id)  # Nov 25
        self.assertEqual(response.data[1]['id'], delivery3.id)  # Nov 22
        self.assertEqual(response.data[2]['id'], delivery1.id)  # Nov 20


class DeliveryOrderDetailTestCase(APITestCase):
    """Tests for order_detail field in Delivery API"""

    def setUp(self):
        """Create test user, workshop, and test data"""
        self.workshop = Workshop.objects.create(name='Test Workshop')
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            workshop=self.workshop
        )
        self.client.force_authenticate(user=self.user)

        # Create supplier
        self.supplier = Supplier.objects.create(
            name='Test Supplier GmbH',
            is_active=True
        )

        # Create material
        self.material = Material.objects.create(
            bezeichnung='Test Material',
            hersteller_bezeichnung='Test Manufacturer'
        )

        # Create order
        self.order = Order.objects.create(
            supplier=self.supplier,
            bestellt_am=date.today(),
            order_number='ORD-2025-00123',
            versandkosten=10.00
        )

    def test_delivery_with_order_includes_order_detail(self):
        """
        Test: Delivery with order returns order_detail with
        order_number and supplier_name
        """
        delivery = Delivery.objects.create(
            workshop=self.workshop,
            order=self.order,
            note='Test delivery with order'
        )
        DeliveryItem.objects.create(
            delivery=delivery,
            material=self.material,
            quantity=5
        )

        response = self.client.get(f'/api/deliveries/{delivery.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['order_detail'])
        self.assertEqual(
            response.data['order_detail']['id'],
            self.order.id
        )
        self.assertEqual(
            response.data['order_detail']['order_number'],
            'ORD-2025-00123'
        )
        self.assertEqual(
            response.data['order_detail']['supplier'],
            self.supplier.id
        )
        self.assertEqual(
            response.data['order_detail']['supplier_name'],
            'Test Supplier GmbH'
        )

    def test_delivery_without_order_has_null_order_detail(self):
        """Test: Delivery without order returns order_detail as null"""
        delivery = Delivery.objects.create(
            workshop=self.workshop,
            order=None,
            note='Test delivery without order'
        )
        DeliveryItem.objects.create(
            delivery=delivery,
            material=self.material,
            quantity=3
        )

        response = self.client.get(f'/api/deliveries/{delivery.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['order'])
        self.assertIsNone(response.data['order_detail'])

    def test_delivery_list_includes_order_detail(self):
        """
        Test: GET /api/deliveries/ includes order_detail
        for deliveries with orders
        """
        # Create delivery with order
        delivery_with_order = Delivery.objects.create(
            workshop=self.workshop,
            order=self.order,
            note='With order'
        )
        DeliveryItem.objects.create(
            delivery=delivery_with_order,
            material=self.material,
            quantity=5
        )

        # Create delivery without order
        delivery_without_order = Delivery.objects.create(
            workshop=self.workshop,
            order=None,
            note='Without order'
        )
        DeliveryItem.objects.create(
            delivery=delivery_without_order,
            material=self.material,
            quantity=3
        )

        response = self.client.get('/api/deliveries/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        # Find deliveries in response
        with_order = next(
            d for d in response.data
            if d['id'] == delivery_with_order.id
        )
        without_order = next(
            d for d in response.data
            if d['id'] == delivery_without_order.id
        )

        # Check delivery with order has order_detail
        self.assertIsNotNone(with_order['order_detail'])
        self.assertEqual(
            with_order['order_detail']['order_number'],
            'ORD-2025-00123'
        )
        self.assertEqual(
            with_order['order_detail']['supplier_name'],
            'Test Supplier GmbH'
        )

        # Check delivery without order has null order_detail
        self.assertIsNone(without_order['order_detail'])
