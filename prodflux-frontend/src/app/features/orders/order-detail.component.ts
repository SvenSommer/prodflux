import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrdersService, Order } from './orders.service';
import { MaterialCategoryGroup, MaterialsService } from '../materials/materials.service';
import { DeliveriesService, Delivery } from '../deliveries/deliveries.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, BreadcrumbComponent, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
})
export class OrderDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersService = inject(OrdersService);
  private materialsService = inject(MaterialsService);
  private deliveriesService = inject(DeliveriesService);

  orderId = Number(this.route.snapshot.paramMap.get('id'));
  order: Order | undefined;
  deliveries: Delivery[] = [];  // NEW: deliveries linked to this order
  materialsMap = new Map<number, string>();
  materialGroups: MaterialCategoryGroup[] = [];

  ngOnInit() {
    this.materialsService.getMaterialsGrouped().subscribe(groups => {
      this.materialGroups = groups;
      groups.forEach(group => {
        group.materials.forEach(m => {
          this.materialsMap.set(m.id, m.bezeichnung);
        });
      });
    });

    this.ordersService.get(this.orderId).subscribe((o: Order) => {
      this.order = o;
    });

    // Load deliveries for this order (server-side filtered)
    this.deliveriesService.getByOrder(this.orderId).subscribe(deliveries => {
      this.deliveries = deliveries;
    });
  }

  getMaterialName(id: number): string {
    return this.materialsMap.get(id) || `#${id}`;
  }

  formatCurrency(value: any): string {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '—';
    // Zeige bis zu 5 Dezimalstellen, aber entferne trailing zeros
    return `${num.toFixed(5).replace(/\.?0+$/, '')} €`;
  }

  calculateBrutto(netto: number, mwstSatz?: number): number {
    const satz = mwstSatz ?? 19;
    return netto * (1 + satz / 100);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  }

  getItemsByCategory(items: Order['items'], categoryId: number | null) {
    const group = this.materialGroups.find(g => g.category_id === categoryId);
    if (!group) {
      return [];
    }
    const materialIdsInGroup = group.materials.map(m => m.id);
    return items.filter(i => materialIdsInGroup.includes(i.material));
  }

  deleteOrder() {
    if (confirm('Bestellung wirklich löschen?')) {
      this.ordersService.delete(this.orderId).subscribe(() => {
        this.router.navigate(['/orders']);
      });
    }
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
