import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrdersService, OrderItem } from './orders.service';
import { MaterialsService, Material } from '../materials/materials.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

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
    MatIconModule
  ]
})
export class OrderFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersService = inject(OrdersService);
  private materialsService = inject(MaterialsService);

  orderId: number | null = null;
  bestellt_am: string = '';
  angekommen_am: string = '';
  versandkosten: number = 0;
  notiz: string = '';

  materialsList: Material[] = [];
  materialAssignments: {
    [materialId: number]: { quantity: number; preis: number; quelle: string };
  } = {};

  ngOnInit() {
    this.orderId = Number(this.route.snapshot.paramMap.get('id')) || null;

    this.materialsService.getMaterials().subscribe(mats => {
      this.materialsList = mats;
      for (const mat of mats) {
        this.materialAssignments[mat.id] = {
          quantity: 0,
          preis: 0,
          quelle: ''
        };
      }
    });

    if (this.orderId) {
      this.ordersService.get(this.orderId).subscribe(order => {
        this.bestellt_am = order.bestellt_am;
        this.angekommen_am = order.angekommen_am;
        this.versandkosten = order.versandkosten;
        this.notiz = order.notiz || '';

        order.items.forEach(item => {
          this.materialAssignments[item.material] = {
            quantity: item.quantity,
            preis: item.preis_pro_stueck,
            quelle: item.quelle
          };
        });
      });
    }
  }

  save() {
    const items: OrderItem[] = Object.entries(this.materialAssignments)
      .filter(([_, v]) => v.quantity > 0)
      .map(([materialId, v]) => ({
        material: +materialId,
        quantity: v.quantity,
        preis_pro_stueck: v.preis,
        quelle: v.quelle
      }));

    const payload = {
      bestellt_am: this.bestellt_am,
      angekommen_am: this.angekommen_am,
      versandkosten: this.versandkosten,
      notiz: this.notiz,
      items
    };

    const request = this.orderId
      ? this.ordersService.update(this.orderId, payload)
      : this.ordersService.create(payload);

    request.subscribe(() => {
      this.router.navigate(['/orders']);
    });
  }
}
