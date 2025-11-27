import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';

import {
  EmailTemplateService,
  EmailTemplate,
  EmailTemplateRenderResponse
} from '../../email-template.service';
import { ShopbridgeOrdersService, WooCommerceLineItem } from '../../shopbridgeorder.service';

export interface CompleteOrderDialogData {
  orderId: number;
  orderNumber: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerCompany?: string;
  billingCountry: string;
  billingStreet: string;
  billingPostcode: string;
  billingCity: string;
  orderTotal: string;
  shippingTotal: string;
  paymentMethod: string;
  dateCreated: string;
  lineItems: WooCommerceLineItem[];
}

@Component({
  selector: 'app-complete-order-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatCheckboxModule,
    MatStepperModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>check_circle</mat-icon>
      Bestellung #{{ data.orderNumber }} abschließen
    </h2>

    <mat-dialog-content>
      <!-- Order Info Summary -->
      <div class="order-summary">
        <div class="customer-info">
          <mat-icon>person</mat-icon>
          <div>
            <strong>{{ data.customerFirstName }} {{ data.customerLastName }}</strong>
            <span class="email">{{ data.customerEmail }}</span>
          </div>
        </div>
        <div class="country-info">
          {{ getCountryFlag(data.billingCountry) }} {{ data.billingCountry }}
        </div>
      </div>

      <mat-divider></mat-divider>

      <!-- Checklist Section -->
      <div class="checklist-section">
        <h3>
          <mat-icon>checklist</mat-icon>
          Checkliste vor Abschluss
        </h3>

        <!-- Seriennummer Eingabe -->
        <div class="serial-number-section">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Seriennummer(n) der versendeten Adapter</mat-label>
            <textarea
              matInput
              [(ngModel)]="serialNumbers"
              placeholder="z.B. SN-2024-001, SN-2024-002"
              rows="2"></textarea>
            <mat-hint>Mehrere Seriennummern mit Komma trennen</mat-hint>
          </mat-form-field>
        </div>

        <!-- Checkbox: Excel aktualisiert -->
        <div class="checklist-item" [class.checked]="excelUpdated">
          <mat-checkbox [(ngModel)]="excelUpdated" color="primary">
            <div class="checkbox-content">
              <mat-icon>table_chart</mat-icon>
              <span>Verkaufs-Excel-Tabelle aktualisiert</span>
            </div>
          </mat-checkbox>
          <div class="excel-actions">
            <button
              mat-stroked-button
              color="primary"
              (click)="copyExcelData()"
              [disabled]="excelDataCopied"
              matTooltip="Daten für Excel in die Zwischenablage kopieren">
              <mat-icon>{{ excelDataCopied ? 'check' : 'content_copy' }}</mat-icon>
              {{ excelDataCopied ? 'Kopiert!' : 'Daten kopieren' }}
            </button>
            <a
              mat-stroked-button
              color="accent"
              [href]="salesExcelUrl"
              target="_blank"
              rel="noopener"
              *ngIf="salesExcelUrl"
              matTooltip="Excel-Tabelle öffnen">
              <mat-icon>open_in_new</mat-icon>
              Excel öffnen
            </a>
          </div>
        </div>

        <!-- Checkbox: Email versendet -->
        <div class="checklist-item" [class.checked]="emailSent">
          <mat-checkbox [(ngModel)]="emailSent" color="primary">
            <div class="checkbox-content">
              <mat-icon>email</mat-icon>
              <span>Versand-E-Mail an Kunden gesendet</span>
            </div>
          </mat-checkbox>

          <!-- Email senden Button -->
          <button
            mat-stroked-button
            color="primary"
            class="send-email-btn"
            [disabled]="!renderedEmail || loading"
            (click)="openEmailProgram()">
            <mat-icon>open_in_new</mat-icon>
            E-Mail Programm öffnen
          </button>
        </div>
      </div>

      <!-- Excel Data Preview -->
      <div class="excel-preview" *ngIf="excelDataCopied">
        <div class="excel-preview-header">
          <mat-icon>table_chart</mat-icon>
          <span>Kopierte Daten (Tab-separiert für Excel):</span>
        </div>
        <div class="excel-preview-content">{{ excelDataPreview }}</div>
      </div>

      <mat-divider></mat-divider>

      <!-- Email Preview (collapsible) -->
      <div class="email-preview-section">
        <button mat-button (click)="showEmailPreview = !showEmailPreview" class="toggle-preview">
          <mat-icon>{{ showEmailPreview ? 'expand_less' : 'expand_more' }}</mat-icon>
          E-Mail Vorschau {{ showEmailPreview ? 'ausblenden' : 'anzeigen' }}
        </button>

        <div class="email-preview" *ngIf="showEmailPreview">
          <!-- Template Selection -->
          <div class="template-selection" *ngIf="!loading">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>E-Mail Template</mat-label>
              <mat-select [(value)]="selectedTemplateId" (selectionChange)="onTemplateChange()">
                <mat-option *ngFor="let template of availableTemplates" [value]="template.id">
                  {{ template.language_display }} - {{ template.name }}
                  <span *ngIf="template.is_default" class="default-badge">Standard</span>
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Loading -->
          <div class="loading-container" *ngIf="loading">
            <mat-spinner diameter="32"></mat-spinner>
          </div>

          <!-- Preview Content -->
          <div *ngIf="renderedEmail && !loading" class="preview-content">
            <div class="preview-field">
              <span class="field-label">Betreff:</span>
              <div class="field-value subject">{{ renderedEmail.subject }}</div>
            </div>
            <div class="preview-field">
              <span class="field-label">Text:</span>
              <div class="field-value body">{{ renderedEmail.body }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Validation Message -->
      <div class="validation-message" *ngIf="!canComplete">
        <mat-icon>info</mat-icon>
        <span>Bitte alle Punkte abhaken und Seriennummer(n) eintragen, um die Bestellung abzuschließen.</span>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        Abbrechen
      </button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!canComplete || updatingStatus"
        (click)="onCompleteOrder()">
        <mat-icon *ngIf="!updatingStatus">check_circle</mat-icon>
        <mat-spinner *ngIf="updatingStatus" diameter="20"></mat-spinner>
        {{ updatingStatus ? 'Wird abgeschlossen...' : 'Bestellung abschließen' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      padding: 20px 24px;
      background: linear-gradient(135deg, #4caf50 0%, #43a047 100%);
      color: white;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
    }

    mat-dialog-content {
      padding: 24px !important;
      min-width: 550px;
      max-height: 75vh;
    }

    .order-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 16px;

      .customer-info {
        display: flex;
        align-items: center;
        gap: 12px;

        mat-icon {
          color: #1976d2;
          font-size: 32px;
          width: 32px;
          height: 32px;
        }

        strong {
          display: block;
          font-size: 16px;
          color: #333;
        }

        .email {
          font-size: 13px;
          color: #666;
        }
      }

      .country-info {
        font-size: 18px;
      }
    }

    mat-divider {
      margin: 20px 0;
    }

    .checklist-section {
      h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 600;
        color: #333;

        mat-icon {
          color: #1976d2;
        }
      }
    }

    .serial-number-section {
      margin-bottom: 20px;

      .full-width {
        width: 100%;
      }
    }

    .checklist-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: #fafafa;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 12px;
      transition: all 0.2s ease;

      &.checked {
        background: #e8f5e9;
        border-color: #4caf50;
      }

      .checkbox-content {
        display: flex;
        align-items: center;
        gap: 12px;

        mat-icon {
          color: #666;
        }

        span {
          font-size: 15px;
        }
      }

      &.checked .checkbox-content mat-icon {
        color: #4caf50;
      }

      .send-email-btn {
        margin-left: 16px;
      }

      .excel-actions {
        display: flex;
        gap: 8px;
        margin-left: auto;

        button, a {
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }
      }
    }

    .excel-preview {
      margin-top: 16px;
      padding: 12px;
      background: #e3f2fd;
      border: 1px solid #1976d2;
      border-radius: 8px;

      .excel-preview-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 13px;
        font-weight: 500;
        color: #1565c0;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .excel-preview-content {
        font-size: 12px;
        color: #333;
        font-family: monospace;
        white-space: nowrap;
        overflow-x: auto;
        padding: 8px;
        background: white;
        border-radius: 4px;
        border: 1px solid #e0e0e0;
      }
    }

    .email-preview-section {
      margin-top: 8px;

      .toggle-preview {
        width: 100%;
        justify-content: flex-start;
        color: #666;
      }
    }

    .email-preview {
      background: #fafafa;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      margin-top: 12px;

      .template-selection {
        margin-bottom: 16px;

        .full-width {
          width: 100%;
        }

        .default-badge {
          background: #4caf50;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          margin-left: 8px;
          text-transform: uppercase;
        }
      }

      .loading-container {
        display: flex;
        justify-content: center;
        padding: 20px;
      }

      .preview-content {
        .preview-field {
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }

          .field-label {
            display: block;
            font-size: 11px;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }

          .field-value {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            padding: 10px;
            font-size: 13px;

            &.subject {
              font-weight: 500;
            }

            &.body {
              white-space: pre-wrap;
              font-family: inherit;
              line-height: 1.5;
              max-height: 150px;
              overflow-y: auto;
            }
          }
        }
      }
    }

    .validation-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #fff3e0;
      border: 1px solid #ffb74d;
      border-radius: 8px;
      color: #e65100;
      margin-top: 16px;

      mat-icon {
        flex-shrink: 0;
      }

      span {
        font-size: 14px;
        line-height: 1.4;
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;

      button {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }
  `]
})
export class CompleteOrderDialogComponent implements OnInit {
  private emailTemplateService = inject(EmailTemplateService);
  private shopbridgeService = inject(ShopbridgeOrdersService);
  private snackBar = inject(MatSnackBar);

  // Loading states
  loading = true;
  updatingStatus = false;

  // Email template
  availableTemplates: EmailTemplate[] = [];
  selectedTemplateId: number | null = null;
  detectedLanguage = 'en';
  renderedEmail: EmailTemplateRenderResponse | null = null;
  senderEmail = '';

  // Checklist state
  serialNumbers = '';
  excelUpdated = false;
  emailSent = false;
  showEmailPreview = false;

  // Excel state
  salesExcelUrl = '';
  excelDataCopied = false;
  excelDataPreview = '';

  // Computed property for validation
  get canComplete(): boolean {
    return this.serialNumbers.trim().length > 0 &&
           this.excelUpdated &&
           this.emailSent;
  }

  // Country flags mapping
  private countryFlags: Record<string, string> = {
    'DE': '🇩🇪', 'AT': '🇦🇹', 'CH': '🇨🇭', 'LI': '🇱🇮', 'LU': '🇱🇺',
    'GB': '🇬🇧', 'US': '🇺🇸', 'CA': '🇨🇦', 'AU': '🇦🇺', 'NZ': '🇳🇿',
    'IE': '🇮🇪', 'ZA': '🇿🇦', 'IN': '🇮🇳', 'SG': '🇸🇬',
    'FR': '🇫🇷', 'BE': '🇧🇪', 'MC': '🇲🇨',
    'ES': '🇪🇸', 'MX': '🇲🇽', 'AR': '🇦🇷', 'CL': '🇨🇱', 'CO': '🇨🇴',
    'IT': '🇮🇹', 'SM': '🇸🇲', 'VA': '🇻🇦',
    'NL': '🇳🇱', 'PL': '🇵🇱', 'CZ': '🇨🇿', 'SE': '🇸🇪', 'NO': '🇳🇴',
    'DK': '🇩🇰', 'FI': '🇫🇮', 'PT': '🇵🇹', 'GR': '🇬🇷', 'JP': '🇯🇵',
    'CN': '🇨🇳', 'KR': '🇰🇷', 'BR': '🇧🇷', 'RU': '🇷🇺'
  };

  constructor(
    public dialogRef: MatDialogRef<CompleteOrderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CompleteOrderDialogData
  ) {}

  ngOnInit(): void {
    this.loadSenderConfig();
    this.loadSalesExcelUrl();
    this.detectLanguageAndLoadTemplates();
  }

  loadSenderConfig(): void {
    this.emailTemplateService.getSenderConfig().subscribe({
      next: (config) => {
        this.senderEmail = config.sender_email;
      },
      error: () => {
        this.senderEmail = '';
      }
    });
  }

  loadSalesExcelUrl(): void {
    this.shopbridgeService.getSalesExcelUrl().subscribe({
      next: (config) => {
        this.salesExcelUrl = config.excel_url;
      },
      error: () => {
        this.salesExcelUrl = '';
      }
    });
  }

  detectLanguageAndLoadTemplates(): void {
    this.loading = true;
    this.emailTemplateService.getLanguageForCountry(this.data.billingCountry).subscribe({
      next: (result) => {
        this.detectedLanguage = result.language;
        this.loadTemplates();
      },
      error: () => {
        this.detectedLanguage = 'en';
        this.loadTemplates();
      }
    });
  }

  loadTemplates(): void {
    this.emailTemplateService.getTemplates({ active: true }).subscribe({
      next: (templates) => {
        this.availableTemplates = templates;

        const defaultTemplate = templates.find(
          t => t.language === this.detectedLanguage && t.is_default
        );
        const anyLanguageTemplate = templates.find(
          t => t.language === this.detectedLanguage
        );
        const englishTemplate = templates.find(
          t => t.language === 'en' && t.is_default
        );

        const selectedTemplate = defaultTemplate || anyLanguageTemplate || englishTemplate;

        if (selectedTemplate) {
          this.selectedTemplateId = selectedTemplate.id;
          this.renderTemplate();
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error loading templates:', err);
        this.loading = false;
        this.snackBar.open('Fehler beim Laden der Templates', 'Schließen', {
          duration: 5000
        });
      }
    });
  }

  onTemplateChange(): void {
    if (this.selectedTemplateId) {
      this.renderTemplate();
    }
  }

  renderTemplate(): void {
    if (!this.selectedTemplateId) return;

    this.loading = true;

    const request = {
      template_id: this.selectedTemplateId,
      email: this.data.customerEmail || '',
      first_name: this.data.customerFirstName || '',
      last_name: this.data.customerLastName || '',
      order_number: String(this.data.orderNumber || ''),
      company_name: this.data.customerCompany || ''
    };

    this.emailTemplateService.renderTemplate(request).subscribe({
      next: (result) => {
        this.renderedEmail = result;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error rendering template:', err);
        this.loading = false;
        this.snackBar.open('Fehler beim Rendern des Templates', 'Schließen', {
          duration: 5000
        });
      }
    });
  }

  getCountryFlag(countryCode: string): string {
    return this.countryFlags[countryCode?.toUpperCase()] || '🌍';
  }

  openEmailProgram(): void {
    if (!this.renderedEmail) return;
    window.location.href = this.renderedEmail.mailto_link;
  }

  /**
   * Generiert Tab-separierte Daten für Excel und kopiert sie in die Zwischenablage.
   * Spalten: Version, Bestelldatum, Preis, Versand, Versandkosten, PayPal-Kosten,
   *          gezahlt, Einnahme, ebay, privat, SD-Link, Käufer, Käufer Firma,
   *          Straße, PLZ + ORT, email
   */
  copyExcelData(): void {
    const orderDate = this.formatDateForExcel(this.data.dateCreated);
    const shippingDate = this.formatDateForExcel(new Date().toISOString()); // Heute als Versanddatum

    // Preis aus Bestellung (Gesamtpreis - Versand)
    const total = parseFloat(this.data.orderTotal) || 0;
    const shipping = parseFloat(this.data.shippingTotal) || 0;
    const productPrice = total - shipping;

    // PayPal-Kosten berechnen (ca. 3.49% + 0.35€ für Standard-Transaktionen)
    const paypalFee = this.calculatePayPalFee(total);

    // Nettoeinnahme
    const netIncome = total - paypalFee;

    // Version aus Line Items ermitteln (erster Artikel mit V im Namen)
    const version = this.extractVersion();

    // Käufer-Name
    const buyerName = `${this.data.customerFirstName} ${this.data.customerLastName}`.trim();

    // PLZ + ORT
    const plzOrt = `${this.data.billingPostcode} ${this.data.billingCity}`.trim();

    // Ob eBay oder privat (basierend auf payment_method oder leer lassen)
    const isEbay = ''; // Manuell eintragen
    const isPrivat = ''; // leer lassen

    // Default: SD-Link
    const sdLink = 'x';

    // Daten-Array für Tab-Separation
    // Spalten: Version, Bestelldatum, Preis, Versand, Versandkosten, PayPal-Kosten,
    //          gezahlt, Einnahme, ebay, privat, SD-Link, Käufer, Käufer Firma,
    //          Straße, PLZ + ORT, email
    const excelData = [
      version,                                    // Version
      orderDate,                                  // Bestelldatum
      this.formatCurrencyForExcel(productPrice), // Preis
      shippingDate,                              // Versand (Versanddatum)
      this.formatCurrencyForExcel(shipping),    // Versandkosten
      this.formatCurrencyForExcel(paypalFee),   // PayPal-Kosten
      '1',                                       // gezahlt
      this.formatCurrencyForExcel(total),       // Einnahme (Gesamt gezahlt)
      isEbay,                                    // ebay
      isPrivat,                                  // privat
      sdLink,                                    // SD-Link
      buyerName,                                 // Käufer
      this.data.customerCompany || '',          // Käufer Firma
      this.data.billingStreet,                  // Straße
      plzOrt,                                    // PLZ + ORT
      this.data.customerEmail                   // email
    ];

    // Tab-separierter String
    const tabSeparated = excelData.join('\t');

    // In Zwischenablage kopieren
    navigator.clipboard.writeText(tabSeparated).then(() => {
      this.excelDataCopied = true;
      this.excelDataPreview = excelData.filter(d => d).join(' | ');
      this.snackBar.open('Daten in Zwischenablage kopiert!', 'OK', { duration: 3000 });

      // Nach 5 Sekunden den "Kopiert"-Status zurücksetzen
      setTimeout(() => {
        this.excelDataCopied = false;
      }, 5000);
    }).catch(err => {
      console.error('Fehler beim Kopieren:', err);
      this.snackBar.open('Fehler beim Kopieren in die Zwischenablage', 'Schließen', { duration: 5000 });
    });
  }

  private formatDateForExcel(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE'); // Format: 27.11.2025
  }

  private formatCurrencyForExcel(value: number): string {
    // Format für Excel: "200,00 €"
    return value.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' €';
  }

  private calculatePayPalFee(total: number): number {
    // PayPal Standard: 2.99% + 0.35€ (für EU-Transaktionen)
    // Oder 3.49% + 0.35€ für Standard-Transaktionen
    const feePercent = 0.0349;
    const fixedFee = 0.35;
    return total * feePercent + fixedFee;
  }

  private extractVersion(): string {

    return 'V1.x'; // Platzhalter-Implementierung
  }

  onCompleteOrder(): void {
    if (!this.canComplete) return;

    this.updatingStatus = true;

    // Erst Seriennummern speichern
    const serialNumberList = this.serialNumbers.split(',').map(s => s.trim()).filter(s => s);

    this.shopbridgeService.saveSerialNumbers(
      this.data.orderId,
      this.data.orderNumber,
      serialNumberList
    ).subscribe({
      next: () => {
        // Dann Status auf completed setzen
        this.shopbridgeService.updateOrderStatus(this.data.orderId, 'completed').subscribe({
          next: () => {
            this.updatingStatus = false;
            this.snackBar.open('Bestellung erfolgreich abgeschlossen!', 'OK', {
              duration: 4000
            });
            this.dialogRef.close({
              completed: true,
              email: this.data.customerEmail,
              serialNumbers: serialNumberList,
              statusUpdated: true
            });
          },
          error: (err) => {
            this.updatingStatus = false;
            console.error('Error updating order status:', err);
            this.snackBar.open(
              'Fehler beim Abschließen der Bestellung',
              'Schließen',
              { duration: 5000 }
            );
          }
        });
      },
      error: (err) => {
        this.updatingStatus = false;
        console.error('Error saving serial numbers:', err);
        this.snackBar.open(
          'Fehler beim Speichern der Seriennummern',
          'Schließen',
          { duration: 5000 }
        );
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
