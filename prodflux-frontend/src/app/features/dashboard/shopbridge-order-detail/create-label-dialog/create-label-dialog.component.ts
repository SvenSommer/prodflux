import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  DHLService,
  DHL_PRODUCTS,
  PRINT_FORMATS,
  DHL_SERVICES,
  DHLProduct,
  DHLServiceOption,
  CreateLabelRequest,
  LabelResult,
} from '../../dhl.service';
import { WooCommerceOrderDetail } from '../../shopbridgeorder.service';

export interface CreateLabelDialogData {
  order: WooCommerceOrderDetail;
}

export interface CreateLabelDialogResult {
  success: boolean;
  result?: LabelResult;
}

@Component({
  selector: 'app-create-label-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>local_shipping</mat-icon>
      DHL Label erstellen
    </h2>

    <mat-dialog-content>
      <!-- Order Info -->
      <div class="order-info">
        <span class="order-number">Bestellung #{{ data.order.number }}</span>
        <span class="customer-name">
          {{ data.order.shipping.first_name }} {{ data.order.shipping.last_name }}
        </span>
      </div>

      <!-- Shipping Address Preview -->
      <div class="address-preview">
        <div class="address-label">Lieferadresse:</div>
        <div class="address-text">
          {{ data.order.shipping.first_name }} {{ data.order.shipping.last_name }}<br>
          <span *ngIf="data.order.shipping.company">{{ data.order.shipping.company }}<br></span>
          {{ data.order.shipping.address_1 }}
          <span *ngIf="data.order.shipping.address_2">, {{ data.order.shipping.address_2 }}</span><br>
          {{ data.order.shipping.postcode }} {{ data.order.shipping.city }}<br>
          {{ data.order.shipping.country }}
        </div>
      </div>

      <!-- Product Selection -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>DHL Produkt</mat-label>
        <mat-select [(ngModel)]="selectedProduct">
          <mat-option *ngFor="let product of products" [value]="product.code">
            {{ product.name }}
            <span class="product-desc">– {{ product.description }}</span>
          </mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Weight -->
      <mat-form-field appearance="outline" class="weight-field">
        <mat-label>Gewicht (kg)</mat-label>
        <input matInput type="number" [(ngModel)]="weightKg" min="0.01" step="0.1">
      </mat-form-field>

      <!-- Print Format -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Druckformat</mat-label>
        <mat-select [(ngModel)]="selectedPrintFormat">
          <mat-option *ngFor="let format of printFormats" [value]="format.code">
            {{ format.name }}
            <span class="format-desc">– {{ format.description }}</span>
          </mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Validate Address Only -->
      <div class="checkbox-row">
        <mat-checkbox [(ngModel)]="validateOnly">
          Nur valide Adressen
        </mat-checkbox>
      </div>

      <!-- Additional Services -->
      <mat-expansion-panel class="services-panel">
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon>settings</mat-icon>
            Zusatzservices
          </mat-panel-title>
        </mat-expansion-panel-header>

        <div class="services-grid">
          <mat-checkbox
            *ngFor="let service of services"
            [(ngModel)]="service.enabled">
            {{ service.name }}
            <span class="service-desc">– {{ service.description }}</span>
          </mat-checkbox>
        </div>

        <!-- Preferred Location Input -->
        <mat-form-field
          *ngIf="getService('preferredLocation')?.enabled"
          appearance="outline"
          class="full-width">
          <mat-label>Ablageort</mat-label>
          <input matInput [(ngModel)]="preferredLocation" placeholder="z.B. Garage, Terrasse">
        </mat-form-field>
      </mat-expansion-panel>

      <!-- Error Display -->
      <div *ngIf="error" class="error-message">
        <mat-icon>error</mat-icon>
        {{ error }}
      </div>

      <!-- Success Display -->
      <div *ngIf="result?.success" class="success-message">
        <mat-icon>check_circle</mat-icon>
        <div class="success-content">
          <strong>Label erstellt!</strong>
          <span>Sendungsnummer: {{ result?.shipment_number }}</span>
        </div>
      </div>

      <!-- Warnings Display -->
      <div *ngIf="result?.warnings?.length" class="warnings-message">
        <mat-icon>warning</mat-icon>
        <ul>
          <li *ngFor="let warning of result?.warnings">{{ warning }}</li>
        </ul>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()" [disabled]="loading">
        Abbrechen
      </button>

      <button
        *ngIf="result?.success && result?.label_pdf_base64"
        mat-stroked-button
        color="primary"
        (click)="openLabel()">
        <mat-icon>open_in_new</mat-icon>
        Label anzeigen
      </button>

      <button
        *ngIf="result?.success && result?.label_pdf_base64"
        mat-raised-button
        color="accent"
        (click)="downloadLabel()">
        <mat-icon>download</mat-icon>
        Label herunterladen
      </button>

      <button
        *ngIf="!result?.success"
        mat-raised-button
        color="primary"
        (click)="createLabel()"
        [disabled]="loading">
        <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
        <mat-icon *ngIf="!loading">local_shipping</mat-icon>
        {{ loading ? 'Wird erstellt...' : 'Label erstellen' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 400px;
      max-width: 500px;
    }

    .order-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 16px;

      .order-number {
        font-weight: 600;
        color: #1976d2;
      }

      .customer-name {
        color: #666;
      }
    }

    .address-preview {
      padding: 12px 16px;
      background: #e3f2fd;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #1976d2;

      .address-label {
        font-size: 12px;
        font-weight: 600;
        color: #1976d2;
        margin-bottom: 8px;
        text-transform: uppercase;
      }

      .address-text {
        font-size: 14px;
        line-height: 1.5;
        color: #333;
      }
    }

    .full-width {
      width: 100%;
      margin-bottom: 12px;
    }

    .weight-field {
      width: 150px;
      margin-bottom: 12px;
    }

    .product-desc, .format-desc, .service-desc {
      color: #999;
      font-size: 12px;
    }

    .checkbox-row {
      margin-bottom: 16px;
    }

    .services-panel {
      margin-bottom: 16px;

      mat-panel-title {
        display: flex;
        align-items: center;
        gap: 8px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    }

    .services-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;

      mat-checkbox {
        display: block;
      }
    }

    .error-message {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      background: #ffebee;
      border-radius: 8px;
      color: #c62828;
      margin-top: 16px;

      mat-icon {
        flex-shrink: 0;
      }
    }

    .success-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #e8f5e9;
      border-radius: 8px;
      color: #2e7d32;
      margin-top: 16px;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .success-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
    }

    .warnings-message {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      background: #fff3e0;
      border-radius: 8px;
      color: #e65100;
      margin-top: 12px;

      mat-icon {
        flex-shrink: 0;
      }

      ul {
        margin: 0;
        padding-left: 16px;
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
      gap: 8px;

      button mat-spinner {
        display: inline-block;
        margin-right: 8px;
      }
    }
  `],
})
export class CreateLabelDialogComponent {
  private dhlService = inject(DHLService);
  private snackBar = inject(MatSnackBar);

  // Configuration options
  products = DHL_PRODUCTS;
  printFormats = PRINT_FORMATS;
  services = [...DHL_SERVICES];

  // Form state
  selectedProduct: DHLProduct = 'V62WP';
  selectedPrintFormat = '910-300-400';
  weightKg = 0.5;
  validateOnly = false;
  preferredLocation = '';

  // UI state
  loading = false;
  error: string | null = null;
  result: LabelResult | null = null;

  constructor(
    public dialogRef: MatDialogRef<CreateLabelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateLabelDialogData
  ) {
    // Auto-detect product based on shipping method
    this.detectProduct();
  }

  private detectProduct(): void {
    const shippingLines = this.data.order.shipping_lines || [];
    const methodTitle = shippingLines[0]?.method_title?.toLowerCase() || '';

    if (methodTitle.includes('warenpost') || methodTitle.includes('brief')) {
      this.selectedProduct = 'V62WP';
      this.selectedPrintFormat = '910-300-400';
    } else if (methodTitle.includes('international')) {
      this.selectedProduct = 'V66WPI';
    } else {
      this.selectedProduct = 'V01PAK';
      this.selectedPrintFormat = '910-300-710';
    }
  }

  getService(key: string) {
    return this.services.find(s => s.key === key);
  }

  createLabel(): void {
    this.loading = true;
    this.error = null;
    this.result = null;

    const shipping = this.data.order.shipping;

    // Parse address
    const { street, houseNumber } = this.parseAddress(shipping.address_1);

    const request: CreateLabelRequest = {
      consignee: {
        name1: `${shipping.first_name} ${shipping.last_name}`.trim(),
        name2: shipping.company || undefined,
        street: street,
        house_number: houseNumber,
        postal_code: shipping.postcode,
        city: shipping.city,
        country: this.mapCountryCode(shipping.country),
        email: this.data.order.billing.email,
        phone: this.data.order.billing.phone,
      },
      details: {
        weight_kg: this.weightKg,
      },
      product: this.selectedProduct,
      reference: `WC-${this.data.order.number}`,
      print_format: this.selectedPrintFormat,
      services: this.buildServices(),
    };

    this.dhlService.createLabel(request).subscribe({
      next: (result) => {
        this.loading = false;
        this.result = result;

        if (result.success) {
          this.snackBar.open(
            `Label erstellt: ${result.shipment_number}`,
            'OK',
            { duration: 5000 }
          );
        } else {
          this.error = result.error || 'Label konnte nicht erstellt werden';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || err.message || 'Unbekannter Fehler';
      },
    });
  }

  private parseAddress(address: string): { street: string; houseNumber: string } {
    // Try to extract house number from address
    // Common patterns: "Musterstraße 123", "Musterstr. 123a"
    const match = address.match(/^(.+?)\s+(\d+\s*[a-zA-Z]?)$/);

    if (match) {
      return {
        street: match[1].trim(),
        houseNumber: match[2].trim(),
      };
    }

    // Fallback: use entire address as street
    return {
      street: address,
      houseNumber: '',
    };
  }

  private mapCountryCode(code: string): string {
    // WooCommerce uses 2-letter codes, DHL expects 3-letter
    const mapping: Record<string, string> = {
      'DE': 'DEU',
      'AT': 'AUT',
      'CH': 'CHE',
      'NL': 'NLD',
      'BE': 'BEL',
      'FR': 'FRA',
      'IT': 'ITA',
      'ES': 'ESP',
      'PL': 'POL',
      'GB': 'GBR',
      'UK': 'GBR',
    };

    return mapping[code.toUpperCase()] || code;
  }

  private buildServices(): Record<string, boolean | string> {
    const result: Record<string, boolean | string> = {};

    for (const service of this.services) {
      if (service.enabled) {
        if (service.key === 'preferredLocation' && this.preferredLocation) {
          result[service.key] = this.preferredLocation;
        } else {
          result[service.key] = true;
        }
      }
    }

    return result;
  }

  openLabel(): void {
    if (this.result?.label_pdf_base64) {
      this.dhlService.openLabel(this.result.label_pdf_base64);
    }
  }

  downloadLabel(): void {
    if (this.result?.label_pdf_base64) {
      const filename = `DHL-Label-${this.data.order.number}-${this.result.shipment_number}.pdf`;
      this.dhlService.downloadLabel(this.result.label_pdf_base64, filename);
    }
  }

  cancel(): void {
    const dialogResult: CreateLabelDialogResult = {
      success: this.result?.success || false,
      result: this.result || undefined,
    };
    this.dialogRef.close(dialogResult);
  }
}
