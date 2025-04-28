import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { DeliveriesService, DeliveryItem } from './deliveries.service';
import { MaterialsService, MaterialCategoryGroup } from '../materials/materials.service';
import { WorkshopsService, Workshop } from '../settings/workshop.services';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

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
    MatIconModule,
  ],
})
export class DeliveryFormComponent {
  private deliveriesService = inject(DeliveriesService);
  private workshopsService = inject(WorkshopsService);
  private materialsService = inject(MaterialsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  deliveryId: number | null = null;
  note = '';
  workshopId: number | null = null;

  workshops: Workshop[] = [];
  materialGroups: MaterialCategoryGroup[] = [];
  materialAssignments: Record<number, { quantity: number; note: string }> = {};

  editMode = true;

  ngOnInit(): void {
    this.deliveryId = Number(this.route.snapshot.paramMap.get('id')) || null;

    this.loadWorkshops();
    this.loadMaterialsAndDelivery();
  }

  private loadWorkshops(): void {
    this.workshopsService.getAll().subscribe(workshops => {
      this.workshops = workshops;
    });
  }

  private loadMaterialsAndDelivery(): void {
    this.materialsService.getMaterialsGrouped().subscribe(groups => {
      this.materialGroups = groups;

      // Materialien initialisieren
      const allMaterials = groups.flatMap(group => group.materials);
      allMaterials.forEach(mat => {
        this.materialAssignments[mat.id] = { quantity: 0, note: '' };
      });

      if (this.deliveryId) {
        this.deliveriesService.getOne(this.deliveryId).subscribe(delivery => {
          this.workshopId = Number(delivery.workshop);
          this.note = delivery.note || '';

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
}
