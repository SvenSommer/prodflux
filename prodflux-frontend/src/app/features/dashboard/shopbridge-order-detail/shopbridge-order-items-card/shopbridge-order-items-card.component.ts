import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WooCommerceLineItem } from '../../shopbridgeorder.service';

@Component({
  selector: 'app-shopbridge-order-items-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule, MatTooltipModule],
  template: `
    <mat-card class="items-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>shopping_cart</mat-icon>
          Bestellpositionen
          <span class="items-count">{{ lineItems.length }} {{ lineItems.length === 1 ? 'Artikel' : 'Artikel' }}</span>
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="items-table-wrapper">
          <table mat-table [dataSource]="lineItems" class="items-table">
            <!-- Quantity Column -->
            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef>Menge</th>
              <td mat-cell *matCellDef="let item">
                <span class="quantity-badge">{{ item.quantity }}x</span>
              </td>
            </ng-container>

            <!-- Product Column -->
            <ng-container matColumnDef="product">
              <th mat-header-cell *matHeaderCellDef>Produkt</th>
              <td mat-cell *matCellDef="let item">
                <div class="product-info">
                  <span class="product-name">{{ item.name }}</span>
                  <span class="product-sku" *ngIf="item.sku">SKU: {{ item.sku }}</span>
                  <div class="product-meta" *ngIf="hasVariationMeta(item)">
                    <span *ngFor="let meta of getVariationMeta(item)" class="meta-tag">
                      {{ formatMetaKey(meta.key) }}: {{ meta.value }}
                    </span>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Unit Price Column -->
            <ng-container matColumnDef="unitPrice">
              <th mat-header-cell *matHeaderCellDef>Einzelpreis</th>
              <td mat-cell *matCellDef="let item">
                <span class="price">{{ formatCurrency(item.price) }}</span>
              </td>
            </ng-container>

            <!-- Subtotal Column -->
            <ng-container matColumnDef="subtotal">
              <th mat-header-cell *matHeaderCellDef>Zwischensumme</th>
              <td mat-cell *matCellDef="let item">
                <span class="price">{{ formatCurrency(item.subtotal) }}</span>
              </td>
            </ng-container>

            <!-- Tax Column -->
            <ng-container matColumnDef="tax">
              <th mat-header-cell *matHeaderCellDef>Steuer</th>
              <td mat-cell *matCellDef="let item">
                <span class="price tax" *ngIf="parseFloat(item.total_tax) > 0">
                  +{{ formatCurrency(item.total_tax) }}
                </span>
                <span class="price muted" *ngIf="parseFloat(item.total_tax) === 0">—</span>
              </td>
            </ng-container>

            <!-- Total Column -->
            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef>Gesamt</th>
              <td mat-cell *matCellDef="let item">
                <span class="price total">{{ formatCurrency(item.total) }}</span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>

        <!-- Items Summary Cards for Mobile -->
        <div class="items-cards-mobile">
          <div class="item-card" *ngFor="let item of lineItems">
            <div class="item-header">
              <span class="quantity-badge">{{ item.quantity }}x</span>
              <span class="product-name">{{ item.name }}</span>
            </div>
            <div class="item-details">
              <span class="product-sku" *ngIf="item.sku">SKU: {{ item.sku }}</span>
              <div class="product-meta" *ngIf="hasVariationMeta(item)">
                <span *ngFor="let meta of getVariationMeta(item)" class="meta-tag">
                  {{ formatMetaKey(meta.key) }}: {{ meta.value }}
                </span>
              </div>
            </div>
            <div class="item-prices">
              <div class="price-row">
                <span class="label">Einzelpreis:</span>
                <span class="price">{{ formatCurrency(item.price) }}</span>
              </div>
              <div class="price-row" *ngIf="parseFloat(item.total_tax) > 0">
                <span class="label">Steuer:</span>
                <span class="price tax">+{{ formatCurrency(item.total_tax) }}</span>
              </div>
              <div class="price-row total">
                <span class="label">Gesamt:</span>
                <span class="price">{{ formatCurrency(item.total) }}</span>
              </div>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .items-card {
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

          .items-count {
            margin-left: auto;
            font-size: 13px;
            font-weight: 400;
            color: #666;
            background: #f5f5f5;
            padding: 4px 12px;
            border-radius: 12px;
          }
        }
      }
    }

    .items-table-wrapper {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid #e0e0e0;

      @media (max-width: 768px) {
        display: none;
      }
    }

    .items-table {
      width: 100%;

      th {
        background: #f5f5f5;
        font-size: 11px;
        font-weight: 600;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 12px 16px;
      }

      td {
        padding: 16px;
        vertical-align: top;
        border-bottom: 1px solid #f0f0f0;
      }

      tr:last-child td {
        border-bottom: none;
      }

      tr:hover {
        background-color: #fafafa;
      }
    }

    .quantity-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      height: 28px;
      background: linear-gradient(135deg, #1976d2, #1565c0);
      color: white;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
    }

    .product-info {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .product-name {
        font-size: 14px;
        font-weight: 500;
        color: #333;
        line-height: 1.4;
      }

      .product-sku {
        font-size: 11px;
        color: #999;
        font-family: 'Roboto Mono', monospace;
      }

      .product-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 4px;

        .meta-tag {
          font-size: 11px;
          background: #e3f2fd;
          color: #1565c0;
          padding: 2px 8px;
          border-radius: 4px;
        }
      }
    }

    .price {
      font-size: 14px;
      color: #333;
      font-weight: 500;

      &.tax {
        color: #666;
        font-size: 12px;
      }

      &.muted {
        color: #ccc;
      }

      &.total {
        font-weight: 600;
        color: #1976d2;
      }
    }

    // Mobile Cards
    .items-cards-mobile {
      display: none;

      @media (max-width: 768px) {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
    }

    .item-card {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;

      .item-header {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 8px;

        .product-name {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          line-height: 1.4;
        }
      }

      .item-details {
        margin-bottom: 12px;
        padding-left: 48px;

        .product-sku {
          font-size: 11px;
          color: #999;
        }

        .product-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;

          .meta-tag {
            font-size: 11px;
            background: #e3f2fd;
            color: #1565c0;
            padding: 2px 8px;
            border-radius: 4px;
          }
        }
      }

      .item-prices {
        background: white;
        border-radius: 6px;
        padding: 12px;
        margin-top: 8px;

        .price-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 13px;

          .label {
            color: #666;
          }

          &.total {
            border-top: 1px solid #e0e0e0;
            margin-top: 8px;
            padding-top: 8px;

            .label, .price {
              font-weight: 600;
              color: #333;
            }

            .price {
              color: #1976d2;
            }
          }
        }
      }
    }
  `]
})
export class ShopbridgeOrderItemsCardComponent {
  @Input() lineItems: WooCommerceLineItem[] = [];

  displayedColumns = ['quantity', 'product', 'unitPrice', 'subtotal', 'tax', 'total'];

  hasVariationMeta(item: WooCommerceLineItem): boolean {
    return item.meta_data?.some(m => !m.key.startsWith('_'));
  }

  getVariationMeta(item: WooCommerceLineItem): { key: string; value: string }[] {
    return item.meta_data?.filter(m => !m.key.startsWith('_')) || [];
  }

  formatMetaKey(key: string): string {
    // Convert pa_color -> Color, size -> Size, etc.
    return key.replace('pa_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatCurrency(value: any): string {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '—';
    return num.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' €';
  }

  parseFloat(value: string): number {
    return parseFloat(value) || 0;
  }
}
