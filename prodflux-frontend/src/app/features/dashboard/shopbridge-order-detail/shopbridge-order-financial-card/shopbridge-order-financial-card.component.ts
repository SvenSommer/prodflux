import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WooCommerceOrderDetail } from '../../shopbridgeorder.service';

@Component({
  selector: 'app-shopbridge-order-financial-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatDividerModule, MatTooltipModule],
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

        <!-- PayPal Fee Section -->
        <div class="paypal-section" *ngIf="hasPayPalFee()">
          <div class="paypal-header">
            <img src="assets/paypal-logo.svg" alt="PayPal" class="paypal-logo" onerror="this.style.display='none'">
            <mat-icon *ngIf="!hasPayPalLogo">account_balance_wallet</mat-icon>
            <span>PayPal-Gebühren</span>
          </div>
          <div class="paypal-details">
            <div class="paypal-row">
              <span class="label">Bezahlt</span>
              <span class="value">{{ formatCurrency(order.total) }}</span>
            </div>
            <div class="paypal-row fee">
              <span class="label">
                <mat-icon>remove_circle_outline</mat-icon>
                PayPal-Gebühr
              </span>
              <span class="value">-{{ formatCurrency(getPayPalFee()) }}</span>
            </div>
            <div class="paypal-row payout">
              <span class="label">
                <mat-icon>account_balance</mat-icon>
                Auszahlung
              </span>
              <span class="value">{{ formatCurrency(getPayPalPayout()) }}</span>
            </div>
          </div>
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

    // PayPal Section
    .paypal-section {
      margin-top: 20px;
      padding: 16px;
      background: linear-gradient(135deg, #f0f4ff 0%, #e8ecf8 100%);
      border: 1px solid #c5cae9;
      border-radius: 8px;

      .paypal-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        font-weight: 600;
        font-size: 14px;
        color: #1565c0;

        .paypal-logo {
          height: 18px;
          width: auto;
        }

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: #1565c0;
        }
      }

      .paypal-details {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .paypal-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;

          .label {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #666;

            mat-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
            }
          }

          .value {
            font-weight: 500;
            color: #333;
          }

          &.fee {
            .label {
              color: #c62828;

              mat-icon {
                color: #c62828;
              }
            }

            .value {
              color: #c62828;
            }
          }

          &.payout {
            padding-top: 8px;
            margin-top: 4px;
            border-top: 1px dashed #c5cae9;

            .label {
              font-weight: 600;
              color: #1565c0;

              mat-icon {
                color: #1565c0;
              }
            }

            .value {
              font-weight: 700;
              font-size: 15px;
              color: #1565c0;
            }
          }
        }
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

  // PayPal Logo Fallback
  hasPayPalLogo = true;

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

  /**
   * Check if PayPal fee information is available in meta_data
   * PayPal typically stores fees under keys like:
   * - _paypal_fee
   * - PayPal Transaction Fee
   * - _ppcp_paypal_fees
   */
  hasPayPalFee(): boolean {
    if (!this.order.meta_data) return false;

    // Check if payment method is PayPal
    const isPayPal = this.order.payment_method?.toLowerCase().includes('paypal') ||
                     this.order.payment_method_title?.toLowerCase().includes('paypal');

    if (!isPayPal) return false;

    // Check for fee in meta_data
    const feeKeys = ['_paypal_fee', 'PayPal Transaction Fee', '_ppcp_paypal_fees', '_paypal_transaction_fee'];
    return this.order.meta_data.some(meta =>
      feeKeys.some(key => meta.key === key || meta.key.toLowerCase().includes('paypal') && meta.key.toLowerCase().includes('fee'))
    );
  }

  /**
   * Get PayPal fee from meta_data
   */
  getPayPalFee(): number {
    if (!this.order.meta_data) return 0;

    const feeKeys = ['_paypal_fee', 'PayPal Transaction Fee', '_ppcp_paypal_fees', '_paypal_transaction_fee'];

    for (const meta of this.order.meta_data) {
      // Check for exact key match
      if (feeKeys.includes(meta.key)) {
        const value = parseFloat(meta.value);
        if (!isNaN(value)) return Math.abs(value);
      }
      // Check for partial key match (paypal + fee)
      if (meta.key.toLowerCase().includes('paypal') && meta.key.toLowerCase().includes('fee')) {
        const value = parseFloat(meta.value);
        if (!isNaN(value)) return Math.abs(value);
      }
    }

    return 0;
  }

  /**
   * Calculate PayPal payout (total minus fees)
   */
  getPayPalPayout(): number {
    const total = parseFloat(this.order.total || '0');
    const fee = this.getPayPalFee();
    return total - fee;
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
