import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrdersService, Order } from './orders.service';
import { MaterialCategoryGroup, MaterialsService, Material } from '../materials/materials.service';
import { SuppliersService } from '../settings/suppliers.service';
import { Supplier } from '../../shared/models/supplier.model';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { MaterialTableComponent, MaterialTableRow, MaterialTableColumn } from '../../shared/components/material-table/material-table.component';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    RouterModule,
    BreadcrumbComponent,
    MaterialTableComponent
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', overflow: 'hidden' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class OrdersListComponent {
  private materialsService = inject(MaterialsService);
  private suppliersService = inject(SuppliersService);
  private router = inject(Router);
  private ordersService = inject(OrdersService);

  orders: Order[] = [];
  materialsMap = new Map<number, string>();
  suppliersMap = new Map<number, string>();
  materialsById = new Map<number, Material>();

  materialGroups: MaterialCategoryGroup[] = [];
  expandedOrders = new Set<number>();

  materialTableColumns: MaterialTableColumn[] = [
    { key: 'quantity', header: 'Menge', width: '120px' },
    { key: 'preis_pro_stueck', header: 'Preis/Stk.', width: '120px' },
    { key: 'mwst_satz', header: 'MwSt.', width: '100px' },
    { key: 'gesamt', header: 'Gesamt', width: '120px' }
  ];

  ngOnInit() {
    this.ordersService.getAll().subscribe(list => {
      this.orders = list;
    });

    this.suppliersService.getAll().subscribe(suppliers => {
      suppliers.forEach(s => {
        this.suppliersMap.set(s.id, s.name);
      });
    });

    this.materialsService.getMaterialsGrouped().subscribe(groups => {
      this.materialGroups = groups;

      groups.forEach(group => {
        group.materials.forEach(m => {
          this.materialsMap.set(m.id, m.bezeichnung);
          this.materialsById.set(m.id, m);
        });
      });
    });
  }

  delete(id: number) {
    if (confirm('Bestellung wirklich löschen?')) {
      this.ordersService.delete(id).subscribe(() => {
        this.orders = this.orders.filter(o => o.id !== id);
      });
    }
  }

  getMaterialName(id: number): string {
    return this.materialsMap.get(id) || `#${id}`;
  }

  getItemSummary(items: { material: number; quantity: number }[]): string {
    return items.map(i => `${i.quantity}x ${this.getMaterialName(i.material)}`).join(', ');
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  }

  formatCurrency(value: any): string {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '—';
    return `${num.toFixed(2)} €`;
  }

  getItemsByCategory(
    items: Order['items'],
    categoryId: number | null
  ): Order['items'] {
    if (categoryId === null) {
      return [];
    }
    const group = this.materialGroups.find(g => g.category_id === categoryId);
    if (!group) {
      return [];
    }
    const materialIds = group.materials.map(m => m.id);
    return items.filter(item => materialIds.includes(item.material));
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/orders', id]);
  }

  getTotalQuantityByCategory(items: Order['items'], categoryId: number | null): number {
    const categoryItems = this.getItemsByCategory(items, categoryId);
    return categoryItems.reduce((sum, item) => sum + parseFloat(item.quantity as any), 0);
  }

  getSupplierName(supplierId: number): string {
    return this.suppliersMap.get(supplierId) || `#${supplierId}`;
  }

  calculateTotalCost(order: Order): number {
    const itemsCost = order.items.reduce((sum, item) => {
      const netto = item.preis_pro_stueck * item.quantity;
      const mwst = (item.mwst_satz ?? 19) / 100;
      return sum + (netto * (1 + mwst));
    }, 0);

    const versandNetto = order.versandkosten ?? 0;
    const versandMwst = (order.versandkosten_mwst_satz ?? 19) / 100;
    const versandBrutto = versandNetto * (1 + versandMwst);

    return itemsCost + versandBrutto;
  }

  getMaterialsList(items: Order['items']): string {
    if (items.length === 0) return '—';
    if (items.length > 3) {
      return `${items.length} Materialien`;
    }
    return items.map(i => `${i.quantity}× ${this.getMaterialName(i.material)}`).join(', ');
  }

  toggleOrderExpansion(orderId: number, event: Event): void {
    event.stopPropagation();
    if (this.expandedOrders.has(orderId)) {
      this.expandedOrders.delete(orderId);
    } else {
      this.expandedOrders.add(orderId);
    }
  }

  isOrderExpanded(orderId: number): boolean {
    return this.expandedOrders.has(orderId);
  }

  getMaterialTableRows(order: Order): MaterialTableRow[] {
    return order.items.map(item => {
      const material = this.materialsById.get(item.material);
      const categoryGroup = this.materialGroups.find(g =>
        g.materials.some(m => m.id === item.material)
      );
      const categoryOrder = categoryGroup?.materials.find(m => m.id === item.material)?.category?.order ?? 9999;

      return {
        materialId: item.material,
        materialName: material?.bezeichnung || `Material #${item.material}`,
        materialManufacturerName: material?.hersteller_bezeichnung || undefined,
        materialImageUrl: material?.bild_url || null,
        categoryName: categoryGroup?.category_name || 'Ohne Kategorie',
        categoryOrder: categoryOrder,
        data: {
          quantity: item.quantity,
          preis_pro_stueck: item.preis_pro_stueck,
          mwst_satz: item.mwst_satz ?? 19,
          gesamt: this.calculateItemTotal(item)
        }
      };
    });
  }

  calculateItemTotal(item: Order['items'][0]): number {
    const netto = item.preis_pro_stueck * item.quantity;
    const mwst = (item.mwst_satz ?? 19) / 100;
    return netto * (1 + mwst);
  }
}
