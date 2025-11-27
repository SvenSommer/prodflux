import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Delivery } from '../../deliveries/deliveries.service';

@Component({
  selector: 'app-order-deliveries-card',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <mat-card class="deliveries-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>local_shipping</mat-icon>
          Zugehörige Lieferungen
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div *ngIf="deliveries.length > 0; else noDeliveries" class="deliveries-content">
          <div class="delivery-list">
            <a
              *ngFor="let delivery of deliveries"
              [routerLink]="['/deliveries', delivery.id]"
              class="delivery-item">
              <div class="delivery-icon-wrapper">
                <mat-icon class="delivery-icon">inventory_2</mat-icon>
              </div>
              <div class="delivery-info">
                <div class="delivery-header">
                  <span class="delivery-id">Lieferung #{{ delivery.id }}</span>
                  <mat-icon class="arrow-icon">chevron_right</mat-icon>
                </div>
                <div class="delivery-details">
                  <span *ngIf="delivery.delivered_at" class="delivery-date">
                    <mat-icon>event</mat-icon>
                    Angekommen: {{ formatDate(delivery.delivered_at) }}
                  </span>
                  <span *ngIf="!delivery.delivered_at" class="delivery-date pending">
                    <mat-icon>schedule</mat-icon>
                    Erstellt: {{ formatDateTime(delivery.created_at) }}
                  </span>
                  <span *ngIf="delivery.note" class="delivery-note">
                    <mat-icon>note</mat-icon>
                    {{ delivery.note }}
                  </span>
                </div>
              </div>
            </a>
          </div>
          <button
            mat-stroked-button
            color="primary"
            (click)="addDelivery.emit()"
            class="add-more-button">
            <mat-icon>add</mat-icon>
            Weitere Lieferung hinzufügen
          </button>
        </div>

        <ng-template #noDeliveries>
          <div class="no-deliveries">
            <div class="no-deliveries-icon">
              <mat-icon>inbox</mat-icon>
            </div>
            <h4>Noch keine Lieferung verknüpft</h4>
            <p>Verknüpfen Sie eine bestehende Lieferung oder erstellen Sie eine neue.</p>
            <button
              mat-raised-button
              color="accent"
              (click)="addDelivery.emit()"
              class="add-first-button">
              <mat-icon>local_shipping</mat-icon>
              Lieferung hinzufügen
            </button>
          </div>
        </ng-template>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .deliveries-card {
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

    .deliveries-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .delivery-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .delivery-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background-color: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s ease;

      &:hover {
        background-color: #e3f2fd;
        border-color: #1976d2;
        box-shadow: 0 2px 8px rgba(25, 118, 210, 0.15);

        .arrow-icon {
          transform: translateX(4px);
        }
      }

      .delivery-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        background-color: #1976d2;
        border-radius: 8px;
        flex-shrink: 0;

        .delivery-icon {
          color: white;
          font-size: 28px;
          width: 28px;
          height: 28px;
        }
      }

      .delivery-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .delivery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .delivery-id {
            font-size: 16px;
            font-weight: 600;
            color: #333;
          }

          .arrow-icon {
            color: #1976d2;
            transition: transform 0.2s ease;
          }
        }

        .delivery-details {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .delivery-date,
          .delivery-note {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: #666;

            mat-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
              color: #999;
            }

            &.pending {
              color: #f57c00;

              mat-icon {
                color: #f57c00;
              }
            }
          }

          .delivery-note {
            font-style: italic;
          }
        }
      }
    }

    .add-more-button {
      align-self: flex-start;
    }

    .no-deliveries {
      text-align: center;
      padding: 40px 20px;

      .no-deliveries-icon {
        margin-bottom: 16px;

        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: #ccc;
        }
      }

      h4 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 500;
        color: #333;
      }

      p {
        margin: 0 0 24px 0;
        font-size: 14px;
        color: #666;
      }

      .add-first-button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
    }
  `]
})
export class OrderDeliveriesCardComponent {
  @Input() deliveries: Delivery[] = [];
  @Output() addDelivery = new EventEmitter<void>();

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('de-DE');
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
