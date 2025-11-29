import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface ProductSale {
  order_id: number;
  status: string;
  quantity: number;
  total: string;
  currency: string;
  customer_name: string;
  customer_country: string;
  customer_city: string;
  date_created: string;
  wc_product_name: string;
  wc_sku: string;
  match_type: string | null;
}

@Component({
  selector: 'app-product-sales-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <mat-card class="sales-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>point_of_sale</mat-icon>
          Verkäufe (WooCommerce)
        </mat-card-title>
        <div class="sales-summary" *ngIf="sales.length > 0">
          <span class="summary-badge">
            <mat-icon>shopping_cart</mat-icon>
            {{ getTotalQuantity() }} Stück in {{ sales.length }} Bestellungen
          </span>
        </div>
      </mat-card-header>
      <mat-card-content>
        <div *ngIf="sales.length > 0; else noSales">
          <table mat-table [dataSource]="sales" class="sales-table">
            <!-- Order ID -->
            <ng-container matColumnDef="order_id">
              <th mat-header-cell *matHeaderCellDef>Bestellung</th>
              <td mat-cell *matCellDef="let sale">
                <a 
                  [href]="getOrderUrl(sale.order_id)" 
                  target="_blank" 
                  class="order-link"
                  matTooltip="In WooCommerce öffnen">
                  #{{ sale.order_id }}
                  <mat-icon>open_in_new</mat-icon>
                </a>
              </td>
            </ng-container>

            <!-- Date -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Datum</th>
              <td mat-cell *matCellDef="let sale">{{ formatDate(sale.date_created) }}</td>
            </ng-container>

            <!-- Customer -->
            <ng-container matColumnDef="customer">
              <th mat-header-cell *matHeaderCellDef>Kunde</th>
              <td mat-cell *matCellDef="let sale">
                <div class="customer-info">
                  <span class="customer-name">{{ sale.customer_name || 'Unbekannt' }}</span>
                  <span class="customer-location" *ngIf="sale.customer_city || sale.customer_country">
                    {{ sale.customer_city }}<span *ngIf="sale.customer_city && sale.customer_country">, </span>{{ sale.customer_country }}
                  </span>
                </div>
              </td>
            </ng-container>

            <!-- Quantity -->
            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef class="text-center">Menge</th>
              <td mat-cell *matCellDef="let sale" class="text-center">
                <span class="quantity-badge">{{ sale.quantity }}</span>
              </td>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let sale">
                <mat-chip [class]="'status-chip status-' + sale.status">
                  {{ getStatusLabel(sale.status) }}
                </mat-chip>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>

        <ng-template #noSales>
          <div class="no-sales">
            <mat-icon>shopping_cart_off</mat-icon>
            <h4>Keine Verkäufe gefunden</h4>
            <p>Dieses Produkt wurde noch nicht über WooCommerce verkauft.</p>
          </div>
        </ng-template>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .sales-card {
      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        flex-wrap: wrap;
        gap: 12px;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 500;
          margin: 0;

          mat-icon {
            color: #1976d2;
          }
        }
      }
    }

    .sales-summary {
      .summary-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: #e8f5e9;
        color: #2e7d32;
        border-radius: 16px;
        font-size: 13px;
        font-weight: 500;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    .sales-table {
      width: 100%;

      th {
        background: #f5f5f5;
        font-weight: 600;
        font-size: 12px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      td {
        padding: 12px 16px;
        vertical-align: middle;
      }

      .text-center {
        text-align: center;
      }
    }

    .order-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        opacity: 0.7;
      }

      &:hover {
        text-decoration: underline;
        
        mat-icon {
          opacity: 1;
        }
      }
    }

    .customer-info {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .customer-name {
        font-size: 14px;
        color: #333;
      }

      .customer-location {
        font-size: 12px;
        color: #666;
      }
    }

    .quantity-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #e3f2fd;
      color: #1976d2;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
    }

    .status-chip {
      font-size: 11px;
      min-height: 24px;
      padding: 0 10px;

      &.status-processing {
        background-color: #fff3e0 !important;
        color: #e65100 !important;
      }

      &.status-completed {
        background-color: #e8f5e9 !important;
        color: #2e7d32 !important;
      }

      &.status-pending {
        background-color: #fff8e1 !important;
        color: #f9a825 !important;
      }

      &.status-on-hold {
        background-color: #fce4ec !important;
        color: #c2185b !important;
      }

      &.status-cancelled,
      &.status-refunded,
      &.status-failed {
        background-color: #ffebee !important;
        color: #c62828 !important;
      }
    }

    .no-sales {
      text-align: center;
      padding: 40px 20px;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #ccc;
        margin-bottom: 16px;
      }

      h4 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 500;
        color: #333;
      }

      p {
        margin: 0;
        font-size: 14px;
        color: #666;
      }
    }
  `]
})
export class ProductSalesCardComponent {
  @Input() sales: ProductSale[] = [];
  @Input() woocommerceBaseUrl: string = '';

  displayedColumns = ['order_id', 'date', 'customer', 'quantity', 'status'];

  getTotalQuantity(): number {
    return this.sales.reduce((sum, sale) => sum + sale.quantity, 0);
  }

  getOrderUrl(orderId: number): string {
    // WooCommerce Admin URL pattern
    if (this.woocommerceBaseUrl) {
      return `${this.woocommerceBaseUrl}/wp-admin/post.php?post=${orderId}&action=edit`;
    }
    return '#';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'processing': 'In Bearbeitung',
      'completed': 'Abgeschlossen',
      'pending': 'Ausstehend',
      'on-hold': 'Wartend',
      'cancelled': 'Storniert',
      'refunded': 'Erstattet',
      'failed': 'Fehlgeschlagen'
    };
    return labels[status] || status;
  }
}
