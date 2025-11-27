import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { WooCommerceOrderDetail } from '../../shopbridgeorder.service';

@Component({
  selector: 'app-shopbridge-order-financial-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatDividerModule],
  template: `
    <mat-card class="financial-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>payments</mat-icon>
          Finanzen
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <!-- Main Financial Summary -->
        <div class="financial-rows">
          <div class="financial-row">
            <span class="label">Zwischensumme</span>
            <span class="value">{{ formatCurrency(getSubtotal()) }}</span>
          </div>

          <div class="financial-row" *ngIf="hasDiscount()">
            <span class="label discount">
              <mat-icon>local_offer</mat-icon>
              Rabatt
            </span>
            <span class="value discount">-{{ formatCurrency(order.discount_total) }}</span>
          </div>

          <div class="financial-row" *ngIf="hasShipping()">
            <span class="label">
              <mat-icon>local_shipping</mat-icon>
              Versand
              <span class="shipping-method" *ngIf="getShippingMethod()">
                ({{ getShippingMethod() }})
              </span>
            </span>
            <span class="value">{{ formatCurrency(order.shipping_total) }}</span>
          </div>

          <div class="financial-row" *ngIf="hasTax()">
            <span class="label">
              <mat-icon>receipt_long</mat-icon>
              Steuern
            </span>
            <span class="value">{{ formatCurrency(order.total_tax) }}</span>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Total -->
        <div class="total-row">
          <span class="total-label">Gesamtbetrag</span>
          <span class="total-value">{{ formatCurrency(order.total) }} {{ order.currency }}</span>
        </div>

        <!-- Payment Status -->
        <div class="payment-status" [class.paid]="order.date_paid" [class.unpaid]="!order.date_paid">
          <mat-icon>{{ order.date_paid ? 'check_circle' : 'pending' }}</mat-icon>
          <span>{{ order.date_paid ? 'Bezahlt' : 'Zahlung ausstehend' }}</span>
        </div>

        <!-- Refunds Section -->
        <div class="refunds-section" *ngIf="order.refunds && order.refunds.length > 0">
          <div class="refunds-header">
            <mat-icon>replay</mat-icon>
            <span>Erstattungen</span>
          </div>
          <div class="refund-item" *ngFor="let refund of order.refunds">
            <span class="refund-id">#{{ refund.id }}</span>
            <span class="refund-reason" *ngIf="refund.reason">{{ refund.reason }}</span>
            <span class="refund-amount">{{ formatCurrency(refund.total) }}</span>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .financial-card {
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

    .financial-rows {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .financial-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #666;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: #999;
        }

        .shipping-method {
          font-size: 12px;
          color: #999;
        }

        &.discount {
          color: #2e7d32;

          mat-icon {
            color: #2e7d32;
          }
        }
      }

      .value {
        font-size: 14px;
        font-weight: 500;
        color: #333;

        &.discount {
          color: #2e7d32;
        }
      }
    }

    .divider {
      height: 2px;
      background: linear-gradient(to right, #1976d2, #e0e0e0);
      margin: 20px 0;
      border-radius: 1px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #f5f5f5, #eeeeee);
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;

      .total-label {
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }

      .total-value {
        font-size: 24px;
        font-weight: 700;
        color: #1976d2;
        letter-spacing: -0.5px;
      }
    }

    .payment-status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &.paid {
        background: #e8f5e9;
        color: #2e7d32;
        border: 1px solid #a5d6a7;
      }

      &.unpaid {
        background: #fff3e0;
        color: #e65100;
        border: 1px solid #ffcc80;
      }
    }

    .refunds-section {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;

      .refunds-header {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #c62828;
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 12px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      .refund-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        background: #ffebee;
        border-radius: 6px;
        margin-bottom: 8px;
        font-size: 13px;

        .refund-id {
          font-family: 'Roboto Mono', monospace;
          color: #c62828;
          font-weight: 600;
        }

        .refund-reason {
          flex: 1;
          color: #666;
          font-style: italic;
        }

        .refund-amount {
          font-weight: 600;
          color: #c62828;
        }
      }
    }
  `]
})
export class ShopbridgeOrderFinancialCardComponent {
  @Input() order!: WooCommerceOrderDetail;

  getSubtotal(): number {
    return this.order.line_items.reduce((sum, item) => {
      return sum + parseFloat(item.subtotal || '0');
    }, 0);
  }

  hasDiscount(): boolean {
    return parseFloat(this.order.discount_total || '0') > 0;
  }

  hasShipping(): boolean {
    return parseFloat(this.order.shipping_total || '0') > 0;
  }

  hasTax(): boolean {
    return parseFloat(this.order.total_tax || '0') > 0;
  }

  getShippingMethod(): string | null {
    if (this.order.shipping_lines && this.order.shipping_lines.length > 0) {
      return this.order.shipping_lines[0].method_title;
    }
    return null;
  }

  formatCurrency(value: any): string {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '—';
    return num.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' €';
  }
}
