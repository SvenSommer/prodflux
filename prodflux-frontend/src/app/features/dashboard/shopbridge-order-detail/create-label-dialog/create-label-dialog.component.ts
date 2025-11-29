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
  DHLProductInfo,
  DHLServiceOption,
  CreateLabelRequest,
  LabelResult,
  AddressValidationResult,
  getProductsForCountry,
} from '../../dhl.service';
import { WooCommerceOrderDetail } from '../../shopbridgeorder.service';
import { ShippingConfigService, CountryShippingInfo } from '../../../settings/shipping-config.service';

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

      <!-- Loading Config -->
      <div *ngIf="loadingConfig" class="loading-config">
        <mat-spinner diameter="24"></mat-spinner>
        <span>Versandkonfiguration wird geladen...</span>
      </div>

      <!-- External Link Mode (e.g., Switzerland, UK) -->
      <div *ngIf="!loadingConfig && shippingConfig?.shipping_type === 'external_link'" class="external-link-section">
        <div class="external-info">
          <mat-icon>info</mat-icon>
          <div class="external-text">
            <strong>Externer Versanddienstleister</strong>
            <p>Für {{ shippingConfig?.country_name || data.order.shipping.country }} wird ein externer Versanddienstleister verwendet.</p>
          </div>
        </div>
        <a
          [href]="shippingConfig?.external_link || 'https://www.dhl.de/de/privatkunden.html'"
          target="_blank"
          class="external-link-button">
          <mat-icon>open_in_new</mat-icon>
          {{ shippingConfig?.external_link_label || 'DHL Privatkunden Portal öffnen' }}
        </a>
      </div>

      <!-- DHL Product Mode (Normal Label Creation) -->
      <ng-container *ngIf="!loadingConfig && (!shippingConfig || shippingConfig.shipping_type === 'dhl_product')">
        <!-- Product Selection -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>DHL Produkt</mat-label>
        <mat-select [(ngModel)]="selectedProduct" (selectionChange)="onProductChange()">
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

      <!-- Validate Address First -->
      <div class="checkbox-row">
        <mat-checkbox [(ngModel)]="validateFirst">
          Adresse vor Erstellung prüfen
        </mat-checkbox>
      </div>

      <!-- Validation Result -->
      <div *ngIf="validationResult" class="validation-result"
           [class.valid]="validationResult.valid"
           [class.invalid]="!validationResult.valid">
        <mat-icon>{{ validationResult.valid ? 'check_circle' : 'error' }}</mat-icon>
        <div class="validation-content">
          <strong>{{ validationResult.valid ? 'Adresse gültig' : 'Adresse ungültig' }}</strong>
          <ul *ngIf="validationResult.errors?.length">
            <li *ngFor="let err of validationResult.errors">{{ err }}</li>
          </ul>
          <ul *ngIf="validationResult.warnings?.length" class="warnings">
            <li *ngFor="let warn of validationResult.warnings">{{ warn }}</li>
          </ul>
        </div>
      </div>

      <!-- Additional Services -->
      <mat-expansion-panel class="services-panel">
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon>settings</mat-icon>
            Zusatzservices
            <span *ngIf="loadingServices" class="loading-hint">(lädt...)</span>
          </mat-panel-title>
        </mat-expansion-panel-header>

        <div *ngIf="services.length === 0 && !loadingServices" class="no-services">
          <mat-icon>info</mat-icon>
          Keine Zusatzservices für dieses Produkt verfügbar.
        </div>

        <div class="services-grid">
          <ng-container *ngFor="let service of services">
            <!-- Boolean services (checkbox only) -->
            <mat-checkbox
              *ngIf="service.inputType === 'boolean' || !service.inputType"
              [(ngModel)]="service.enabled">
              {{ service.name }}
              <span class="service-desc">– {{ service.description }}</span>
            </mat-checkbox>

            <!-- Text/Email services (checkbox + input) -->
            <div *ngIf="service.inputType === 'text' || service.inputType === 'email'" class="service-with-input">
              <mat-checkbox [(ngModel)]="service.enabled">
                {{ service.name }}
                <span class="service-desc">– {{ service.description }}</span>
              </mat-checkbox>
              <mat-form-field
                *ngIf="service.enabled"
                appearance="outline"
                class="service-input">
                <mat-label>{{ service.name }}</mat-label>
                <input
                  matInput
                  [type]="service.inputType === 'email' ? 'email' : 'text'"
                  [(ngModel)]="serviceInputValues[service.key]"
                  [placeholder]="service.placeholder || ''"
                  [maxlength]="service.maxLength || 100">
              </mat-form-field>
            </div>
          </ng-container>
        </div>
      </mat-expansion-panel>

      <!-- Error Display -->
      <div *ngIf="error" class="error-message">
        <mat-icon>error</mat-icon>
        <div class="error-content">
          <strong>{{ error }}</strong>
          <ul *ngIf="errorDetails?.validation_errors?.length" class="error-list">
            <li *ngFor="let err of errorDetails?.validation_errors">{{ err }}</li>
          </ul>
          <ul *ngIf="errorDetails?.warnings?.length" class="warning-list">
            <li *ngFor="let warn of errorDetails?.warnings">⚠️ {{ warn }}</li>
          </ul>
        </div>
      </div>

      <!-- Success Display -->
      <div *ngIf="result?.success" class="success-message">
        <mat-icon>check_circle</mat-icon>
        <div class="success-content">
          <strong>Label erstellt!</strong>
          <span>Sendungsnummer: {{ result?.shipment_number }}</span>
        </div>
      </div>

      <!-- Print Instructions -->
      <div *ngIf="result?.success" class="print-instructions">
        <mat-icon>info</mat-icon>
        <div class="instructions-content">
          <strong>Druckeinstellungen:</strong>
          <ul>
            <li>Drucker: <strong>PL70e-BT</strong></li>
            <li>Papierformat: <strong>100 x 150 mm</strong></li>
            <li>Skalierung: <strong>An druckbaren Bereich anpassen</strong></li>
          </ul>
        </div>
      </div>

      <!-- Warnings Display -->
      <div *ngIf="result?.warnings?.length" class="warnings-message">
        <mat-icon>warning</mat-icon>
        <ul>
          <li *ngFor="let warning of result?.warnings">{{ warning }}</li>
        </ul>
      </div>
      </ng-container>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()" [disabled]="loading">
        {{ result?.success ? 'Schließen' : 'Abbrechen' }}
      </button>

      <button
        *ngIf="result?.success && result?.label_pdf_base64"
        mat-stroked-button
        color="primary"
        (click)="openLabel()">
        <mat-icon>open_in_new</mat-icon>
        Anzeigen
      </button>

      <button
        *ngIf="result?.success && result?.label_pdf_base64"
        mat-raised-button
        color="accent"
        (click)="printLabel()">
        <mat-icon>print</mat-icon>
        Drucken
      </button>

      <button
        *ngIf="!result?.success && (!shippingConfig || shippingConfig.shipping_type === 'dhl_product')"
        mat-raised-button
        color="primary"
        (click)="createLabel()"
        [disabled]="loading || validating || loadingConfig">
        <mat-spinner *ngIf="loading || validating" diameter="20"></mat-spinner>
        <mat-icon *ngIf="!loading && !validating">local_shipping</mat-icon>
        {{ validating ? 'Prüfe Adresse...' : (loading ? 'Wird erstellt...' : 'Label erstellen') }}
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

    .loading-config {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 20px;

      span {
        color: #666;
        font-size: 14px;
      }
    }

    .external-link-section {
      padding: 20px;
      background: #fff3e0;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #ff9800;

      .external-info {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;

        mat-icon {
          color: #ff9800;
          font-size: 24px;
          width: 24px;
          height: 24px;
        }

        .external-text {
          strong {
            display: block;
            color: #e65100;
            margin-bottom: 4px;
          }

          p {
            margin: 0;
            color: #666;
            font-size: 14px;
          }
        }
      }

      .external-link-button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        background: #ff9800;
        color: white;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 500;
        transition: background 0.2s;

        &:hover {
          background: #f57c00;
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
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

    .validation-result {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      margin-top: 12px;

      mat-icon {
        flex-shrink: 0;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      &.valid {
        background: #e8f5e9;
        color: #2e7d32;
        border-left: 4px solid #2e7d32;
      }

      &.invalid {
        background: #ffebee;
        color: #c62828;
        border-left: 4px solid #c62828;
      }

      .validation-content {
        flex: 1;
        font-size: 13px;

        strong {
          display: block;
          margin-bottom: 4px;
        }

        ul {
          margin: 4px 0 0 0;
          padding-left: 18px;

          li {
            margin-bottom: 2px;
          }

          &.warnings {
            color: #e65100;
          }
        }
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
        margin-top: 2px;
      }

      .error-content {
        flex: 1;

        strong {
          display: block;
          margin-bottom: 8px;
        }

        .error-list, .warning-list {
          margin: 8px 0 0 0;
          padding-left: 20px;
          font-size: 13px;

          li {
            margin-bottom: 4px;
          }
        }

        .warning-list {
          color: #e65100;
        }
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

    .print-instructions {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      background: #e3f2fd;
      border-radius: 8px;
      color: #1565c0;
      margin-top: 12px;
      border-left: 4px solid #1976d2;

      mat-icon {
        flex-shrink: 0;
        margin-top: 2px;
      }

      .instructions-content {
        font-size: 13px;

        strong {
          display: block;
          margin-bottom: 8px;
        }

        ul {
          margin: 0;
          padding-left: 18px;

          li {
            margin-bottom: 4px;
          }
        }
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

    .loading-hint {
      font-size: 12px;
      color: #999;
      margin-left: 8px;
    }

    .no-services {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      color: #666;
      font-style: italic;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .service-with-input {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .service-input {
        margin-left: 24px;
        margin-top: 4px;
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
  private shippingConfigService = inject(ShippingConfigService);
  private snackBar = inject(MatSnackBar);

  // Configuration options - filtered by country
  products: DHLProductInfo[] = [];
  allProducts = DHL_PRODUCTS;
  printFormats = PRINT_FORMATS;
  services: DHLServiceOption[] = [];
  allServices: DHLServiceOption[] = [];  // All services from backend

  // Form state
  selectedProduct: DHLProduct = 'V62KP';
  selectedPrintFormat = '910-300-400';  // Thermodrucker 103x150mm (DHL Standard)
  weightKg = 0.5;
  validateFirst = true;  // Default: Adresse vor Erstellung prüfen
  preferredLocation = '';
  serviceInputValues: Record<string, string> = {};  // For text/email inputs

  // UI state
  loading = false;
  validating = false;
  loadingServices = true;
  loadingConfig = true;
  error: string | null = null;
  errorDetails: { validation_errors?: string[]; warnings?: string[] } | null = null;
  result: LabelResult | null = null;
  validationResult: AddressValidationResult | null = null;

  // Shipping config for this country
  shippingConfig: CountryShippingInfo | null = null;

  constructor(
    public dialogRef: MatDialogRef<CreateLabelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateLabelDialogData
  ) {
    // Load shipping config for country, then detect product
    this.loadShippingConfig();
    // Load services from backend
    this.loadServices();
  }

  private loadShippingConfig(): void {
    const countryCode = this.data.order.shipping.country || 'DE';
    this.loadingConfig = true;

    // Filter products based on country
    this.products = getProductsForCountry(countryCode);

    this.shippingConfigService.getConfigForCountry(countryCode).subscribe({
      next: (config) => {
        this.shippingConfig = config;
        this.loadingConfig = false;

        // Set product from config if it's a DHL product type and valid for this country
        if (config.shipping_type === 'dhl_product' && config.dhl_product) {
          const isValidProduct = this.products.some(p => p.code === config.dhl_product);
          if (isValidProduct) {
            this.selectedProduct = config.dhl_product as DHLProduct;
          } else {
            // Config product not valid for this country, use detection
            this.detectProduct();
          }
        } else {
          // Fallback detection
          this.detectProduct();
        }
        // Update services after product is set
        this.updateServicesForProduct();
      },
      error: () => {
        this.loadingConfig = false;
        // Fallback to auto-detection
        this.detectProduct();
        // Update services after product is set
        this.updateServicesForProduct();
      }
    });
  }

  private loadServices(): void {
    this.loadingServices = true;
    this.dhlService.getServices().subscribe({
      next: (response) => {
        this.allServices = response.services.map(s => ({
          ...s,
          enabled: s.defaultEnabled || false
        }));
        this.updateServicesForProduct();
        this.loadingServices = false;
      },
      error: () => {
        // Fallback to static services
        this.allServices = [...DHL_SERVICES];
        this.updateServicesForProduct();
        this.loadingServices = false;
      }
    });
  }

  updateServicesForProduct(): void {
    // Filter services based on selected product and set default enabled state
    this.services = this.allServices
      .filter(s => !s.products || s.products.includes(this.selectedProduct))
      .map(s => ({
        ...s,
        enabled: s.defaultEnabled || false  // Reset to default when product changes
      }));
  }

  onProductChange(): void {
    // Update available services when product changes
    this.updateServicesForProduct();
    // Reset validation when product changes
    this.validationResult = null;
  }

  private detectProduct(): void {
    const shippingLines = this.data.order.shipping_lines || [];
    const methodTitle = shippingLines[0]?.method_title?.toLowerCase() || '';
    const countryCode = this.data.order.shipping.country || 'DE';

    // Check if we have products for this country
    if (this.products.length === 0) {
      this.products = getProductsForCountry(countryCode);
    }

    // For Germany: prefer Kleinpaket, for international: prefer Warenpost Int.
    if (countryCode === 'DE') {
      // National shipment
      if (methodTitle.includes('paket') || methodTitle.includes('standard')) {
        this.selectedProduct = 'V01PAK';
      } else {
        // Default: DHL Kleinpaket für Deutschland
        this.selectedProduct = 'V62KP';
      }
    } else {
      // International shipment - select first available international product
      if (methodTitle.includes('paket')) {
        // Check if V53WPAK is available for this country
        const hasIntPaket = this.products.some(p => p.code === 'V53WPAK');
        this.selectedProduct = hasIntPaket ? 'V53WPAK' : 'V66WPI';
      } else {
        // Default: Warenpost International
        this.selectedProduct = 'V66WPI';
      }
    }
    // Keep default print format: 910-300-400 (103x150 Thermo)
  }

  getService(key: string) {
    return this.services.find(s => s.key === key);
  }

  getServiceInputValue(key: string): string {
    return this.serviceInputValues[key] || '';
  }

  setServiceInputValue(key: string, value: string): void {
    this.serviceInputValues[key] = value;
  }

  private buildRequest(): CreateLabelRequest {
    const shipping = this.data.order.shipping;
    const { street, houseNumber } = this.parseAddress(shipping.address_1);

    return {
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
      woocommerce_order_id: this.data.order.id,
      woocommerce_order_number: this.data.order.number,
    };
  }

  validateAddress(): void {
    this.validating = true;
    this.validationResult = null;
    this.error = null;

    const request = this.buildRequest();

    this.dhlService.validateAddress(request).subscribe({
      next: (result) => {
        this.validating = false;
        this.validationResult = result;

        if (result.valid) {
          this.snackBar.open('Adresse ist gültig', 'OK', { duration: 3000 });
        } else {
          this.snackBar.open('Adresse ist ungültig', 'OK', { duration: 3000 });
        }
      },
      error: (err) => {
        this.validating = false;
        this.error = err.error?.detail || err.message || 'Validierung fehlgeschlagen';
      },
    });
  }

  createLabel(): void {
    // If validation is enabled and not yet done, validate first
    if (this.validateFirst && !this.validationResult) {
      this.validating = true;
      this.error = null;

      const request = this.buildRequest();

      this.dhlService.validateAddress(request).subscribe({
        next: (result) => {
          this.validating = false;
          this.validationResult = result;

          if (result.valid) {
            // Address is valid, proceed with label creation
            this.doCreateLabel();
          } else {
            this.snackBar.open(
              'Adresse ist ungültig. Bitte korrigieren.',
              'OK',
              { duration: 5000 }
            );
          }
        },
        error: (err) => {
          this.validating = false;
          this.error = err.error?.detail || err.message || 'Validierung fehlgeschlagen';
        },
      });
      return;
    }

    // If validation passed or disabled, create label
    if (!this.validateFirst || this.validationResult?.valid) {
      this.doCreateLabel();
    }
  }

  private doCreateLabel(): void {
    this.loading = true;
    this.error = null;
    this.errorDetails = null;
    this.result = null;

    const request = this.buildRequest();

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
          // Log detailed error information to console for debugging
          console.error('DHL Label Creation Failed:', {
            error: result.error,
            validation_errors: result.validation_errors,
            error_details: result.error_details,
            debug_info: result.debug_info,
          });
          this.error = result.error || 'Label konnte nicht erstellt werden';
          this.errorDetails = {
            validation_errors: result.validation_errors,
            warnings: result.warnings,
          };
        }
      },
      error: (err) => {
        this.loading = false;
        // Log full error response to console for debugging
        console.error('DHL API Error Response:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          validation_errors: err.error?.validation_errors,
          error_details: err.error?.error_details,
          debug_info: err.error?.debug_info,
        });

        // Store detailed error information for display
        this.errorDetails = {
          validation_errors: err.error?.validation_errors || [],
          warnings: err.error?.error?.warnings || err.error?.warnings || [],
        };

        // Build main error message
        this.error = err.error?.error?.error || err.error?.error || err.message || 'Unbekannter Fehler';
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
        // Check if service has a text/email input
        if (service.inputType === 'text' || service.inputType === 'email') {
          const inputValue = this.serviceInputValues[service.key];
          if (inputValue && inputValue.trim()) {
            result[service.key] = inputValue.trim();
          }
          // Skip if no input value provided
        } else {
          // Boolean service
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

  printLabel(): void {
    if (this.result?.label_pdf_base64) {
      // Convert base64 to blob
      const byteCharacters = atob(this.result.label_pdf_base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Create a hidden iframe for printing - keeps the dialog open
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = 'none';
      printFrame.src = url;
      document.body.appendChild(printFrame);

      // Wait for PDF to load, then print
      printFrame.onload = () => {
        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
          } catch (e) {
            // Fallback: open in new tab
            window.open(url, '_blank');
            this.snackBar.open('Bitte drucken Sie das PDF manuell (Strg+P)', 'OK', { duration: 5000 });
          }
        }, 100);
      };

      this.snackBar.open('Druckdialog wird geöffnet...', '', { duration: 2000 });
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
