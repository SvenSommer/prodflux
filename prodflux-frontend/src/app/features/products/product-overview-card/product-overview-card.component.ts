import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface WorkshopStock {
  workshop_id: number;
  workshop_name: string;
  bestand: number;
}

export interface ProductStatistics {
  product_id: number;
  product_name: string;
  artikelnummer: string;
  statistics: {
    total_produced: number;
    total_stock: number;
    stock_by_workshop: WorkshopStock[];
  };
}

@Component({
  selector: 'app-product-overview-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTooltipModule],
  template: `
    <mat-card class="overview-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>insights</mat-icon>
          Übersicht
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="stats-grid">
          <!-- Produziert -->
          <div class="stat-item">
            <div class="stat-icon produced">
              <mat-icon>precision_manufacturing</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ formatNumber(statistics?.statistics?.total_produced || 0) }}</span>
              <span class="stat-label">Produziert</span>
            </div>
          </div>

          <!-- Verkauft -->
          <div class="stat-item">
            <div class="stat-icon sold">
              <mat-icon>shopping_cart</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ formatNumber(totalSold) }}</span>
              <span class="stat-label">Verkauft</span>
            </div>
          </div>

          <!-- Gesamtbestand -->
          <div class="stat-item">
            <div class="stat-icon stock">
              <mat-icon>inventory_2</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ formatNumber(statistics?.statistics?.total_stock || 0) }}</span>
              <span class="stat-label">Gesamtbestand</span>
            </div>
          </div>
        </div>

        <!-- Bestand pro Werkstatt -->
        <div class="workshop-stocks" *ngIf="statistics?.statistics?.stock_by_workshop?.length">
          <h4 class="section-title">
            <mat-icon>factory</mat-icon>
            Bestand pro Werkstatt
          </h4>
          <div class="workshop-list">
            <div class="workshop-item" *ngFor="let ws of statistics?.statistics?.stock_by_workshop">
              <span class="workshop-name">{{ ws.workshop_name }}</span>
              <span class="workshop-stock" [class.zero]="ws.bestand === 0">
                {{ formatNumber(ws.bestand) }}
              </span>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .overview-card {
      mat-card-header {
        margin-bottom: 16px;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 500;

          mat-icon {
            color: #1976d2;
          }
        }
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      flex-shrink: 0;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: white;
      }

      &.produced {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.sold {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      }

      &.stock {
        background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
      }
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #666;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #1976d2;
      }
    }

    .workshop-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .workshop-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #e0e0e0;

      .workshop-name {
        font-size: 14px;
        color: #333;
      }

      .workshop-stock {
        font-size: 16px;
        font-weight: 600;
        color: #2e7d32;
        padding: 4px 12px;
        background: #e8f5e9;
        border-radius: 16px;

        &.zero {
          color: #9e9e9e;
          background: #f5f5f5;
        }
      }
    }
  `]
})
export class ProductOverviewCardComponent {
  @Input() statistics?: ProductStatistics;
  @Input() totalSold: number = 0;

  formatNumber(value: number): string {
    return value.toLocaleString('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }
}
