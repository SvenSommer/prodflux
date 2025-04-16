import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { OrdersService, Order } from './orders.service';
import { MaterialsService } from '../materials/materials.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
})
export class OrderDetailComponent {
  private route = inject(ActivatedRoute);
  private ordersService = inject(OrdersService);
  private materialsService = inject(MaterialsService);

  orderId = Number(this.route.snapshot.paramMap.get('id'));
  order: Order | undefined;
  materialsMap = new Map<number, string>();

  ngOnInit() {
    this.materialsService.getMaterials().subscribe(mats => {
      mats.forEach(m => this.materialsMap.set(m.id, m.bezeichnung));
    });

    this.ordersService.get(this.orderId).subscribe((o: Order) => {
      this.order = o;
    });
  }

  getMaterialName(id: number): string {
    return this.materialsMap.get(id) || `#${id}`;
  }

  formatCurrency(value: any): string {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '—';
    return `${num.toFixed(2)} €`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString();
  }
}
