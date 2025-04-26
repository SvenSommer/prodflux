import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrdersService, OrderItem } from './orders.service';
import { MaterialsService, Material, MaterialCategoryGroup } from '../materials/materials.service';
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

  materialGroups: MaterialCategoryGroup[] = [];

  materialsList: Material[] = [];
  materialAssignments: {
    [materialId: number]: { quantity: number; preis: number; quelle: string };
  } = {};

  ngOnInit() {
    console.log('[OrderForm] Init');
    this.orderId = Number(this.route.snapshot.paramMap.get('id')) || null;

    this.materialsService.getMaterialsGrouped().subscribe(groups => {
      this.materialGroups = groups;

      const allMaterials = groups.flatMap(g => g.materials);
      this.materialsList = allMaterials;

      console.log('[OrderForm] materialsList:', allMaterials);

      for (const mat of allMaterials) {
        this.materialAssignments[mat.id] = {
          quantity: 0,
          preis: 0,
          quelle: ''
        };
      }

      if (this.orderId) {
        this.ordersService.get(this.orderId).subscribe(order => {
          console.log('[OrderForm] fetched order:', order);

          this.bestellt_am = order.bestellt_am;
          this.angekommen_am = order.angekommen_am;
          this.versandkosten = order.versandkosten;
          this.notiz = order.notiz || '';

          order.items.forEach(item => {
            if (!this.materialAssignments[item.material]) {
              console.warn('[OrderForm] WARN: material id not found in materialAssignments:', item.material);
              this.materialAssignments[item.material] = {
                quantity: item.quantity,
                preis: item.preis_pro_stueck,
                quelle: item.quelle
              };
            } else {
              this.materialAssignments[item.material].quantity = item.quantity;
              this.materialAssignments[item.material].preis = item.preis_pro_stueck;
              this.materialAssignments[item.material].quelle = item.quelle;
            }
          });

          console.log('[OrderForm] materialAssignments after load:', this.materialAssignments);
        });
      }
    });
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
