// src/app/features/materials/material-detail.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialsService, Material, MaterialMovement, MaterialStock } from './materials.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { Workshop, WorkshopsService } from '../settings/workshop.services';
import { MatIconModule } from '@angular/material/icon';
import { MaterialUsageComponent } from '../../shared/components/material-usage/material-usage.component';

@Component({
  selector: 'app-material-detail',
  standalone: true,
  templateUrl: './material-detail.component.html',
  styleUrls: ['./material-detail.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatTableModule,
    MatInputModule,
    MaterialUsageComponent
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
  stockInfo: MaterialStock | null = null;

  editMovementId: number | null = null;
  editedMovement: Partial<MaterialMovement> = {};

  errorMessage: string | null = null;

  ngOnInit() {
    this.materialsService.getMaterial(this.materialId).subscribe(mat => this.material = mat);
    this.workshopsService.getAll().subscribe(ws => {
      this.workshops = ws;
      if (ws.length > 0) {
        this.selectedWorkshopId = ws[0].id;
        this.loadMovements();
        this.loadStock();
      }
    });
  }

  loadMovements() {
    if (!this.selectedWorkshopId) return;
    this.materialsService.getMaterialMovements(this.materialId, this.selectedWorkshopId)
      .subscribe(movs => {
        this.movements = movs.map(m => ({ ...m, quantity: Number(m.quantity) }));
      });
  }

  loadStock() {
    if (!this.selectedWorkshopId) return;
    this.materialsService.getMaterialStock(this.materialId, this.selectedWorkshopId).subscribe(stock => {
      this.stockInfo = stock;
    });
  }

  onWorkshopChange() {
    this.loadMovements();
    this.loadStock();
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
      case 'transfer': return 'Transfer';
      default: return type;
    }
  }

  cancelEdit() {
    this.editMovementId = null;
    this.editedMovement = {};
  }

  saveEdit(m: MaterialMovement) {
    if (!this.editedMovement) return;
    this.materialsService.updateMaterialMovement(this.materialId, m.id, this.editedMovement).subscribe({
      next: () => {
        Object.assign(m, this.editedMovement);
        this.cancelEdit();
        this.errorMessage = null;
      },
      error: (err) => {
        if (err.status === 400 && err.error?.detail) {
          this.errorMessage = err.error.detail;
        } else {
          this.errorMessage = 'Speichern fehlgeschlagen.';
        }
      }
    });
  }

  deleteMovement(id: number) {
    if (confirm('Wirklich löschen?')) {
      this.materialsService.deleteMaterialMovement(this.materialId, id).subscribe({
        next: () => {
          this.movements = this.movements.filter(m => m.id !== id);
          this.errorMessage = null;
        },
        error: (err) => {
          if (err.status === 400 && err.error?.detail) {
            this.errorMessage = err.error.detail;
          } else {
            this.errorMessage = 'Löschen fehlgeschlagen.';
          }
        }
      });
    }
  }

  getWorkshopNameById(id: number | null): string {
    const workshop = this.workshops.find(w => w.id === id);
    return workshop?.name || '[Unbekannt]';
  }


  newMovement: Partial<MaterialMovement> = {
    change_type: 'lieferung',
    quantity: 1,
    note: ''
  };


  createMovement() {
    if (!this.selectedWorkshopId || !this.materialId) return;

    if (!this.newMovement.change_type || this.newMovement.quantity == null) {
      this.errorMessage = 'Bitte Typ und Menge angeben.';
      return;
    }

    const payload = {
      material: this.materialId,
      workshop_id: this.selectedWorkshopId,
      change_type: this.newMovement.change_type,
      quantity: this.newMovement.quantity,
      note: this.newMovement.note
    };

    this.materialsService.addMaterialMovement(payload).subscribe({
      next: () => {
        this.loadMovements();
        this.loadStock();
        this.newMovement = { change_type: 'lieferung', quantity: 1, note: '' };
      },
      error: (err: any) => {
        if (err.status === 400 && err.error?.detail) {
          this.errorMessage = err.error.detail;
        } else if (err.status === 400 && err.error) {
          this.errorMessage = JSON.stringify(err.error);  // zeigt Validierungsfehler
        } else {
          this.errorMessage = 'Neuer Vorgang konnte nicht gespeichert werden.';
        }
      }
    });
  }
}
