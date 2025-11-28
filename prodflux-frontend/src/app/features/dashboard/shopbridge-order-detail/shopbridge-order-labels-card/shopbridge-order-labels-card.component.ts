import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { DHLService, StoredLabel } from '../../dhl.service';

@Component({
  selector: 'app-shopbridge-order-labels-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
  ],
  template: `
    <mat-card class="labels-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>local_shipping</mat-icon>
          Versandlabels
          <span class="label-count" *ngIf="labels.length > 0">({{ labels.length }})</span>
        </mat-card-title>
        <button 
          mat-stroked-button 
          color="primary" 
          (click)="createLabel.emit()"
          class="create-btn">
          <mat-icon>add</mat-icon>
          Neues Label
        </button>
      </mat-card-header>
      
      <mat-card-content>
        <!-- Loading State -->
        <div *ngIf="loading" class="loading-state">
          <mat-spinner diameter="32"></mat-spinner>
          <span>Labels werden geladen...</span>
        </div>

        <!-- No Labels -->
        <div *ngIf="!loading && labels.length === 0" class="no-labels">
          <mat-icon>label_off</mat-icon>
          <p>Noch keine Versandlabels erstellt</p>
          <button mat-raised-button color="primary" (click)="createLabel.emit()">
            <mat-icon>add</mat-icon>
            Label erstellen
          </button>
        </div>

        <!-- Labels List -->
        <div *ngIf="!loading && labels.length > 0" class="labels-list">
          <div *ngFor="let label of labels" class="label-item">
            <div class="label-icon" [class.printed]="label.status === 'printed'">
              <mat-icon>{{ label.status === 'printed' ? 'check_circle' : 'local_shipping' }}</mat-icon>
            </div>
            
            <div class="label-info">
              <div class="label-header">
                <span class="shipment-number">{{ label.shipment_number }}</span>
                <span class="label-product">{{ getProductName(label.product) }}</span>
              </div>
              <div class="label-details">
                <span class="label-date">{{ formatDate(label.created_at) }}</span>
                <span *ngIf="label.status === 'printed'" class="printed-badge">
                  <mat-icon>print</mat-icon> Gedruckt
                </span>
              </div>
            </div>

            <div class="label-actions">
              <button 
                mat-icon-button 
                matTooltip="Label drucken"
                color="primary"
                (click)="printLabel(label)"
                [disabled]="labelLoading[label.id]">
                <mat-icon>print</mat-icon>
              </button>
              
              <button 
                mat-icon-button
                matTooltip="Anzeigen"
                (click)="openLabel(label)"
                [disabled]="labelLoading[label.id]">
                <mat-icon>open_in_new</mat-icon>
              </button>
              
              <button 
                mat-icon-button 
                matTooltip="Herunterladen"
                (click)="downloadLabel(label)"
                [disabled]="labelLoading[label.id]">
                <mat-icon>download</mat-icon>
              </button>
              
              <button 
                mat-icon-button 
                matTooltip="Löschen"
                color="warn"
                (click)="deleteLabel(label)"
                [disabled]="labelLoading[label.id]">
                <mat-icon>delete</mat-icon>
              </button>
              
              <mat-spinner 
                *ngIf="labelLoading[label.id]" 
                diameter="24" 
                class="action-spinner">
              </mat-spinner>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .labels-card {
      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 500;
          margin: 0;

          mat-icon {
            color: #1976d2;
          }

          .label-count {
            font-size: 14px;
            color: #666;
            font-weight: normal;
          }
        }

        .create-btn {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 32px;
      color: #666;
    }

    .no-labels {
      text-align: center;
      padding: 32px;
      color: #666;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #ccc;
        margin-bottom: 12px;
      }

      p {
        margin: 0 0 16px 0;
        font-size: 14px;
      }
    }

    .labels-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .label-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      transition: all 0.2s ease;

      &:hover {
        background: #e3f2fd;
        border-color: #1976d2;
      }

      .label-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: #1976d2;
        border-radius: 8px;
        flex-shrink: 0;

        mat-icon {
          color: white;
        }

        &.printed {
          background: #2e7d32;
        }
      }

      .label-info {
        flex: 1;
        min-width: 0;

        .label-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;

          .shipment-number {
            font-weight: 600;
            font-size: 14px;
            color: #333;
            font-family: monospace;
          }

          .label-product {
            font-size: 12px;
            color: #1976d2;
            background: #e3f2fd;
            padding: 2px 8px;
            border-radius: 4px;
          }
        }

        .label-details {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: #666;

          .printed-badge {
            display: flex;
            align-items: center;
            gap: 4px;
            color: #2e7d32;

            mat-icon {
              font-size: 14px;
              width: 14px;
              height: 14px;
            }
          }
        }
      }

      .label-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;

        .action-spinner {
          margin: 12px;
        }
      }
    }
  `],
})
export class ShopbridgeOrderLabelsCardComponent implements OnInit {
  private dhlService = inject(DHLService);
  private snackBar = inject(MatSnackBar);

  @Input() orderId!: number;
  @Output() createLabel = new EventEmitter<void>();
  @Output() labelsChanged = new EventEmitter<StoredLabel[]>();

  labels: StoredLabel[] = [];
  loading = false;
  labelLoading: Record<number, boolean> = {};

  private productNames: Record<string, string> = {
    'V62KP': 'DHL Kleinpaket',
    'V01PAK': 'DHL Paket',
    'V62WP': 'Warenpost',
    'V66WPI': 'Warenpost Int.',
  };

  ngOnInit(): void {
    this.loadLabels();
  }

  loadLabels(): void {
    if (!this.orderId) return;

    this.loading = true;
    this.dhlService.getLabelsByOrder(this.orderId).subscribe({
      next: (response) => {
        this.labels = response.labels;
        this.loading = false;
        this.labelsChanged.emit(this.labels);
      },
      error: (err) => {
        console.error('Error loading labels:', err);
        this.loading = false;
      },
    });
  }

  getProductName(code: string): string {
    return this.productNames[code] || code;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  printLabel(label: StoredLabel): void {
    this.labelLoading[label.id] = true;

    this.dhlService.getLabelPdf(label.id).subscribe({
      next: (response) => {
        this.labelLoading[label.id] = false;

        // Convert base64 to blob and print
        const byteCharacters = atob(response.label_b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        // Open in iframe and print
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);

        iframe.onload = () => {
          setTimeout(() => {
            iframe.contentWindow?.print();
            // Mark as printed
            this.dhlService.markLabelPrinted(label.id).subscribe({
              next: () => {
                label.status = 'printed';
                label.printed_at = new Date().toISOString();
              },
            });
            // Clean up after printing
            setTimeout(() => {
              document.body.removeChild(iframe);
              URL.revokeObjectURL(url);
            }, 1000);
          }, 500);
        };

        this.snackBar.open('Druckdialog wird geöffnet...', '', { duration: 2000 });
      },
      error: (err) => {
        this.labelLoading[label.id] = false;
        this.snackBar.open('Fehler beim Laden des Labels', 'OK', { duration: 3000 });
      },
    });
  }

  openLabel(label: StoredLabel): void {
    this.labelLoading[label.id] = true;

    this.dhlService.getLabelPdf(label.id).subscribe({
      next: (response) => {
        this.labelLoading[label.id] = false;
        this.dhlService.openLabel(response.label_b64);
      },
      error: (err) => {
        this.labelLoading[label.id] = false;
        this.snackBar.open('Fehler beim Laden des Labels', 'OK', { duration: 3000 });
      },
    });
  }

  downloadLabel(label: StoredLabel): void {
    this.labelLoading[label.id] = true;

    this.dhlService.getLabelPdf(label.id).subscribe({
      next: (response) => {
        this.labelLoading[label.id] = false;
        const filename = `DHL-Label-${label.shipment_number}.pdf`;
        this.dhlService.downloadLabel(response.label_b64, filename);
      },
      error: (err) => {
        this.labelLoading[label.id] = false;
        this.snackBar.open('Fehler beim Laden des Labels', 'OK', { duration: 3000 });
      },
    });
  }

  deleteLabel(label: StoredLabel): void {
    if (!confirm(`Label ${label.shipment_number} wirklich löschen? Dies kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    this.labelLoading[label.id] = true;

    this.dhlService.deleteShipment(label.shipment_number).subscribe({
      next: () => {
        this.labelLoading[label.id] = false;
        this.labels = this.labels.filter(l => l.id !== label.id);
        this.labelsChanged.emit(this.labels);
        this.snackBar.open(`Label ${label.shipment_number} gelöscht`, 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.labelLoading[label.id] = false;
        this.snackBar.open('Fehler beim Löschen des Labels', 'OK', { duration: 3000 });
      },
    });
  }
}
