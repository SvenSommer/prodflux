import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { DeliveriesService, Delivery } from '../../deliveries/deliveries.service';

export interface LinkDeliveryDialogData {
  orderId: number;
  orderNumber: string;
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
    MatDividerModule
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

      <div class="existing-deliveries" *ngIf="unlinkedDeliveries.length > 0">
        <h3>Bestehende Lieferungen ohne Bestellung:</h3>
        <mat-selection-list #deliveryList [multiple]="false">
          <mat-list-option
            *ngFor="let delivery of unlinkedDeliveries"
            [value]="delivery.id"
            (click)="selectDelivery(delivery.id)">
            <div class="delivery-item">
              <div class="delivery-info">
                <strong>Lieferung #{{ delivery.id }}</strong>
                <span class="delivery-date">{{ formatDate(delivery.created_at) }}</span>
              </div>
              <div class="delivery-note" *ngIf="delivery.note">
                {{ delivery.note }}
              </div>
              <div class="delivery-items">
                {{ delivery.items.length }} Material(ien)
              </div>
            </div>
          </mat-list-option>
        </mat-selection-list>
      </div>

      <div class="no-deliveries" *ngIf="unlinkedDeliveries.length === 0">
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
      h3 {
        margin: 0 0 16px 0;
        font-size: 14px;
        font-weight: 500;
        color: #666;
        text-transform: uppercase;
      }
    }

    .delivery-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 0;

      .delivery-info {
        display: flex;
        justify-content: space-between;
        align-items: center;

        strong {
          font-size: 16px;
        }

        .delivery-date {
          font-size: 14px;
          color: #999;
        }
      }

      .delivery-note {
        font-size: 14px;
        color: #666;
        font-style: italic;
      }

      .delivery-items {
        font-size: 12px;
        color: #999;
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

  unlinkedDeliveries: Delivery[] = [];
  selectedDeliveryId: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<LinkDeliveryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LinkDeliveryDialogData
  ) {}

  ngOnInit() {
    // Lade alle Lieferungen ohne Order-Verknüpfung
    this.deliveriesService.getAll().subscribe(deliveries => {
      this.unlinkedDeliveries = deliveries.filter(d => !d.order);
    });
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
