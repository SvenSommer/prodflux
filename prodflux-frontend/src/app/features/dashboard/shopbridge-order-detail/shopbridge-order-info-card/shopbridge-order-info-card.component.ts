import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { WooCommerceOrderDetail, ORDER_STATUS_MAP } from '../../shopbridgeorder.service';

@Component({
  selector: 'app-shopbridge-order-info-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatChipsModule],
  template: `
    <mat-card class="info-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>info</mat-icon>
          Bestellinformationen
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <!-- Status Badge -->
        <div class="status-badge" [style.background-color]="getStatusColor() + '20'" [style.border-color]="getStatusColor()">
          <mat-icon [style.color]="getStatusColor()">{{ getStatusIcon() }}</mat-icon>
          <span [style.color]="getStatusColor()">{{ getStatusLabel() }}</span>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="label">Bestellnummer</span>
            <span class="value highlight">#{{ order.number }}</span>
          </div>
          <div class="info-item">
            <span class="label">Erstellt am</span>
            <span class="value">{{ formatDateTime(order.date_created) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Zuletzt geändert</span>
            <span class="value">{{ formatDateTime(order.date_modified) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Erstellt über</span>
            <span class="value">{{ order.created_via | titlecase }}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="info-grid">
          <div class="info-item">
            <span class="label">Zahlungsmethode</span>
            <span class="value">
              <mat-icon class="inline-icon">payment</mat-icon>
              {{ order.payment_method_title || '—' }}
            </span>
          </div>
          <div class="info-item" *ngIf="order.date_paid">
            <span class="label">Bezahlt am</span>
            <span class="value success">
              <mat-icon class="inline-icon">check_circle</mat-icon>
              {{ formatDateTime(order.date_paid) }}
            </span>
          </div>
          <div class="info-item" *ngIf="!order.date_paid">
            <span class="label">Bezahlt am</span>
            <span class="value warning">
              <mat-icon class="inline-icon">schedule</mat-icon>
              Noch nicht bezahlt
            </span>
          </div>
          <div class="info-item" *ngIf="order.transaction_id">
            <span class="label">Transaktions-ID</span>
            <span class="value mono">{{ order.transaction_id }}</span>
          </div>
        </div>

        <div class="divider" *ngIf="order.customer_note"></div>

        <div class="customer-note" *ngIf="order.customer_note">
          <div class="note-header">
            <mat-icon>note</mat-icon>
            <span>Kundennotiz</span>
          </div>
          <p class="note-content">{{ order.customer_note }}</p>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .info-card {
      mat-card-header {
        margin-bottom: 20px;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 500;
          color: #333;

          mat-icon {
            color: #1976d2;
          }
        }
      }
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 24px;
      border: 2px solid;
      margin-bottom: 20px;
      font-weight: 600;
      font-size: 14px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .label {
        font-size: 12px;
        font-weight: 600;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .value {
        font-size: 14px;
        color: #333;
        display: flex;
        align-items: center;
        gap: 6px;

        &.highlight {
          font-size: 16px;
          font-weight: 600;
          color: #1976d2;
        }

        &.success {
          color: #2e7d32;
        }

        &.warning {
          color: #ff9800;
        }

        &.mono {
          font-family: 'Roboto Mono', monospace;
          font-size: 13px;
          background: #f5f5f5;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .inline-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    .divider {
      height: 1px;
      background: linear-gradient(to right, #e0e0e0, transparent);
      margin: 20px 0;
    }

    .customer-note {
      background: #fff8e1;
      border: 1px solid #ffcc80;
      border-radius: 8px;
      padding: 16px;

      .note-header {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #e65100;
        font-weight: 600;
        margin-bottom: 8px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      .note-content {
        margin: 0;
        color: #5d4037;
        font-size: 14px;
        line-height: 1.5;
        font-style: italic;
      }
    }
  `]
})
export class ShopbridgeOrderInfoCardComponent {
  @Input() order!: WooCommerceOrderDetail;

  getStatusLabel(): string {
    return ORDER_STATUS_MAP[this.order.status]?.label || this.order.status;
  }

  getStatusColor(): string {
    return ORDER_STATUS_MAP[this.order.status]?.color || '#666';
  }

  getStatusIcon(): string {
    return ORDER_STATUS_MAP[this.order.status]?.icon || 'help';
  }

  formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
