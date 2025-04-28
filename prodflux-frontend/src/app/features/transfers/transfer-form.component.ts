import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { TransfersService, TransferItem } from './transfers.service';
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
  selector: 'app-transfer-form',
  standalone: true,
  templateUrl: './transfer-form.component.html',
  styleUrls: ['./transfer-form.component.scss'],
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
export class TransferFormComponent {
  private transfersService = inject(TransfersService);
  private workshopsService = inject(WorkshopsService);
  private materialsService = inject(MaterialsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  transferId: number | null = null;
  note = '';
  sourceWorkshopId: number | null = null;
  targetWorkshopId: number | null = null;

  workshops: Workshop[] = [];
  materialGroups: MaterialCategoryGroup[] = [];
  materialAssignments: Record<number, { quantity: number; note: string }> = {};

  ngOnInit(): void {
    this.transferId = Number(this.route.snapshot.paramMap.get('id')) || null;
    this.loadWorkshops();
    this.loadMaterialsAndTransfer();
  }

  private loadWorkshops(): void {
    this.workshopsService.getAll().subscribe(workshops => {
      this.workshops = workshops;
    });
  }

  private loadMaterialsAndTransfer(): void {
    this.materialsService.getMaterialsGrouped().subscribe(groups => {
      this.materialGroups = groups;
      const allMaterials = groups.flatMap(group => group.materials);
      allMaterials.forEach(mat => {
        this.materialAssignments[mat.id] = { quantity: 0, note: '' };
      });

      if (this.transferId) {
        this.transfersService.get(this.transferId).subscribe(transfer => {
          this.sourceWorkshopId = transfer.source_workshop;
          this.targetWorkshopId = transfer.target_workshop;
          this.note = transfer.note || '';

          transfer.items.forEach(item => {
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
    if (this.sourceWorkshopId === this.targetWorkshopId) {
      alert('Quelle und Ziel dürfen nicht identisch sein.');
      return;
    }

    const items: TransferItem[] = Object.entries(this.materialAssignments)
      .filter(([_, assignment]) => assignment.quantity > 0)
      .map(([materialId, assignment]) => ({
        material: +materialId,
        quantity: assignment.quantity,
        note: assignment.note || '',
      }));

    const payload = {
      source_workshop: this.sourceWorkshopId!,
      target_workshop: this.targetWorkshopId!,
      note: this.note,
      items,
    };

    const request = this.transferId
      ? this.transfersService.update(this.transferId, payload)
      : this.transfersService.create(payload);

    request.subscribe(() => {
      this.router.navigate(['/transfers']);
    });
  }
}
