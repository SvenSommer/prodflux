// src/app/features/materials/material-detail.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialsService, Material, MaterialMovement, MaterialStock, ToggleMaterialDeprecatedResponse } from './materials.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { Workshop, WorkshopsService } from '../settings/workshop.services';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialUsageComponent } from '../../shared/components/material-usage/material-usage.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { Router } from '@angular/router';
import { MaterialSupplierPricesComponent } from './material-supplier-prices/material-supplier-prices.component';

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
    MatButtonModule,
    MatTooltipModule,
    MaterialUsageComponent,
    BreadcrumbComponent,
    MaterialSupplierPricesComponent
  ]
})
export class MaterialDetailComponent {
  private route = inject(ActivatedRoute);
  private materialsService = inject(MaterialsService);
  private workshopsService = inject(WorkshopsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  materialId: number = Number(this.route.snapshot.paramMap.get('id'));
  material: Material | null = null;
  movements: MaterialMovement[] = [];
  workshops: Workshop[] = [];
  selectedWorkshopId: number | null = null;
  stockInfo: MaterialStock | null = null;
  workshopStocks: Map<number, MaterialStock> = new Map();

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
        // Lade Bestände für alle Werkstätten
        this.loadAllWorkshopStocks();
      }
    });
  }

  loadAllWorkshopStocks() {
    this.workshops.forEach(workshop => {
      this.materialsService.getMaterialStock(this.materialId, workshop.id).subscribe(stock => {
        this.workshopStocks.set(workshop.id, stock);
      });
    });
  }

  loadMovements() {
    if (!this.selectedWorkshopId) return;
    this.materialsService.getMaterialMovements(this.materialId, this.selectedWorkshopId)
      .subscribe(movs => {
        // Nach Datum absteigend sortieren (neueste zuerst)
        this.movements = movs
          .map(m => ({ ...m, quantity: Number(m.quantity) }))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      });
  }

  loadStock() {
    if (!this.selectedWorkshopId) return;
    this.materialsService.getMaterialStock(this.materialId, this.selectedWorkshopId).subscribe(stock => {
      this.stockInfo = stock;
    });
  }

  getWorkshopStock(workshopId: number): number {
    const stock = this.workshopStocks.get(workshopId);
    return stock ? stock.current_stock : 0;
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
    const dialogData: ConfirmDialogData = {
      title: 'Bewegung löschen',
      message: 'Möchten Sie diese Materialbewegung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      confirmText: 'Löschen',
      cancelText: 'Abbrechen',
      icon: 'delete',
      color: 'warn'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
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
    });
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

  toggleDeprecatedStatus(): void {
    if (!this.material) return;

    this.materialsService.toggleMaterialDeprecated(this.material.id).subscribe({
      next: (response: ToggleMaterialDeprecatedResponse) => {
        // Material Status lokal aktualisieren
        if (this.material) {
          this.material.deprecated = response.material_deprecated;
        }

        const message = `Material "${this.material?.bezeichnung}" wurde `;
        const actionText = response.action === 'deprecated' ? 'als veraltet markiert' : 'wieder aktiviert';

        this.snackBar.open(message + actionText, 'Schließen', {
          duration: 4000
        });
      },
      error: (error) => {
        console.error('Fehler beim Ändern des Deprecated-Status:', error);
        this.snackBar.open('Fehler beim Ändern des Deprecated-Status', 'Schließen', {
          duration: 5000
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/materials']);
  }

  getBreadcrumbLinks() {
    return [
      { label: 'Materialien', url: '/materials' },
      { label: this.material?.bezeichnung || 'Material' }
    ];
  }
}
