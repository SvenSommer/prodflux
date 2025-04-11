// src/app/features/deliveries/delivery-form.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { DeliveriesService, DeliveryItem } from './deliveries.service';
import { MaterialsService, Material } from '../materials/materials.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { WorkshopsService, Workshop } from '../settings/workshop.services';

@Component({
  selector: 'app-delivery-form',
  standalone: true,
  templateUrl: './delivery-form.component.html',
  styleUrls: ['./delivery-form.component.scss'],
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
export class DeliveryFormComponent {
  private deliveriesService = inject(DeliveriesService);
  private workshopsService = inject(WorkshopsService);
  private materialsService = inject(MaterialsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  deliveryId: number | null = null;
  note: string = '';
  workshopId: number | null = null;

  workshops: Workshop[] = [];
  materialsList: Material[] = [];
  materialAssignments: { [materialId: number]: number } = {};

  editMode = true;

  ngOnInit() {
    this.deliveryId = Number(this.route.snapshot.paramMap.get('id')) || null;

    this.workshopsService.getAll().subscribe(ws => this.workshops = ws);
    this.materialsService.getMaterials().subscribe(mats => {
      this.materialsList = mats;
      this.materialAssignments = {};
      for (const mat of mats) {
        this.materialAssignments[mat.id] = 0;
      }
    });

    if (this.deliveryId) {
      this.deliveriesService.getOne(this.deliveryId).subscribe(delivery => {
        this.workshopId = typeof delivery.workshop === 'number' ? delivery.workshop : Number(delivery.workshop);
        this.note = delivery.note || '';
        delivery.items.forEach(item => {
          this.materialAssignments[item.material] = item.quantity;
        });
      });
    }
  }

  save() {
    const items: DeliveryItem[] = Object.entries(this.materialAssignments)
      .filter(([_, qty]) => qty > 0)
      .map(([materialId, qty]) => ({ material: +materialId, quantity: qty }));

    const payload = {
      workshop: this.workshopId!,
      note: this.note,
      items,
    };

    const request = this.deliveryId
      ? this.deliveriesService.update(this.deliveryId, payload)
      : this.deliveriesService.create(payload);

    request.subscribe(() => {
      this.router.navigate(['/deliveries']);
    });
  }

  getMaterialBezeichnung(id: number) {
    return this.materialsList.find(m => m.id === id)?.bezeichnung || `#${id}`;
  }

  getMaterialHersteller(id: number) {
    return this.materialsList.find(m => m.id === id)?.hersteller_bezeichnung || '';
  }
}
