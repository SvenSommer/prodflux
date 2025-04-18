import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrdersService, Order } from './orders.service';
import { MaterialsService } from '../materials/materials.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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
  ],
})
export class OrdersListComponent {
  private ordersService = inject(OrdersService);
  private materialsService = inject(MaterialsService);

  orders: Order[] = [];
  materialsMap = new Map<number, string>();

  ngOnInit() {
    this.ordersService.getAll().subscribe(list => {
      this.orders = list;
    });

    this.materialsService.getMaterials().subscribe(materials => {
      materials.forEach(m => {
        this.materialsMap.set(m.id, m.bezeichnung);
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

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString();
  }

  formatCurrency(value: any): string {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '—';
    return `${num.toFixed(2)} €`;
  }
}
