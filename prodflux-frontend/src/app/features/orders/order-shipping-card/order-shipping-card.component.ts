import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Order } from '../orders.service';

@Component({
  selector: 'app-order-costs-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatDividerModule],
  template: `
    <mat-card class="costs-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>receipt_long</mat-icon>
          Kosten
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <!-- Header Row -->
        <div class="cost-header">
          <span class="label-column"></span>
          <span class="value-column">Netto</span>
          <span class="value-column">MwSt.</span>
          <span class="value-column">Brutto</span>
        </div>

        <!-- Materialkosten -->
        <div class="cost-row">
          <span class="label-column">Summe der Materialien</span>
          <span class="value-column">{{ formatCurrency(materialsNetto) }}</span>
          <span class="value-column">{{ formatCurrency(materialsMwst) }}</span>
          <span class="value-column">{{ formatCurrency(materialsBrutto) }}</span>
        </div>

        <!-- Versandkosten -->
        <div class="cost-row">
          <span class="label-column">Versandkosten</span>
          <span class="value-column">{{ formatCurrency(order.versandkosten) }}</span>
          <span class="value-column">{{ formatCurrency(shippingMwst) }}</span>
          <span class="value-column">{{ formatCurrency(shippingBrutto) }}</span>
        </div>

        <mat-divider class="total-divider"></mat-divider>

        <!-- Gesamtkosten -->
        <div class="cost-row total-row">
          <span class="label-column">Gesamtkosten</span>
          <span class="value-column">{{ formatCurrency(totalNetto) }}</span>
          <span class="value-column">{{ formatCurrency(totalMwst) }}</span>
          <span class="value-column">{{ formatCurrency(totalBrutto) }}</span>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .costs-card {
      height: 100%;
    }

    mat-card-header {
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 500;
      color: #333;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #1976d2;
      }
    }

    mat-card-content {
      padding: 16px;
    }

    .cost-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 12px;
      padding: 8px 0;
      margin-bottom: 8px;
      font-weight: 600;
      font-size: 13px;
      color: #666;
      text-transform: uppercase;
      border-bottom: 2px solid #e0e0e0;
    }

    .cost-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 12px;
      padding: 10px 0;
      font-size: 14px;
      border-bottom: 1px solid #f0f0f0;
    }

    .label-column {
      color: #333;
    }

    .value-column {
      text-align: right;
      color: #666;
      font-variant-numeric: tabular-nums;
    }

    .total-divider {
      margin: 16px 0;
      border-top-width: 2px;
    }

    .total-row {
      font-weight: 600;
      font-size: 16px;
      border-bottom: none;

      .label-column {
        color: #1976d2;
      }

      .value-column {
        color: #1976d2;
      }
    }
  `]
})
export class OrderCostsCardComponent {
  @Input() order!: Order;

  // Materialkosten berechnet
  get materialsNetto(): number {
    if (!this.order?.items) return 0;
    return this.order.items.reduce((sum, item) => {
      return sum + (item.preis_pro_stueck * item.quantity);
    }, 0);
  }

  get materialsMwst(): number {
    if (!this.order?.items) return 0;
    return this.order.items.reduce((sum, item) => {
      const netto = item.preis_pro_stueck * item.quantity;
      const mwstSatz = item.mwst_satz ?? 19;
      return sum + (netto * (mwstSatz / 100));
    }, 0);
  }

  get materialsBrutto(): number {
    return this.materialsNetto + this.materialsMwst;
  }

  // Versandkosten berechnet
  get shippingNetto(): number {
    return this.order?.versandkosten ?? 0;
  }

  get shippingMwst(): number {
    const netto = this.shippingNetto;
    const mwstSatz = this.order?.versandkosten_mwst_satz ?? 19;
    return netto * (mwstSatz / 100);
  }

  get shippingBrutto(): number {
    return this.shippingNetto + this.shippingMwst;
  }

  // Gesamtkosten
  get totalNetto(): number {
    return this.materialsNetto + this.shippingNetto;
  }

  get totalMwst(): number {
    return this.materialsMwst + this.shippingMwst;
  }

  get totalBrutto(): number {
    return this.materialsBrutto + this.shippingBrutto;
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
