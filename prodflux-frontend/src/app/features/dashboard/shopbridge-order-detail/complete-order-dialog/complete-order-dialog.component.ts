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

import {
  EmailTemplateService,
  EmailTemplate,
  EmailTemplateRenderResponse
} from '../../email-template.service';

export interface CompleteOrderDialogData {
  orderId: number;
  orderNumber: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerCompany?: string;
  billingCountry: string;
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
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>send</mat-icon>
      Bestellung abschließen & E-Mail senden
    </h2>

    <mat-dialog-content>
      <!-- Order Info -->
      <div class="order-info">
        <div class="info-row">
          <span class="label">Bestellung:</span>
          <span class="value">#{{ data.orderNumber }}</span>
        </div>
        <div class="info-row">
          <span class="label">Kunde:</span>
          <span class="value">{{ data.customerFirstName }} {{ data.customerLastName }}</span>
        </div>
        <div class="info-row">
          <span class="label">E-Mail:</span>
          <span class="value email">{{ data.customerEmail }}</span>
        </div>
        <div class="info-row from-email">
          <span class="label">Absender:</span>
          <span class="value">{{ senderEmail || '(wird geladen...)' }}</span>
        </div>
        <div class="info-row">
          <span class="label">Land:</span>
          <span class="value">
            {{ getCountryFlag(data.billingCountry) }}
            {{ data.billingCountry }}
            <span class="language-hint">({{ detectedLanguage }})</span>
          </span>
        </div>
      </div>

      <mat-divider></mat-divider>

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
          <mat-hint>Sprache automatisch erkannt: {{ detectedLanguage }}</mat-hint>
        </mat-form-field>
      </div>

      <!-- Loading -->
      <div class="loading-container" *ngIf="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Template wird geladen...</p>
      </div>

      <!-- Email Preview -->
      <div class="email-preview" *ngIf="renderedEmail && !loading">
        <h3>
          <mat-icon>visibility</mat-icon>
          Vorschau
        </h3>

        <div class="preview-field">
          <span class="field-label">Betreff:</span>
          <div class="field-value subject">{{ renderedEmail.subject }}</div>
        </div>

        <div class="preview-field">
          <span class="field-label">Text:</span>
          <div class="field-value body">{{ renderedEmail.body }}</div>
        </div>
      </div>

      <!-- No Template Warning -->
      <div class="no-template-warning" *ngIf="!loading && !renderedEmail && availableTemplates.length === 0">
        <mat-icon>warning</mat-icon>
        <p>
          Kein E-Mail Template für die Sprache "{{ detectedLanguage }}" gefunden.
          <br>
          Bitte erstellen Sie ein Template in den Einstellungen.
        </p>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        Abbrechen
      </button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!renderedEmail || loading"
        (click)="onSendEmail()">
        <mat-icon>email</mat-icon>
        E-Mail Programm öffnen
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
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
      color: white;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
    }

    mat-dialog-content {
      padding: 24px !important;
      min-width: 500px;
      max-height: 70vh;
    }

    .order-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;

      .info-row {
        display: flex;
        gap: 12px;

        .label {
          font-weight: 600;
          color: #666;
          min-width: 80px;
        }

        .value {
          color: #333;

          &.email {
            font-family: monospace;
            background: #f5f5f5;
            padding: 2px 8px;
            border-radius: 4px;
          }
        }
      }

      .from-email {
        padding-top: 8px;
        border-top: 1px dashed #e0e0e0;
        margin-top: 8px;

        .value {
          color: #1976d2;
          font-weight: 500;

          .language-hint {
            color: #999;
            font-style: italic;
          }
        }
      }
    }

    mat-divider {
      margin: 16px 0;
    }

    .template-selection {
      margin: 20px 0;

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
      flex-direction: column;
      align-items: center;
      padding: 40px;
      color: #666;

      p {
        margin: 16px 0 0 0;
      }
    }

    .email-preview {
      background: #fafafa;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      margin-top: 16px;

      h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;

        mat-icon {
          color: #1976d2;
        }
      }

      .preview-field {
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }

        .field-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }

        .field-value {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 12px;

          &.subject {
            font-weight: 500;
          }

          &.body {
            white-space: pre-wrap;
            font-family: inherit;
            line-height: 1.6;
            max-height: 200px;
            overflow-y: auto;
          }
        }
      }
    }

    .no-template-warning {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      background: #fff3e0;
      border: 1px solid #ffb74d;
      border-radius: 8px;
      color: #e65100;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        flex-shrink: 0;
      }

      p {
        margin: 0;
        line-height: 1.6;
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
  private snackBar = inject(MatSnackBar);

  loading = true;
  availableTemplates: EmailTemplate[] = [];
  selectedTemplateId: number | null = null;
  detectedLanguage = 'en';
  renderedEmail: EmailTemplateRenderResponse | null = null;
  senderEmail = '';  // Dynamisch aus Config

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
    this.detectLanguageAndLoadTemplates();
  }

  loadSenderConfig(): void {
    this.emailTemplateService.getSenderConfig().subscribe({
      next: (config) => {
        this.senderEmail = config.sender_email;
      },
      error: () => {
        // Fallback - keep empty
        this.senderEmail = '';
      }
    });
  }

  detectLanguageAndLoadTemplates(): void {
    this.loading = true;

    // First, detect language for the country
    this.emailTemplateService.getLanguageForCountry(this.data.billingCountry).subscribe({
      next: (result) => {
        this.detectedLanguage = result.language;
        this.loadTemplates();
      },
      error: () => {
        // Fallback to English
        this.detectedLanguage = 'en';
        this.loadTemplates();
      }
    });
  }

  loadTemplates(): void {
    this.emailTemplateService.getTemplates({ active: true }).subscribe({
      next: (templates) => {
        this.availableTemplates = templates;

        // Find default template for detected language
        const defaultTemplate = templates.find(
          t => t.language === this.detectedLanguage && t.is_default
        );

        // Or any template for that language
        const anyLanguageTemplate = templates.find(
          t => t.language === this.detectedLanguage
        );

        // Or English fallback
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

    console.log('Render request:', request);

    this.emailTemplateService.renderTemplate(request).subscribe({
      next: (result) => {
        this.renderedEmail = result;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error rendering template:', err);
        console.error('Error details:', err.error);
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

  onSendEmail(): void {
    if (!this.renderedEmail) return;

    // Open mailto link
    window.location.href = this.renderedEmail.mailto_link;

    // Close dialog after short delay
    setTimeout(() => {
      this.dialogRef.close({ sent: true, email: this.data.customerEmail });
    }, 500);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
