import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MaterialDependencyResponse } from './products.service';

export interface ToggleProductDialogData {
  product: {
    id: number;
    bezeichnung: string;
    deprecated: boolean;
  };
  dependencies: MaterialDependencyResponse;
}

export interface ToggleProductDialogResult {
  confirmed: boolean;
  handleMaterials: boolean;
}

@Component({
  selector: 'app-toggle-product-dialog',
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
      <mat-icon>{{ isDeprecating ? 'archive' : 'unarchive' }}</mat-icon>
      {{ isDeprecating ? 'Produkt als veraltet markieren' : 'Produkt wieder aktivieren' }}
    </h2>

    <mat-dialog-content class="dialog-content">
      <p class="product-info" [class.reactivate]="!isDeprecating">
        Das Produkt <strong>"{{ data.product.bezeichnung }}"</strong> wird 
        {{ isDeprecating ? 'als veraltet markiert und erscheint nicht mehr in den Produktlisten' : 'wieder aktiviert und erscheint in den Produktlisten' }}.
      </p>

      <!-- Deprecating Section -->
      <div class="materials-section" *ngIf="isDeprecating && data.dependencies.can_deprecate_materials">
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

        <div class="handle-checkbox deprecate">
          <mat-checkbox
            [(ngModel)]="handleMaterials"
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

      <!-- Reactivating Section -->
      <div class="materials-section" *ngIf="!isDeprecating && hasDeprecatedMaterials">
        <div class="section-header">
          <mat-icon>inventory</mat-icon>
          <h3>Veraltete Materialien des Produkts</h3>
        </div>

        <p class="info-text">
          Die folgenden Materialien dieses Produkts sind aktuell als veraltet markiert:
        </p>

        <div class="materials-list">
          <div
            *ngFor="let material of deprecatedMaterials"
            class="material-item"
          >
            <mat-icon class="material-icon">category</mat-icon>
            <div class="material-details">
              <span class="material-name">{{ material.bezeichnung }}</span>
              <span class="material-usage">{{ material.quantity_per_unit }}x pro Produkt</span>
            </div>
          </div>
        </div>

        <div class="handle-checkbox reactivate">
          <mat-checkbox
            [(ngModel)]="handleMaterials"
            color="primary"
          >
            Auch diese Materialien wieder aktivieren
          </mat-checkbox>
          <p class="checkbox-hint">
            Empfohlen: Materialien wieder aktivieren, wenn sie für die Produktion benötigt werden.
          </p>
        </div>
      </div>

      <div class="materials-section" *ngIf="data.dependencies.shared_materials.length > 0">
        <div class="section-header">
          <mat-icon>share</mat-icon>
          <h3>Geteilte Materialien</h3>
        </div>

        <p class="info-text">
          Diese Materialien werden auch von anderen Produkten verwendet und {{ isDeprecating ? 'bleiben aktiv' : 'bleiben unverändert' }}:
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

      <div class="warning-section" *ngIf="!hasAnyMaterials">
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
        [color]="isDeprecating ? 'warn' : 'primary'"
        (click)="onConfirm()"
        class="action-button"
      >
        <mat-icon>{{ isDeprecating ? 'archive' : 'unarchive' }}</mat-icon>
        {{ isDeprecating ? 'Als veraltet markieren' : 'Wieder aktivieren' }}
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
      border-left: 4px solid #d84315;

      &.reactivate {
        background-color: #e8f5e8;
        border-left-color: #2e7d32;
      }
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

    .handle-checkbox {
      padding: 1rem;
      border-radius: 4px;
      border-left: 4px solid;

      &.deprecate {
        background-color: #fff3e0;
        border-left-color: #ff9800;
      }

      &.reactivate {
        background-color: #e8f5e8;
        border-left-color: #4caf50;
      }

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

      .action-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      padding: 1.5rem 1.5rem 1rem;

      mat-icon {
        font-size: 1.5rem;
      }
    }
  `]
})
export class ToggleProductDialogComponent {
  handleMaterials = false;

  constructor(
    public dialogRef: MatDialogRef<ToggleProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ToggleProductDialogData
  ) {
    // Standardmäßig Materials handling aktivieren wenn es relevante Materialien gibt
    if (this.isDeprecating) {
      this.handleMaterials = data.dependencies.can_deprecate_materials;
    } else {
      this.handleMaterials = this.hasDeprecatedMaterials;
    }
  }

  get isDeprecating(): boolean {
    return !this.data.product.deprecated;
  }

  get deprecatedMaterials() {
    return [...this.data.dependencies.exclusive_materials, ...this.data.dependencies.shared_materials]
      .filter(m => m.current_deprecated);
  }

  get hasDeprecatedMaterials(): boolean {
    return this.deprecatedMaterials.length > 0;
  }

  get hasAnyMaterials(): boolean {
    return this.data.dependencies.exclusive_materials.length > 0 || 
           this.data.dependencies.shared_materials.length > 0;
  }

  onCancel(): void {
    this.dialogRef.close({
      confirmed: false,
      handleMaterials: false
    });
  }

  onConfirm(): void {
    this.dialogRef.close({
      confirmed: true,
      handleMaterials: this.handleMaterials
    });
  }
}