import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

export interface InventoryCorrection {
  materialId: number;
  materialName: string;
  inventoryCount: number;
  currentStock: number;
}

export interface InventoryCorrectionsDialogData {
  corrections: InventoryCorrection[];
}

@Component({
  selector: 'app-inventory-corrections-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>inventory</mat-icon>
      Inventurkorrekturen bestätigen
    </h2>

    <mat-dialog-content class="dialog-content">
      <p class="confirmation-text">
        Sollen alle <strong>{{data.corrections.length}}</strong> Inventurkorrekturen gespeichert werden?
      </p>

      <div class="corrections-list">
        <mat-list>
          <mat-list-item *ngFor="let correction of data.corrections" class="correction-item">
            <div class="correction-details">
              <div class="material-name">{{correction.materialName}}</div>
              <div class="stock-change">
                <span class="current-stock">{{correction.currentStock}}</span>
                <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                <span class="new-stock">{{correction.inventoryCount}}</span>
                <span class="difference"
                      [class.positive]="correction.inventoryCount > correction.currentStock"
                      [class.negative]="correction.inventoryCount < correction.currentStock">
                  ({{getDifference(correction)}})
                </span>
              </div>
            </div>
          </mat-list-item>
        </mat-list>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Abbrechen</button>
      <button mat-raised-button color="primary" (click)="onConfirm()">
        <mat-icon>save</mat-icon>
        Alle speichern
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 400px;
      max-width: 600px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .confirmation-text {
      margin-bottom: 16px;
      font-size: 16px;
    }

    .corrections-list {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      max-height: 400px;
      overflow-y: auto;
    }

    .correction-item {
      border-bottom: 1px solid #f0f0f0;
    }

    .correction-item:last-child {
      border-bottom: none;
    }

    .correction-details {
      width: 100%;
      padding: 8px 0;
    }

    .material-name {
      font-weight: 500;
      margin-bottom: 4px;
      color: #333;
    }

    .stock-change {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .current-stock {
      color: #666;
      min-width: 40px;
      text-align: right;
    }

    .arrow-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #999;
    }

    .new-stock {
      font-weight: 600;
      color: #1976d2;
      min-width: 40px;
    }

    .difference {
      font-size: 12px;
      font-weight: 500;
    }

    .difference.positive {
      color: #2e7d32;
    }

    .difference.negative {
      color: #d32f2f;
    }

    mat-dialog-actions {
      padding: 16px 24px;
      margin: 0;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 24px 24px 16px;
    }

    .mat-mdc-list-item {
      height: auto !important;
      padding: 8px 16px !important;
    }
  `]
})
export class InventoryCorrectionsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<InventoryCorrectionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InventoryCorrectionsDialogData
  ) {}

  getDifference(correction: InventoryCorrection): string {
    const diff = correction.inventoryCount - correction.currentStock;
    return diff > 0 ? `+${diff}` : `${diff}`;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
