import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrdersService, Order } from './orders.service';
import { MaterialCategoryGroup, MaterialsService } from '../materials/materials.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

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
    RouterModule,
    BreadcrumbComponent
  ],
})
export class OrdersListComponent {
  private materialsService = inject(MaterialsService);
  private router = inject(Router);
  private ordersService = inject(OrdersService);

  orders: Order[] = [];
  materialsMap = new Map<number, string>();

  materialGroups: MaterialCategoryGroup[] = [];

  ngOnInit() {
    this.ordersService.getAll().subscribe(list => {
      this.orders = list;
    });

    this.materialsService.getMaterialsGrouped().subscribe(groups => {
      this.materialGroups = groups;

      groups.forEach(group => {
        group.materials.forEach(m => {
          this.materialsMap.set(m.id, m.bezeichnung);
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
}
