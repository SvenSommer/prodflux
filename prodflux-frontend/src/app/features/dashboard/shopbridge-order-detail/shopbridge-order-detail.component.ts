import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ShopbridgeOrdersService, WooCommerceOrderDetail } from '../shopbridgeorder.service';
import { BreadcrumbComponent } from '../../../shared/breadcrumb/breadcrumb.component';
import { ShopbridgeOrderInfoCardComponent } from './shopbridge-order-info-card/shopbridge-order-info-card.component';
import { ShopbridgeOrderCustomerCardComponent } from './shopbridge-order-customer-card/shopbridge-order-customer-card.component';
import { ShopbridgeOrderItemsCardComponent } from './shopbridge-order-items-card/shopbridge-order-items-card.component';
import { ShopbridgeOrderFinancialCardComponent } from './shopbridge-order-financial-card/shopbridge-order-financial-card.component';
import { ShopbridgeOrderLabelsCardComponent } from './shopbridge-order-labels-card/shopbridge-order-labels-card.component';
import { CompleteOrderDialogComponent, CompleteOrderDialogData } from './complete-order-dialog/complete-order-dialog.component';
import { CreateLabelDialogComponent, CreateLabelDialogData } from './create-label-dialog/create-label-dialog.component';

@Component({
  selector: 'app-shopbridge-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    BreadcrumbComponent,
    ShopbridgeOrderInfoCardComponent,
    ShopbridgeOrderCustomerCardComponent,
    ShopbridgeOrderItemsCardComponent,
    ShopbridgeOrderFinancialCardComponent,
    ShopbridgeOrderLabelsCardComponent
  ],
  template: `
    <div class="page-container">
      <!-- Breadcrumb Navigation -->
      <app-breadcrumb [links]="breadcrumbLinks"></app-breadcrumb>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <mat-spinner diameter="64"></mat-spinner>
        <p>Bestellung wird geladen...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !loading" class="error-state">
        <mat-icon>error_outline</mat-icon>
        <h3>Fehler beim Laden</h3>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" (click)="loadOrder()">
          <mat-icon>refresh</mat-icon>
          Erneut versuchen
        </button>
      </div>

      <!-- Order Detail Content -->
      <div *ngIf="order && !loading" class="order-detail-content">

        <!-- Page Header -->
        <div class="page-header">
          <div class="header-title">
            <div class="shop-badge">
              <mat-icon>store</mat-icon>
              <span>WooCommerce</span>
            </div>
            <h1>
              <mat-icon>receipt_long</mat-icon>
              Bestellung #{{ order.number }}
            </h1>
            <span class="order-id-hint">WooCommerce ID: {{ order.id }}</span>
          </div>
          <div class="header-actions">
            <!-- DHL Label erstellen -->
            <button
              mat-raised-button
              color="primary"
              (click)="openCreateLabelDialog()">
              <mat-icon>local_shipping</mat-icon>
              DHL Label
            </button>
            <!-- Bestellung abschließen - nur bei Status "processing" -->
            <button
              *ngIf="order.status === 'processing'"
              mat-raised-button
              color="accent"
              (click)="openCompleteOrderDialog()">
              <mat-icon>send</mat-icon>
              Bestellung abschließen
            </button>
            <!-- Status-Badge für abgeschlossene Bestellungen -->
            <div *ngIf="order.status === 'completed'" class="completed-badge">
              <mat-icon>check_circle</mat-icon>
              Abgeschlossen
            </div>
            <a mat-stroked-button [href]="getWooCommerceEditUrl()" target="_blank" rel="noopener">
              <mat-icon>open_in_new</mat-icon>
              In WooCommerce öffnen
            </a>
            <button mat-raised-button color="primary" (click)="refresh()">
              <mat-icon>refresh</mat-icon>
              Aktualisieren
            </button>
            <button mat-stroked-button color="primary" [routerLink]="['/dashboard']">
              <mat-icon>arrow_back</mat-icon>
              Zurück zum Dashboard
            </button>
          </div>
        </div>

        <!-- Content Grid -->
        <div class="content-grid">
          <!-- Left Column: Main Information -->
          <div class="left-column">
            <app-shopbridge-order-info-card [order]="order"></app-shopbridge-order-info-card>
            <app-shopbridge-order-items-card [lineItems]="order.line_items"></app-shopbridge-order-items-card>
            <!-- DHL Labels -->
            <app-shopbridge-order-labels-card 
              #labelsCard
              [orderId]="order.id"
              (createLabel)="openCreateLabelDialog()">
            </app-shopbridge-order-labels-card>
          </div>

          <!-- Right Column: Customer & Financial -->
          <div class="right-column">
            <app-shopbridge-order-customer-card [order]="order"></app-shopbridge-order-customer-card>
            <app-shopbridge-order-financial-card [order]="order"></app-shopbridge-order-financial-card>
          </div>
        </div>

        <!-- Order Metadata Footer -->
        <mat-card class="metadata-card">
          <mat-card-content>
            <div class="metadata-grid">
              <div class="metadata-item">
                <mat-icon>schedule</mat-icon>
                <div class="metadata-content">
                  <span class="label">Erstellt</span>
                  <span class="value">{{ formatDateTime(order.date_created) }}</span>
                </div>
              </div>
              <div class="metadata-item">
                <mat-icon>update</mat-icon>
                <div class="metadata-content">
                  <span class="label">Zuletzt aktualisiert</span>
                  <span class="value">{{ formatDateTime(order.date_modified) }}</span>
                </div>
              </div>
              <div class="metadata-item" *ngIf="order.transaction_id">
                <mat-icon>confirmation_number</mat-icon>
                <div class="metadata-content">
                  <span class="label">Transaktions-ID</span>
                  <span class="value">{{ order.transaction_id }}</span>
                </div>
              </div>
              <div class="metadata-item">
                <mat-icon>language</mat-icon>
                <div class="metadata-content">
                  <span class="label">Währung</span>
                  <span class="value">{{ order.currency }}</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    // Loading State
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      color: #666;

      p {
        margin: 24px 0 0 0;
        font-size: 16px;
      }
    }

    // Error State
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      color: #666;
      text-align: center;

      mat-icon {
        font-size: 72px;
        width: 72px;
        height: 72px;
        color: #c62828;
        margin-bottom: 16px;
      }

      h3 {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 500;
        color: #333;
      }

      p {
        margin: 0 0 24px 0;
        font-size: 14px;
        max-width: 400px;
      }
    }

    // Order Detail Content
    .order-detail-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    // Page Header
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 2px solid #e0e0e0;
      gap: 24px;
      flex-wrap: wrap;

      .header-title {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .shop-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%);
          color: white;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          width: fit-content;
          text-transform: uppercase;
          letter-spacing: 0.5px;

          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
          }
        }

        h1 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
          font-size: 32px;
          font-weight: 600;
          color: #333;

          mat-icon {
            font-size: 36px;
            width: 36px;
            height: 36px;
            color: #1976d2;
          }
        }

        .order-id-hint {
          font-size: 13px;
          color: #999;
          margin-left: 48px;
        }
      }

      .header-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;

        a, button {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .completed-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #4caf50 0%, #43a047 100%);
          color: white;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }
      }
    }

    // Content Grid
    .content-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 24px;

      @media (max-width: 1100px) {
        grid-template-columns: 1fr;
      }
    }

    .left-column,
    .right-column {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    // Metadata Card
    .metadata-card {
      background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
      border: 1px solid #e0e0e0;

      mat-card-content {
        padding: 20px 24px;
      }

      .metadata-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 32px;

        @media (max-width: 600px) {
          flex-direction: column;
          gap: 16px;
        }
      }

      .metadata-item {
        display: flex;
        align-items: center;
        gap: 12px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: #666;
        }

        .metadata-content {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .label {
            font-size: 11px;
            font-weight: 600;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .value {
            font-size: 13px;
            color: #333;
          }
        }
      }
    }

    // Responsive
    @media (max-width: 768px) {
      .page-container {
        padding: 12px;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;

        .header-title h1 {
          font-size: 24px;

          mat-icon {
            font-size: 28px;
            width: 28px;
            height: 28px;
          }
        }

        .header-actions {
          width: 100%;

          a, button {
            flex: 1;
            justify-content: center;
          }
        }
      }
    }
  `]
})
export class ShopbridgeOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private shopbridgeService = inject(ShopbridgeOrdersService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  @ViewChild('labelsCard') labelsCard?: ShopbridgeOrderLabelsCardComponent;

  order: WooCommerceOrderDetail | null = null;
  loading = true;
  error: string | null = null;

  breadcrumbLinks: { label: string; url?: string }[] = [
    { label: 'Dashboard', url: '/dashboard' },
    { label: 'ShopBridge Bestellungen', url: '/dashboard' },
    { label: 'Bestellung' }
  ];

  ngOnInit() {
    this.loadOrder();
  }

  loadOrder() {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (!orderId) {
      this.error = 'Keine Bestell-ID angegeben';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    this.shopbridgeService.getOrderDetail(Number(orderId)).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
        // Update breadcrumb with order number
        this.breadcrumbLinks = [
          { label: 'Dashboard', url: '/dashboard' },
          { label: 'ShopBridge Bestellungen', url: '/dashboard' },
          { label: `Bestellung #${order.number}` }
        ];
      },
      error: (err) => {
        console.error('Error loading order:', err);
        this.error = err.message || 'Fehler beim Laden der Bestellung';
        this.loading = false;
        this.snackBar.open('Fehler beim Laden der Bestellung', 'Schließen', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getWooCommerceEditUrl(): string {
    if (this.order) {
      // WooCommerce HPOS (High-Performance Order Storage) URL pattern for sdlink.de
      return `https://sdlink.de/wp-admin/admin.php?page=wc-orders&action=edit&id=${this.order.id}`;
    }
    return '#';
  }

  refresh(): void {
    this.loading = true;
    this.error = null;

    // Invalidate cache and reload fresh data from WooCommerce
    this.shopbridgeService.invalidateCache().subscribe({
      next: () => {
        this.loadOrder();
      },
      error: (err) => {
        console.error('Error invalidating cache:', err);
        this.loadOrder();
      }
    });
  }

  formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  openCompleteOrderDialog(): void {
    if (!this.order) return;

    const dialogData: CompleteOrderDialogData = {
      orderId: this.order.id,
      orderNumber: this.order.number,
      customerEmail: this.order.billing?.email || '',
      customerFirstName: this.order.billing?.first_name || '',
      customerLastName: this.order.billing?.last_name || '',
      customerCompany: this.order.billing?.company || undefined,
      billingCountry: this.order.billing?.country || 'DE',
      billingStreet: this.order.billing?.address_1 || '',
      billingPostcode: this.order.billing?.postcode || '',
      billingCity: this.order.billing?.city || '',
      orderTotal: this.order.total || '0',
      shippingTotal: this.order.shipping_total || '0',
      paymentMethod: this.order.payment_method || '',
      dateCreated: this.order.date_created || '',
      lineItems: this.order.line_items || []
    };

    const dialogRef = this.dialog.open(CompleteOrderDialogComponent, {
      data: dialogData,
      width: '700px',
      maxHeight: '90vh',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.completed) {
        this.snackBar.open(
          `Bestellung #${this.order?.number} erfolgreich abgeschlossen!`,
          'OK',
          { duration: 5000 }
        );
        // Reload the order to reflect the new status
        this.loadOrder();
      }
    });
  }

  openCreateLabelDialog(): void {
    if (!this.order) return;

    const dialogData: CreateLabelDialogData = {
      order: this.order
    };

    const dialogRef = this.dialog.open(CreateLabelDialogComponent, {
      data: dialogData,
      width: '550px',
      maxHeight: '90vh',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.snackBar.open(
          `DHL Label erstellt: ${result.result?.shipment_number}`,
          'OK',
          { duration: 5000 }
        );
        // Refresh the labels card
        this.labelsCard?.loadLabels();
      }
    });
  }
}
