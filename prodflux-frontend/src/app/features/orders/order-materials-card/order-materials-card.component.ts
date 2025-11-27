import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MaterialTableComponent, MaterialTableRow, MaterialTableColumn } from '../../../shared/components/material-table/material-table.component';

@Component({
  selector: 'app-order-materials-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MaterialTableComponent],
  template: `
    <mat-card class="materials-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>inventory_2</mat-icon>
          Bestellte Materialien
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <app-material-table
          [rows]="rows"
          [columns]="columns"
          [showImage]="true"
          [showCategory]="true">
          <ng-template #customColumn let-row let-column="column">
            @switch (column.key) {
              @case ('quantity') {
                {{ row.data.quantity | number:'1.0-2' }}
              }
              @case ('preis') {
                {{ formatCurrency(row.data.preis) }}
              }
              @case ('mwst') {
                {{ row.data.mwst }}%
              }
              @case ('gesamt_netto') {
                {{ formatCurrency(row.data.gesamt_netto) }}
              }
              @case ('brutto') {
                {{ formatCurrency(row.data.brutto) }}
              }
              @case ('gesamt_brutto') {
                <strong class="total-price">{{ formatCurrency(row.data.gesamt_brutto) }}</strong>
              }
              @case ('artikelnummer') {
                <span class="article-number">{{ row.data.artikelnummer }}</span>
              }
            }
          </ng-template>
        </app-material-table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .materials-card {
      mat-card-header {
        margin-bottom: 20px;

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

      mat-card-content {
        padding: 0;
      }
    }

    .total-price {
      color: #1976d2;
      font-weight: 600;
    }

    .article-number {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #666;
    }
  `]
})
export class OrderMaterialsCardComponent {
  @Input() rows: MaterialTableRow[] = [];
  @Input() columns: MaterialTableColumn[] = [];

  formatCurrency(value: any): string {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '—';
    return num.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' €';
  }
}
