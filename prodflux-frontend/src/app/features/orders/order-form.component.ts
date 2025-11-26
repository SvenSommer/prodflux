import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrdersService, OrderItem } from './orders.service';
import { MaterialsService, Material, MaterialCategoryGroup } from '../materials/materials.service';
import { SuppliersService } from '../settings/suppliers.service';
import { Supplier } from '../../shared/models/supplier.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MaterialTableComponent, MaterialTableColumn, MaterialTableRow } from '../../shared/components/material-table/material-table.component';

@Component({
  selector: 'app-order-form',
  standalone: true,
  templateUrl: './order-form.component.html',
  styleUrls: ['./order-form.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MaterialTableComponent
  ]
})
export class OrderFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersService = inject(OrdersService);
  private materialsService = inject(MaterialsService);
  private suppliersService = inject(SuppliersService);

  orderId: number | null = null;
  supplier: number | null = null;
  order_number: string = '';
  bestellt_am: string = '';
  versandkosten: number = 0;
  notiz: string = '';

  suppliers: Supplier[] = [];
  materialGroups: MaterialCategoryGroup[] = [];

  materialsList: Material[] = [];
  materialAssignments: {
    [materialId: number]: { quantity: number; preis: number; quelle: string };
  } = {};

  // For MaterialTableComponent
  materialTableRows: MaterialTableRow[] = [];
  tableColumns: MaterialTableColumn[] = [
    { key: 'quantity', header: 'Menge', width: '120px' },
    { key: 'preis', header: 'Preis/Stk. (€)', width: '150px' },
    { key: 'quelle', header: 'Quelle', width: '200px' }
  ];

  ngOnInit() {
    console.log('[OrderForm] Init');
    this.orderId = Number(this.route.snapshot.paramMap.get('id')) || null;

    // Load suppliers (active only)
    this.suppliersService.getAll().subscribe(suppliers => {
      this.suppliers = suppliers.filter(s => s.is_active);
      console.log('[OrderForm] Active suppliers loaded:', this.suppliers.length);
    });

    this.materialsService.getMaterialsGrouped().subscribe(groups => {
      this.materialGroups = groups;

      const allMaterials = groups.flatMap(g => g.materials);
      this.materialsList = allMaterials;

      console.log('[OrderForm] materialsList:', allMaterials);

      // Prepare material assignments and table rows
      this.materialTableRows = [];
      for (const mat of allMaterials) {
        this.materialAssignments[mat.id] = {
          quantity: 0,
          preis: 0,
          quelle: ''
        };

        // Find category for this material
        const group = groups.find(g => g.materials.some(m => m.id === mat.id));

        this.materialTableRows.push({
          materialId: mat.id,
          materialName: mat.bezeichnung,
          materialImageUrl: mat.bild_url,
          categoryName: group?.category_name || 'Ohne Kategorie',
          categoryOrder: mat.category?.order ?? 9999,
          data: mat
        });
      }

      if (this.orderId) {
        this.ordersService.get(this.orderId).subscribe(order => {
          console.log('[OrderForm] fetched order:', order);

          this.supplier = order.supplier;
          this.order_number = order.order_number || '';
          this.bestellt_am = order.bestellt_am;
          this.versandkosten = order.versandkosten ?? 0;
          this.notiz = order.notiz || '';

          order.items.forEach(item => {
            if (!this.materialAssignments[item.material]) {
              console.warn('[OrderForm] WARN: material id not found in materialAssignments:', item.material);
              this.materialAssignments[item.material] = {
                quantity: item.quantity,
                preis: item.preis_pro_stueck,
                quelle: item.quelle || ''
              };
            } else {
              this.materialAssignments[item.material].quantity = item.quantity;
              this.materialAssignments[item.material].preis = item.preis_pro_stueck;
              this.materialAssignments[item.material].quelle = item.quelle || '';
            }
          });

          console.log('[OrderForm] materialAssignments after load:', this.materialAssignments);
        });
      }
    });
  }

  save() {
    if (!this.supplier) {
      console.error('[OrderForm] Supplier is required');
      return;
    }

    const items: OrderItem[] = Object.entries(this.materialAssignments)
      .filter(([_, v]) => v.quantity > 0)
      .map(([materialId, v]) => ({
        material: +materialId,
        quantity: v.quantity,
        preis_pro_stueck: v.preis,
        quelle: v.quelle || ''
      }));

    const payload = {
      supplier: this.supplier,
      order_number: this.order_number || undefined,
      bestellt_am: this.bestellt_am,
      versandkosten: this.versandkosten,
      notiz: this.notiz,
      items
      // Note: angekommen_am is NOT sent (read-only in backend)
    };

    console.log('[OrderForm] Saving payload:', payload);

    const request = this.orderId
      ? this.ordersService.update(this.orderId, payload)
      : this.ordersService.create(payload);

    request.subscribe(result => {
      console.log('[OrderForm] Save successful, result:', result);
      this.router.navigate(['/orders']);
    });
  }
}
