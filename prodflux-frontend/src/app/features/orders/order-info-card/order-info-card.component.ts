import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Order } from '../orders.service';
import { Supplier } from '../../settings/models/supplier.model';

@Component({
  selector: 'app-order-info-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, RouterLink],
  template: `
    <mat-card class="info-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>info</mat-icon>
          Bestellinformationen
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Bestellnummer:</span>
            <span class="value">{{ order.order_number }}</span>
          </div>
          <div class="info-item">
            <span class="label">Bestellt am:</span>
            <span class="value">{{ formatDate(order.bestellt_am) }}</span>
          </div>
          <div class="info-item" *ngIf="supplier">
            <span class="label">Lieferant:</span>
            <a [routerLink]="['/suppliers', order.supplier]" class="supplier-link">
              <mat-icon>business</mat-icon>
              {{ supplier.name }}
            </a>
          </div>
          <div class="info-item" *ngIf="order.notiz">
            <span class="label">Notiz:</span>
            <span class="value">{{ order.notiz }}</span>
          </div>
        </div>

        <div class="historical-badge" *ngIf="order.is_historical">
          <mat-icon>history</mat-icon>
          <span>Historische Bestellung - Keine Auswirkung auf Materialbestand</span>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .info-card {
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

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;

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
      }

      .supplier-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #1976d2;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: color 0.2s ease;

        &:hover {
          color: #1565c0;
          text-decoration: underline;
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    .historical-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: #fff3e0;
      border-left: 4px solid #ff9800;
      border-radius: 4px;
      margin-top: 16px;

      mat-icon {
        color: #ff9800;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      span {
        font-size: 14px;
        color: #e65100;
        font-weight: 500;
      }
    }
  `]
})
export class OrderInfoCardComponent {
  @Input() order!: Order;
  @Input() supplier?: Supplier;

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('de-DE');
  }
}
