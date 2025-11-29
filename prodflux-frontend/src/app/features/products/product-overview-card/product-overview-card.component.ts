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
          <div class="stat-item" [matTooltip]="getSalesBreakdown()">
            <div class="stat-icon sold">
              <mat-icon>shopping_cart</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ formatNumber(totalSold) }}</span>
              <span class="stat-label">Verkauft</span>
              <span class="stat-breakdown" *ngIf="activeSalesCount > 0 || completedSalesCount > 0">
                <span class="active-count" *ngIf="activeSalesCount > 0">{{ activeSalesCount }} offen</span>
                <span *ngIf="activeSalesCount > 0 && completedSalesCount > 0"> · </span>
                <span class="completed-count" *ngIf="completedSalesCount > 0">{{ completedSalesCount }} abgeschl.</span>
              </span>
            </div>
          </div>

          <!-- Gesamtbestand mit Werkstatt-Breakdown -->
          <div class="stat-item stock-item">
            <div class="stat-icon stock">
              <mat-icon>inventory_2</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ formatNumber(statistics?.statistics?.total_stock || 0) }}</span>
              <span class="stat-label">Gesamtbestand</span>
              <div class="workshop-breakdown" *ngIf="statistics?.statistics?.stock_by_workshop?.length">
                <span class="workshop-stock-inline" 
                      *ngFor="let ws of statistics?.statistics?.stock_by_workshop"
                      [class.zero]="ws.bestand === 0">
                  {{ ws.workshop_name }}: {{ formatNumber(ws.bestand) }}
                </span>
              </div>
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

    .stat-breakdown {
      font-size: 11px;
      color: #888;
      margin-top: 2px;

      .active-count {
        color: #e65100;
      }

      .completed-count {
        color: #2e7d32;
      }
    }

    .workshop-breakdown {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;

      .workshop-stock-inline {
        font-size: 11px;
        padding: 2px 8px;
        background: #e8f5e9;
        color: #2e7d32;
        border-radius: 10px;
        white-space: nowrap;

        &.zero {
          background: #f5f5f5;
          color: #9e9e9e;
        }
      }
    }

    .stock-item {
      .stat-content {
        min-width: 0;
      }
    }
  `]
})
export class ProductOverviewCardComponent {
  @Input() statistics?: ProductStatistics;
  @Input() totalSold: number = 0;
  @Input() activeSalesCount: number = 0;
  @Input() completedSalesCount: number = 0;

  formatNumber(value: number): string {
    return value.toLocaleString('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  getSalesBreakdown(): string {
    const parts: string[] = [];
    if (this.activeSalesCount > 0) {
      parts.push(`${this.activeSalesCount} offene Bestellungen`);
    }
    if (this.completedSalesCount > 0) {
      parts.push(`${this.completedSalesCount} abgeschlossene Bestellungen`);
    }
    return parts.length > 0 ? parts.join(', ') : 'Keine Verkäufe';
  }
}
