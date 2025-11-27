import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WooCommerceOrderDetail, WooCommerceBillingAddress, WooCommerceAddress } from '../../shopbridgeorder.service';

@Component({
  selector: 'app-shopbridge-order-customer-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTooltipModule],
  template: `
    <mat-card class="customer-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>person</mat-icon>
          Kundeninformationen
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="addresses-grid">
          <!-- Rechnungsadresse -->
          <div class="address-block">
            <div class="address-header">
              <mat-icon>receipt</mat-icon>
              <span>Rechnungsadresse</span>
            </div>
            <div class="address-content">
              <div class="customer-name">
                {{ order.billing.first_name }} {{ order.billing.last_name }}
              </div>
              <div class="company" *ngIf="order.billing.company">
                {{ order.billing.company }}
              </div>
              <div class="address-lines">
                <span>{{ order.billing.address_1 }}</span>
                <span *ngIf="order.billing.address_2">{{ order.billing.address_2 }}</span>
                <span>{{ order.billing.postcode }} {{ order.billing.city }}</span>
                <span>{{ order.billing.state }} {{ getCountryName(order.billing.country) }}</span>
              </div>
              <div class="contact-info">
                <a href="mailto:{{ order.billing.email }}" class="contact-link" matTooltip="E-Mail senden">
                  <mat-icon>email</mat-icon>
                  {{ order.billing.email }}
                </a>
                <a href="tel:{{ order.billing.phone }}" class="contact-link" *ngIf="order.billing.phone" matTooltip="Anrufen">
                  <mat-icon>phone</mat-icon>
                  {{ order.billing.phone }}
                </a>
              </div>
            </div>
          </div>

          <!-- Lieferadresse -->
          <div class="address-block">
            <div class="address-header">
              <mat-icon>local_shipping</mat-icon>
              <span>Lieferadresse</span>
              <span class="same-badge" *ngIf="isSameAddress()">
                <mat-icon>check</mat-icon>
                Identisch
              </span>
            </div>
            <div class="address-content" *ngIf="!isSameAddress()">
              <div class="customer-name">
                {{ order.shipping.first_name }} {{ order.shipping.last_name }}
              </div>
              <div class="company" *ngIf="order.shipping.company">
                {{ order.shipping.company }}
              </div>
              <div class="address-lines">
                <span>{{ order.shipping.address_1 }}</span>
                <span *ngIf="order.shipping.address_2">{{ order.shipping.address_2 }}</span>
                <span>{{ order.shipping.postcode }} {{ order.shipping.city }}</span>
                <span>{{ order.shipping.state }} {{ getCountryName(order.shipping.country) }}</span>
              </div>
            </div>
            <div class="address-content same-hint" *ngIf="isSameAddress()">
              <mat-icon>arrow_upward</mat-icon>
              <span>Wie Rechnungsadresse</span>
            </div>
          </div>
        </div>

        <!-- Kunden-ID Badge -->
        <div class="customer-id-section" *ngIf="order.customer_id > 0">
          <div class="customer-badge">
            <mat-icon>badge</mat-icon>
            <span>Registrierter Kunde</span>
            <span class="customer-id">ID: {{ order.customer_id }}</span>
          </div>
        </div>
        <div class="customer-id-section" *ngIf="order.customer_id === 0">
          <div class="customer-badge guest">
            <mat-icon>person_outline</mat-icon>
            <span>Gast-Bestellung</span>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .customer-card {
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

    .addresses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .address-block {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e0e0e0;
      transition: box-shadow 0.2s ease;

      &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
    }

    .address-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #1976d2;
      color: #1976d2;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .same-badge {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 4px;
        background: #e8f5e9;
        color: #2e7d32;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        text-transform: none;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }
    }

    .address-content {
      .customer-name {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }

      .company {
        font-size: 14px;
        color: #666;
        font-style: italic;
        margin-bottom: 8px;
      }

      .address-lines {
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 14px;
        color: #444;
        margin-bottom: 16px;
        line-height: 1.4;
      }

      .contact-info {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 12px;
        border-top: 1px solid #e0e0e0;
      }

      .contact-link {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #1976d2;
        text-decoration: none;
        font-size: 13px;
        transition: color 0.2s ease;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        &:hover {
          color: #1565c0;
          text-decoration: underline;
        }
      }

      &.same-hint {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: #666;
        font-size: 14px;
        padding: 24px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    }

    .customer-id-section {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .customer-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      color: #1565c0;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .customer-id {
        background: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-family: 'Roboto Mono', monospace;
        font-size: 12px;
      }

      &.guest {
        background: linear-gradient(135deg, #f5f5f5, #eeeeee);
        color: #666;
      }
    }
  `]
})
export class ShopbridgeOrderCustomerCardComponent {
  @Input() order!: WooCommerceOrderDetail;

  isSameAddress(): boolean {
    const b = this.order.billing;
    const s = this.order.shipping;
    return (
      b.first_name === s.first_name &&
      b.last_name === s.last_name &&
      b.address_1 === s.address_1 &&
      b.city === s.city &&
      b.postcode === s.postcode &&
      b.country === s.country
    );
  }

  getCountryName(code: string): string {
    const countries: Record<string, string> = {
      'DE': 'Deutschland',
      'AT': 'Österreich',
      'CH': 'Schweiz',
      'US': 'USA',
      'GB': 'Großbritannien',
      'FR': 'Frankreich',
      'NL': 'Niederlande',
      'BE': 'Belgien',
      'IT': 'Italien',
      'ES': 'Spanien',
      'PL': 'Polen',
      'CZ': 'Tschechien',
    };
    return countries[code] || code;
  }
}
