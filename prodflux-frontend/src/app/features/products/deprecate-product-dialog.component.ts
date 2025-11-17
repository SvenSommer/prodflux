import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MaterialDependencyResponse } from './products.service';

export interface DeprecateProductDialogData {
  product: {
    id: number;
    bezeichnung: string;
  };
  dependencies: MaterialDependencyResponse;
}

export interface DeprecateProductDialogResult {
  confirmed: boolean;
  deprecateMaterials: boolean;
}

@Component({
  selector: 'app-deprecate-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    FormsModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>archive</mat-icon>
      Produkt als veraltet markieren
    </h2>

    <mat-dialog-content class="dialog-content">
      <p class="product-info">
        Das Produkt <strong>"{{ data.product.bezeichnung }}"</strong> wird als veraltet markiert 
        und erscheint nicht mehr in den Produktlisten.
      </p>

      <div class="materials-section" *ngIf="data.dependencies.can_deprecate_materials">
        <div class="section-header">
          <mat-icon>inventory</mat-icon>
          <h3>Ausschließlich verwendete Materialien</h3>
        </div>
        
        <p class="info-text">
          Die folgenden Materialien werden nur von diesem Produkt verwendet:
        </p>

        <div class="materials-list">
          <div 
            *ngFor="let material of data.dependencies.exclusive_materials" 
            class="material-item"
          >
            <mat-icon class="material-icon">category</mat-icon>
            <div class="material-details">
              <span class="material-name">{{ material.bezeichnung }}</span>
              <span class="material-usage">{{ material.quantity_per_unit }}x pro Produkt</span>
            </div>
          </div>
        </div>

        <div class="deprecate-checkbox">
          <mat-checkbox 
            [(ngModel)]="deprecateMaterials"
            color="primary"
          >
            Auch diese Materialien als veraltet markieren
          </mat-checkbox>
          <p class="checkbox-hint">
            Empfohlen: Materialien, die nicht mehr benötigt werden, 
            sollten ebenfalls als veraltet markiert werden.
          </p>
        </div>
      </div>

      <div class="materials-section" *ngIf="data.dependencies.shared_materials.length > 0">
        <div class="section-header">
          <mat-icon>share</mat-icon>
          <h3>Geteilte Materialien</h3>
        </div>
        
        <p class="info-text">
          Diese Materialien werden auch von anderen Produkten verwendet und bleiben aktiv:
        </p>

        <div class="materials-list">
          <div 
            *ngFor="let material of data.dependencies.shared_materials" 
            class="material-item shared"
          >
            <mat-icon class="material-icon">category</mat-icon>
            <div class="material-details">
              <span class="material-name">{{ material.bezeichnung }}</span>
              <span class="material-usage">
                {{ material.quantity_per_unit }}x pro Produkt 
                ({{ material.other_products_count }} weitere Produkte)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="warning-section" *ngIf="!data.dependencies.can_deprecate_materials && data.dependencies.shared_materials.length === 0">
        <mat-icon class="warning-icon">info</mat-icon>
        <p>Dieses Produkt verwendet keine Materialien oder alle Materialien werden von anderen Produkten geteilt.</p>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        Abbrechen
      </button>
      <button 
        mat-raised-button 
        color="warn" 
        (click)="onConfirm()"
        class="deprecate-button"
      >
        <mat-icon>archive</mat-icon>
        Produkt als veraltet markieren
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 500px;
      max-width: 700px;
      max-height: 80vh;
      overflow-y: auto;
      padding: 1rem 0;
    }

    .product-info {
      background-color: #f5f5f5;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      border-left: 4px solid #1976d2;
    }

    .materials-section {
      margin-bottom: 1.5rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;

      mat-icon {
        color: #1976d2;
      }

      h3 {
        margin: 0;
        font-size: 1.1rem;
        color: #333;
      }
    }

    .info-text {
      color: #666;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    .materials-list {
      background-color: #fafafa;
      border-radius: 4px;
      padding: 0.5rem;
      margin-bottom: 1rem;
    }

    .material-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      border-radius: 4px;
      margin-bottom: 0.5rem;

      &:last-child {
        margin-bottom: 0;
      }

      &.shared {
        background-color: #e8f5e8;
      }

      .material-icon {
        color: #666;
        font-size: 1.2rem;
      }

      .material-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .material-name {
          font-weight: 500;
          color: #333;
        }

        .material-usage {
          font-size: 0.8rem;
          color: #666;
        }
      }
    }

    .deprecate-checkbox {
      background-color: #fff3e0;
      padding: 1rem;
      border-radius: 4px;
      border-left: 4px solid #ff9800;

      .checkbox-hint {
        font-size: 0.8rem;
        color: #666;
        margin: 0.5rem 0 0 0;
        line-height: 1.3;
      }
    }

    .warning-section {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background-color: #f0f4f8;
      border-radius: 4px;
      margin-bottom: 1rem;

      .warning-icon {
        color: #1976d2;
      }

      p {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
      }
    }

    mat-dialog-actions {
      padding: 1rem 1.5rem;
      margin: 0;

      .deprecate-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #d84315;
      margin: 0;
      padding: 1.5rem 1.5rem 1rem;

      mat-icon {
        font-size: 1.5rem;
      }
    }
  `]
})
export class DeprecateProductDialogComponent {
  deprecateMaterials = false;

  constructor(
    public dialogRef: MatDialogRef<DeprecateProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeprecateProductDialogData
  ) {
    // Standardmäßig Materials deprecated setzen wenn es exklusive gibt
    this.deprecateMaterials = data.dependencies.can_deprecate_materials;
  }

  onCancel(): void {
    this.dialogRef.close({
      confirmed: false,
      deprecateMaterials: false
    });
  }

  onConfirm(): void {
    this.dialogRef.close({
      confirmed: true,
      deprecateMaterials: this.deprecateMaterials
    });
  }
}