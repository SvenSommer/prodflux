import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import {
  ProductManualService,
  ProductManual,
  OrderManualsResponse
} from '../../../settings/product-manual.service';

@Component({
  selector: 'app-shopbridge-order-manuals-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  template: `
    <mat-card class="manuals-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>menu_book</mat-icon>
          Handbücher zum Ausdruck
        </mat-card-title>
        <span class="language-info" *ngIf="manualsData">
          <mat-icon>language</mat-icon>
          {{ getLanguageName(manualsData.language) }}
          ({{ manualsData.country_code }})
        </span>
      </mat-card-header>
      <mat-card-content>
        <!-- Loading State -->
        <div *ngIf="loading" class="loading-state">
          <mat-spinner diameter="32"></mat-spinner>
          <span>Handbücher werden geladen...</span>
        </div>

        <!-- Error State -->
        <div *ngIf="error && !loading" class="error-state">
          <mat-icon>warning</mat-icon>
          <span>{{ error }}</span>
        </div>

        <!-- No Manuals -->
        <div *ngIf="!loading && !error && manuals.length === 0" class="no-manuals">
          <mat-icon>info</mat-icon>
          <span>Keine Handbücher für diese Bestellung gefunden.</span>
        </div>

        <!-- Manuals List -->
        <div *ngIf="!loading && !error && manuals.length > 0" class="manuals-list">
          <div class="manuals-grid">
            <a
              *ngFor="let manual of manuals"
              [href]="manual.pdf_url"
              target="_blank"
              rel="noopener"
              class="manual-item"
              [matTooltip]="manual.title">
              <div class="manual-icon">
                <mat-icon>picture_as_pdf</mat-icon>
              </div>
              <div class="manual-info">
                <span class="manual-title">{{ manual.title }}</span>
                <span class="manual-type">{{ manual.manual_type_display }}</span>
              </div>
              <mat-icon class="open-icon">open_in_new</mat-icon>
            </a>
          </div>

          <!-- Print All Button -->
          <div class="print-actions" *ngIf="manuals.length > 1">
            <button mat-stroked-button color="primary" (click)="openAllManuals()">
              <mat-icon>print</mat-icon>
              Alle {{ manuals.length }} PDFs öffnen
            </button>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .manuals-card {
      mat-card-header {
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;

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

        .language-info {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: #666;
          background: #f5f5f5;
          padding: 4px 8px;
          border-radius: 4px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
      }

      .loading-state,
      .error-state,
      .no-manuals {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        color: #666;
      }

      .error-state {
        color: #c62828;
        background: #ffebee;
        border-radius: 4px;

        mat-icon {
          color: #c62828;
        }
      }

      .no-manuals {
        background: #f5f5f5;
        border-radius: 4px;

        mat-icon {
          color: #9e9e9e;
        }
      }

      .manuals-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .manuals-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .manual-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
        text-decoration: none;
        color: inherit;
        transition: all 0.2s ease;

        &:hover {
          background: #e3f2fd;
          border-color: #1976d2;
          box-shadow: 0 2px 8px rgba(25, 118, 210, 0.15);

          .open-icon {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .manual-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: #c62828;
          border-radius: 8px;
          flex-shrink: 0;

          mat-icon {
            color: white;
            font-size: 24px;
            width: 24px;
            height: 24px;
          }
        }

        .manual-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;

          .manual-title {
            font-size: 14px;
            font-weight: 500;
            color: #333;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .manual-type {
            font-size: 12px;
            color: #666;
          }
        }

        .open-icon {
          color: #1976d2;
          opacity: 0;
          transform: translateX(-4px);
          transition: all 0.2s ease;
        }
      }

      .print-actions {
        padding-top: 8px;
        border-top: 1px solid #e0e0e0;

        button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
      }
    }
  `]
})
export class ShopbridgeOrderManualsCardComponent implements OnInit, OnChanges {
  @Input() orderId!: number;

  private manualService = inject(ProductManualService);

  loading = false;
  error: string | null = null;
  manuals: ProductManual[] = [];
  manualsData: OrderManualsResponse | null = null;

  private languageNames: Record<string, string> = {
    'de': 'Deutsch',
    'en': 'English',
    'fr': 'Français',
    'es': 'Español',
  };

  ngOnInit() {
    this.loadManuals();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['orderId'] && !changes['orderId'].firstChange) {
      this.loadManuals();
    }
  }

  loadManuals() {
    if (!this.orderId) return;

    this.loading = true;
    this.error = null;

    this.manualService.getManualsForOrder(this.orderId).subscribe({
      next: (response) => {
        this.manualsData = response;
        this.manuals = response.manuals;
        this.loading = false;
      },
      error: (err) => {
        console.error('Fehler beim Laden der Handbücher:', err);
        this.error = 'Handbücher konnten nicht geladen werden.';
        this.loading = false;
      }
    });
  }

  getLanguageName(code: string): string {
    return this.languageNames[code] || code.toUpperCase();
  }

  openAllManuals() {
    // Öffne alle PDFs in neuen Tabs
    for (const manual of this.manuals) {
      window.open(manual.pdf_url, '_blank');
    }
  }
}
