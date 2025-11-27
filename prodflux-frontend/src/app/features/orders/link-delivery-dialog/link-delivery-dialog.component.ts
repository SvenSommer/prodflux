import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { DeliveriesService, Delivery } from '../../deliveries/deliveries.service';

export interface LinkDeliveryDialogData {
  orderId: number;
  orderNumber: string;
  orderMaterialIds: number[];  // Material IDs from the order
}

export interface LinkDeliveryDialogResult {
  action: 'create' | 'link';
  deliveryId?: number;
}

@Component({
  selector: 'app-link-delivery-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatSlideToggleModule,
    FormsModule
  ],
  template: `
    <h2 mat-dialog-title>Lieferung verknüpfen</h2>
    <mat-dialog-content>
      <p class="dialog-description">
        Möchten Sie eine neue Lieferung erstellen oder eine bestehende Lieferung mit dieser Bestellung verknüpfen?
      </p>

      <div class="action-section">
        <button
          mat-raised-button
          color="primary"
          (click)="createNewDelivery()"
          class="full-width-button">
          <mat-icon>add</mat-icon>
          Neue Lieferung erstellen
        </button>
      </div>

      <mat-divider class="section-divider"></mat-divider>

      <div class="existing-deliveries" *ngIf="allUnlinkedDeliveries.length > 0">
        <div class="filter-header">
          <h3>Unverknüpfte Lieferungen ({{ filteredDeliveries.length }}<span *ngIf="filterByMaterials"> von {{ allUnlinkedDeliveries.length }}</span>):</h3>
          <mat-slide-toggle
            [(ngModel)]="filterByMaterials"
            (change)="applyFilter()"
            color="primary">
            Nur passende Materialien
          </mat-slide-toggle>
        </div>
        <div class="deliveries-list" *ngIf="filteredDeliveries.length > 0">
          <div
            *ngFor="let delivery of filteredDeliveries"
            class="delivery-card"
            [class.selected]="selectedDeliveryId === delivery.id"
            (click)="selectDelivery(delivery.id)">
            <div class="delivery-header">
              <div class="delivery-id">
                <mat-icon>local_shipping</mat-icon>
                <strong>Lieferung #{{ delivery.id }}</strong>
              </div>
              <span class="delivery-date">{{ formatDate(delivery.created_at) }}</span>
            </div>
            <div class="delivery-note" *ngIf="delivery.note">
              <mat-icon>note</mat-icon>
              {{ delivery.note }}
            </div>
            <div class="delivery-items">
              <mat-icon>inventory_2</mat-icon>
              {{ delivery.items.length }} Material(ien)
              <span class="matching-badge" *ngIf="getMatchingMaterialsCount(delivery) > 0">
                ({{ getMatchingMaterialsCount(delivery) }} passend)
              </span>
            </div>
            <mat-icon class="check-icon" *ngIf="selectedDeliveryId === delivery.id">check_circle</mat-icon>
          </div>
        </div>
        <div class="no-matching" *ngIf="filteredDeliveries.length === 0">
          <mat-icon>filter_alt_off</mat-icon>
          <p>Keine Lieferungen mit passenden Materialien gefunden</p>
          <button mat-stroked-button color="primary" (click)="filterByMaterials = false; applyFilter()">
            Filter deaktivieren
          </button>
        </div>
      </div>

      <div class="no-deliveries" *ngIf="allUnlinkedDeliveries.length === 0">
        <mat-icon>inbox</mat-icon>
        <p>Keine unverknüpften Lieferungen vorhanden</p>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Abbrechen</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!selectedDeliveryId"
        (click)="linkDelivery()">
        Verknüpfen
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-description {
      margin-bottom: 24px;
      color: #666;
    }

    .action-section {
      margin-bottom: 24px;
    }

    .full-width-button {
      width: 100%;
      height: 48px;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .section-divider {
      margin: 24px 0;
    }

    .existing-deliveries {
      .filter-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        gap: 16px;

        h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          text-transform: uppercase;

          span {
            color: #999;
          }
        }

        mat-slide-toggle {
          font-size: 13px;
        }
      }

      .deliveries-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: 350px;
        overflow-y: auto;
      }

      .delivery-card {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px;
        background-color: #f8f9fa;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background-color: #e3f2fd;
          border-color: #1976d2;
        }

        &.selected {
          background-color: #e3f2fd;
          border-color: #1976d2;
          box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
        }

        .delivery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .delivery-id {
            display: flex;
            align-items: center;
            gap: 8px;

            mat-icon {
              color: #1976d2;
              font-size: 20px;
              width: 20px;
              height: 20px;
            }

            strong {
              font-size: 16px;
              color: #333;
            }
          }

          .delivery-date {
            font-size: 13px;
            color: #666;
          }
        }

        .delivery-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 14px;
          color: #666;
          font-style: italic;
          padding-left: 4px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            color: #999;
            flex-shrink: 0;
            margin-top: 2px;
          }
        }

        .delivery-items {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #666;
          padding-left: 4px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            color: #999;
          }

          .matching-badge {
            color: #2e7d32;
            font-weight: 500;
          }
        }

        .check-icon {
          position: absolute;
          top: 16px;
          right: 16px;
          color: #1976d2;
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }

      .no-matching {
        text-align: center;
        padding: 24px 16px;
        background-color: #fff3e0;
        border-radius: 8px;
        border: 1px solid #ffcc80;

        mat-icon {
          font-size: 40px;
          width: 40px;
          height: 40px;
          color: #ff9800;
          margin-bottom: 12px;
        }

        p {
          margin: 0 0 16px 0;
          font-size: 14px;
          color: #666;
        }
      }
    }

    .no-deliveries {
      text-align: center;
      padding: 32px 16px;
      color: #999;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }

    mat-dialog-content {
      min-width: 500px;
      max-height: 600px;
    }
  `]
})
export class LinkDeliveryDialogComponent implements OnInit {
  private deliveriesService = inject(DeliveriesService);

  allUnlinkedDeliveries: Delivery[] = [];
  filteredDeliveries: Delivery[] = [];
  selectedDeliveryId: number | null = null;
  filterByMaterials = true;  // Default: nur passende Materialien anzeigen

  constructor(
    public dialogRef: MatDialogRef<LinkDeliveryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LinkDeliveryDialogData
  ) {}

  ngOnInit() {
    // Lade alle Lieferungen ohne Order-Verknüpfung
    this.deliveriesService.getAll().subscribe(deliveries => {
      this.allUnlinkedDeliveries = deliveries.filter(d => !d.order);
      this.applyFilter();
    });
  }

  applyFilter() {
    if (this.filterByMaterials && this.data.orderMaterialIds?.length > 0) {
      // Filtere Lieferungen, die nur Materialien aus der Bestellung enthalten
      this.filteredDeliveries = this.allUnlinkedDeliveries.filter(delivery => {
        // Alle Materialien der Lieferung müssen in der Bestellung sein
        return delivery.items.every(item => 
          this.data.orderMaterialIds.includes(item.material)
        );
      });
    } else {
      this.filteredDeliveries = [...this.allUnlinkedDeliveries];
    }
    
    // Wenn die ausgewählte Lieferung nicht mehr in der gefilterten Liste ist, deselektieren
    if (this.selectedDeliveryId && !this.filteredDeliveries.find(d => d.id === this.selectedDeliveryId)) {
      this.selectedDeliveryId = null;
    }
  }

  getMatchingMaterialsCount(delivery: Delivery): number {
    if (!this.data.orderMaterialIds?.length) return 0;
    return delivery.items.filter(item => 
      this.data.orderMaterialIds.includes(item.material)
    ).length;
  }

  createNewDelivery() {
    this.dialogRef.close({ action: 'create' } as LinkDeliveryDialogResult);
  }

  selectDelivery(deliveryId: number) {
    this.selectedDeliveryId = deliveryId;
  }

  linkDelivery() {
    if (this.selectedDeliveryId) {
      this.dialogRef.close({
        action: 'link',
        deliveryId: this.selectedDeliveryId
      } as LinkDeliveryDialogResult);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
