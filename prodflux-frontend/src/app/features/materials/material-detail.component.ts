// src/app/features/materials/material-detail.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialsService, Material, MaterialMovement } from './materials.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { Workshop, WorkshopsService } from '../settings/workshop.services';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-material-detail',
  standalone: true,
  templateUrl: './material-detail.component.html',
  styleUrls: ['./material-detail.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatTableModule,
    MatInputModule
  ]
})
export class MaterialDetailComponent {
  private route = inject(ActivatedRoute);
  private materialsService = inject(MaterialsService);
  private workshopsService = inject(WorkshopsService);

  materialId: number = Number(this.route.snapshot.paramMap.get('id'));
  material: Material | null = null;
  movements: MaterialMovement[] = [];
  workshops: Workshop[] = [];
  selectedWorkshopId: number | null = null;

  editMovementId: number | null = null;
  editedMovement: Partial<MaterialMovement> = {};

  ngOnInit() {
    this.materialsService.getMaterial(this.materialId).subscribe(mat => this.material = mat);
    this.workshopsService.getAll().subscribe(ws => {
      this.workshops = ws;
      if (ws.length > 0) {
        this.selectedWorkshopId = ws[0].id;
        this.loadMovements();
      }
    });
  }

  loadMovements() {
    if (!this.selectedWorkshopId) return;
    this.materialsService.getMaterialMovements(this.materialId, this.selectedWorkshopId).subscribe(movs => {
      this.movements = movs;
    });
  }

  onWorkshopChange() {
    this.loadMovements();
  }

  startEdit(m: MaterialMovement) {
    this.editMovementId = m.id;
    this.editedMovement = {
      note: m.note || '',
      quantity: m.quantity,
      change_type: m.change_type
    };
  }

  formatChangeType(type: string): string {
    switch (type) {
      case 'lieferung': return 'Lieferung';
      case 'verbrauch': return 'Verbrauch';
      case 'korrektur': return 'Korrektur';
      case 'verlust': return 'Verlust';
      default: return type;
    }
  }



  cancelEdit() {
    this.editMovementId = null;
    this.editedMovement = {};
  }

  saveEdit(m: MaterialMovement) {
    if (!this.editedMovement) return;
    this.materialsService.updateMaterialMovement(m.id, this.editedMovement).subscribe(() => {
      Object.assign(m, this.editedMovement);
      this.cancelEdit();
    });
  }

  deleteMovement(id: number) {
    if (confirm('Wirklich löschen?')) {
      this.materialsService.deleteMaterialMovement(id).subscribe(() => {
        this.movements = this.movements.filter(m => m.id !== id);
      });
    }
  }
}
