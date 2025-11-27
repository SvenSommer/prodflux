import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { DeliveriesService, DeliveryItem } from './deliveries.service';
import { MaterialsService, MaterialCategoryGroup } from '../materials/materials.service';
import { WorkshopsService, Workshop } from '../settings/workshop.services';
import { OrdersService, Order } from '../orders/orders.service';
import { SuppliersService } from '../settings/suppliers.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-delivery-form',
  standalone: true,
  templateUrl: './delivery-form.component.html',
  styleUrls: ['./delivery-form.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatCheckboxModule,
  ],
})
export class DeliveryFormComponent {
  private deliveriesService = inject(DeliveriesService);
  private workshopsService = inject(WorkshopsService);
  private materialsService = inject(MaterialsService);
  private ordersService = inject(OrdersService);
  private suppliersService = inject(SuppliersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  deliveryId: number | null = null;
  note = '';
  workshopId: number | null = null;
  order: number | null = null;  // NEW: FK to Order (optional)
  is_historical = false;  // NEW: historical delivery flag
  delivered_at: string = '';  // NEW: delivery date

  workshops: Workshop[] = [];
  orders: Order[] = [];  // NEW: for order dropdown
  filteredOrders: Order[] = [];  // NEW: for autocomplete filtering
  orderSearchControl = new FormControl('');  // NEW: for autocomplete search
  suppliersMap = new Map<number, string>();  // NEW: for supplier names
  materialGroups: MaterialCategoryGroup[] = [];
  materialAssignments: Record<number, { quantity: number; note: string }> = {};
  filteredMaterialGroups: MaterialCategoryGroup[] = [];
  isOrderBased = false;

  editMode = true;

  ngOnInit(): void {
    this.deliveryId = Number(this.route.snapshot.paramMap.get('id')) || null;
    const orderId = this.route.snapshot.queryParamMap.get('orderId');

    this.loadWorkshops();
    this.loadSuppliers();  // NEW: load suppliers for order display names
    this.loadOrders();  // NEW: load orders for dropdown

    if (orderId) {
      // Load materials first, then prefill from order
      this.loadMaterialsAndPrefillFromOrder(Number(orderId));
    } else {
      this.loadMaterialsAndDelivery();
    }
  }

  private loadWorkshops(): void {
    this.workshopsService.getAll().subscribe(workshops => {
      this.workshops = workshops;

      // Set default workshop to "Rauen" (ID: 2) if creating new delivery
      if (!this.deliveryId && !this.workshopId) {
        this.workshopId = 2;
      }
    });
  }

  private loadSuppliers(): void {
    this.suppliersService.getAll().subscribe(suppliers => {
      suppliers.forEach(s => {
        this.suppliersMap.set(s.id, s.name);
      });
    });
  }

  private loadOrders(): void {
    this.ordersService.getAll().subscribe(orders => {
      // Sort by bestellt_am descending (most recent first)
      this.orders = orders.sort((a, b) =>
        new Date(b.bestellt_am).getTime() - new Date(a.bestellt_am).getTime()
      );
      this.filteredOrders = [...this.orders];
      this.setupOrderSearch();
    });
  }

  private setupOrderSearch(): void {
    this.orderSearchControl.valueChanges.subscribe(value => {
      const searchTerm = (value || '').toLowerCase();
      this.filteredOrders = this.orders.filter(order => {
        const label = this.getOrderLabel(order).toLowerCase();
        return label.includes(searchTerm);
      });
    });
  }

  private loadMaterialsAndDelivery(): void {
    this.materialsService.getMaterialsGrouped().subscribe(groups => {
      this.materialGroups = groups;
      this.filteredMaterialGroups = groups;
      this.isOrderBased = false;

      // Materialien initialisieren
      const allMaterials = groups.flatMap(group => group.materials);
      allMaterials.forEach(mat => {
        this.materialAssignments[mat.id] = { quantity: 0, note: '' };
      });

      if (this.deliveryId) {
        this.deliveriesService.getOne(this.deliveryId).subscribe(delivery => {
          this.workshopId = Number(delivery.workshop);
          this.note = delivery.note || '';
          this.order = delivery.order ?? null;  // NEW: load order if set
          this.is_historical = delivery.is_historical || false;  // NEW: load is_historical
          this.delivered_at = delivery.delivered_at || '';  // NEW: load delivered_at

          // Initialize autocomplete field with current order
          if (this.order) {
            const selectedOrder = this.orders.find(o => o.id === this.order);
            if (selectedOrder) {
              this.orderSearchControl.setValue(this.getOrderLabel(selectedOrder), { emitEvent: false });
            }
          }

          delivery.items.forEach(item => {
            if (this.materialAssignments[item.material]) {
              this.materialAssignments[item.material] = {
                quantity: Number(item.quantity),
                note: item.note || '',
              };
            }
          });
        });
      }
    });
  }

  private loadMaterialsAndPrefillFromOrder(orderId: number): void {
    this.materialsService.getMaterialsGrouped().subscribe(groups => {
      this.materialGroups = groups;
      this.isOrderBased = true;

      // Materialien initialisieren
      const allMaterials = groups.flatMap(group => group.materials);
      allMaterials.forEach(mat => {
        this.materialAssignments[mat.id] = { quantity: 0, note: '' };
      });

      // Load order and prefill delivery
      this.ordersService.get(orderId).subscribe(order => {
        this.order = order.id;
        this.note = `Lieferung zu Bestellung ${order.order_number || '#' + order.id}`;
        this.is_historical = order.is_historical || false;

        // Initialize autocomplete field with selected order
        this.orderSearchControl.setValue(this.getOrderLabel(order), { emitEvent: false });

        // Set today's date as default delivery date
        const today = new Date();
        this.delivered_at = today.toISOString().split('T')[0];

        // Prefill material quantities from order
        const orderMaterialIds = new Set(order.items.map(item => item.material));
        order.items.forEach(item => {
          if (this.materialAssignments[item.material]) {
            this.materialAssignments[item.material] = {
              quantity: Number(item.quantity),
              note: item.artikelnummer || '',
            };
          }
        });

        // Filter material groups to show only materials from the order
        this.filteredMaterialGroups = groups.map(group => ({
          ...group,
          materials: group.materials.filter(mat => orderMaterialIds.has(mat.id))
        })).filter(group => group.materials.length > 0);
      });
    });
  }

  save(): void {
    const items: DeliveryItem[] = Object.entries(this.materialAssignments)
      .filter(([_, assignment]) => assignment.quantity > 0)
      .map(([materialId, assignment]) => ({
        material: +materialId,
        quantity: assignment.quantity,
        note: assignment.note || '',
      }));

    const payload = {
      workshop: this.workshopId!,
      delivered_at: this.delivered_at || null,
      note: this.note,
      order: this.order ?? null,  // NEW: include order field
      is_historical: this.is_historical,  // NEW: include is_historical
      items,
    };

    const request = this.deliveryId
      ? this.deliveriesService.update(this.deliveryId, payload)
      : this.deliveriesService.create(payload);

    request.subscribe(() => {
      this.router.navigate(['/deliveries']);
    });
  }

  getMaterialBezeichnung(id: number): string {
    for (const group of this.materialGroups) {
      const material = group.materials.find(m => m.id === id);
      if (material) {
        return material.bezeichnung;
      }
    }
    return `#${id}`;
  }

  getMaterialHersteller(id: number): string {
    for (const group of this.materialGroups) {
      const material = group.materials.find(m => m.id === id);
      if (material) {
        return material.hersteller_bezeichnung;
      }
    }
    return '';
  }

  getOrderLabel(order: Order): string {
    const supplierName = this.suppliersMap.get(order.supplier);
    return this.ordersService.getOrderDisplayName(order, supplierName);
  }

  onOrderSelected(order: Order | null): void {
    if (order) {
      this.order = order.id;
      this.orderSearchControl.setValue(this.getOrderLabel(order), { emitEvent: false });
    } else {
      this.order = null;
      this.orderSearchControl.setValue('', { emitEvent: false });
    }
  }

  displayOrderFn = (orderId: number | null): string => {
    if (!orderId) return '';
    const order = this.orders.find(o => o.id === orderId);
    return order ? this.getOrderLabel(order) : '';
  };
}
