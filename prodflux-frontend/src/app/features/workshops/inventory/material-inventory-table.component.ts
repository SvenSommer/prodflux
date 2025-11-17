import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MaterialStockGroup } from '../workshop.service';

export interface InventoryCountChangeEvent {
  materialId: number;
  count: number;
}

export interface SaveCorrectionEvent {
  materialId: number;
  materialName: string;
}

@Component({
  selector: 'app-material-inventory-table',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="material-inventory-table">
      <ng-container *ngFor="let group of materialGroups">
        <h4 class="category-title">{{ group.category_name }}</h4>

        <table
          mat-table
          [dataSource]="group.materials"
          class="mat-elevation-z1 full-width-table"
        >
          <!-- Nr -->
          <ng-container matColumnDef="nr">
            <th mat-header-cell *matHeaderCellDef>#</th>
            <td mat-cell *matCellDef="let element; let i = index">
              {{ i + 1 }}
            </td>
          </ng-container>

          <!-- Bild -->
          <ng-container matColumnDef="bild">
            <th mat-header-cell *matHeaderCellDef>Bild</th>
            <td mat-cell *matCellDef="let element">
              <img
                *ngIf="element.bild_url"
                [src]="element.bild_url"
                alt="Material Bild"
                class="material-image"
                (error)="onImageError($event)"
              />
              <div *ngIf="!element.bild_url" class="no-image">
                <mat-icon>image_not_supported</mat-icon>
              </div>
            </td>
          </ng-container>

          <!-- Bezeichnung -->
          <ng-container matColumnDef="bezeichnung">
            <th mat-header-cell *matHeaderCellDef>Material</th>
            <td mat-cell *matCellDef="let element">
              <a [routerLink]="['/materials', element.id]" class="material-link"
                 [class.deprecated-material]="element.deprecated">
                {{ element.bezeichnung }}
                <span *ngIf="element.deprecated" class="deprecated-badge">
                  <mat-icon class="deprecated-icon">archive</mat-icon>
                  Veraltet
                </span>
              </a>
            </td>
          </ng-container>

          <!-- Bestand -->
          <ng-container matColumnDef="bestand">
            <th mat-header-cell *matHeaderCellDef>Bestand</th>
            <td mat-cell *matCellDef="let element">
              <span class="stock-amount">{{ element.bestand }}</span>
            </td>
          </ng-container>

          <!-- Inventurmenge (nur im Inventurmodus) -->
          <ng-container matColumnDef="inventurmenge" *ngIf="inventoryModeActive">
            <th mat-header-cell *matHeaderCellDef>Gezählt</th>
            <td mat-cell *matCellDef="let element">
              <mat-form-field appearance="outline" class="inventory-input">
                <input
                  matInput
                  type="number"
                  min="0"
                  [value]="inventoryCounts[element.id] || 0"
                  (input)="onInventoryCountChange(element.id, $event)"
                  placeholder="Gezählte Menge"
                />
              </mat-form-field>
            </td>
          </ng-container>

          <!-- Inventur-Aktionen (nur im Inventurmodus) -->
          <ng-container matColumnDef="inventur-aktionen" *ngIf="inventoryModeActive">
            <th mat-header-cell *matHeaderCellDef>Aktion</th>
            <td mat-cell *matCellDef="let element">
              <button
                mat-icon-button
                color="primary"
                (click)="onSaveCorrection(element.id, element.bezeichnung)"
                matTooltip="Inventurkorrektur speichern"
                [disabled]="isMaterialSaved(element.id)"
              >
                <mat-icon>{{ isMaterialSaved(element.id) ? 'check_circle' : 'save' }}</mat-icon>
              </button>
            </td>
          </ng-container>

          <!-- Header und Row-Definitionen -->
          <tr mat-header-row *matHeaderRowDef="getDisplayedColumns()"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: getDisplayedColumns();"
            [class.saved-row]="inventoryModeActive && isMaterialSaved(row.id)"
          ></tr>
        </table>
      </ng-container>
    </div>
  `,
  styles: [`
    .material-inventory-table {
      .category-title {
        margin: 2rem 0 1rem 0;
        font-weight: 600;
        font-size: 1.125rem;
        color: #1976d2;
        border-bottom: 2px solid #e3f2fd;
        padding-bottom: 0.5rem;

        &:first-child {
          margin-top: 0;
        }
      }

      .full-width-table {
        width: 100%;
        margin-bottom: 2rem;

        .material-image {
          width: 50px;
          height: 50px;
          object-fit: contain;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
          background-color: #f8f9fa;
          padding: 2px;
        }

        .no-image {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f5;
          border-radius: 4px;
          border: 1px solid #e0e0e0;

          mat-icon {
            color: #999;
            font-size: 24px;
          }
        }

        .material-link {
          color: #1976d2;
          text-decoration: none;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;

          &:hover {
            text-decoration: underline;
          }

          &.deprecated-material {
            color: #666;
            opacity: 0.7;
          }

          .deprecated-badge {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            background-color: #ffebee;
            color: #c62828;
            padding: 0.125rem 0.375rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;

            .deprecated-icon {
              font-size: 0.875rem;
              width: 14px;
              height: 14px;
            }
          }
        }

        .stock-amount {
          font-weight: 600;
          color: #333;
        }

        .inventory-input {
          width: 100px;

          .mat-mdc-form-field-wrapper {
            padding-bottom: 0;
          }
        }

        .saved-row {
          background-color: #e8f5e8 !important;

          &:hover {
            background-color: #dcedc8 !important;
          }
        }

        tr.mat-mdc-row:hover {
          background-color: #f5f5f5;
        }
      }
    }

    @media (max-width: 768px) {
      .material-inventory-table {
        .full-width-table {
          font-size: 0.875rem;

          .material-image,
          .no-image {
            width: 40px;
            height: 40px;
          }

          .material-image {
            padding: 1px;
          }

          .inventory-input {
            width: 80px;
          }
        }
      }
    }
  `]
})
export class MaterialInventoryTableComponent {
  @Input() materialGroups: MaterialStockGroup[] = [];
  @Input() inventoryModeActive = false;
  @Input() inventoryCounts: { [materialId: number]: number } = {};
  @Input() savedMaterialIds: Set<number> = new Set();

  @Output() inventoryCountChanged = new EventEmitter<InventoryCountChangeEvent>();
  @Output() saveCorrectionRequested = new EventEmitter<SaveCorrectionEvent>();

  getDisplayedColumns(): string[] {
    if (this.inventoryModeActive) {
      return ['nr', 'bild', 'bezeichnung', 'bestand', 'inventurmenge', 'inventur-aktionen'];
    } else {
      return ['nr', 'bild', 'bezeichnung', 'bestand'];
    }
  }

  onInventoryCountChange(materialId: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    const count = parseInt(target.value, 10) || 0;
    this.inventoryCountChanged.emit({ materialId, count });
  }

  onSaveCorrection(materialId: number, materialName: string): void {
    if (!this.isMaterialSaved(materialId)) {
      this.saveCorrectionRequested.emit({ materialId, materialName });
    }
  }

  isMaterialSaved(materialId: number): boolean {
    return this.savedMaterialIds.has(materialId);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
    }
  }
}
