import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Order } from '../orders.service';

export interface ShippingCostChange {
  netto: number;
  mwst_satz: number;
}

@Component({
  selector: 'app-order-costs-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <mat-card class="costs-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>receipt_long</mat-icon>
          Kosten
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <!-- Header Row -->
        <div class="cost-header">
          <span class="label-column"></span>
          <span class="value-column">Netto</span>
          <span class="value-column">MwSt.</span>
          <span class="value-column">Brutto</span>
        </div>

        <!-- Materialkosten -->
        <div class="cost-row">
          <span class="label-column">Summe der Materialien</span>
          <span class="value-column">{{ formatCurrency(materialsNetto) }}</span>
          <span class="value-column">{{ formatCurrency(materialsMwst) }}</span>
          <span class="value-column">{{ formatCurrency(materialsBrutto) }}</span>
        </div>

        <!-- Versandkosten -->
        <div class="cost-row shipping-row" [class.edit-mode]="mode === 'edit'">
          <span class="label-column">Versandkosten</span>

          <!-- Edit Mode: Eingabefelder -->
          <ng-container *ngIf="mode === 'edit'; else viewShipping">
            <div class="value-column editable">
              <input
                type="number"
                class="inline-input"
                [ngModel]="editShippingNetto"
                (ngModelChange)="onShippingNettoChange($event)"
                step="0.01"
                min="0"
                placeholder="0,00"
              />
              <span class="currency-suffix">€</span>
            </div>
            <div class="value-column mwst-select">
              <select
                class="inline-select"
                [ngModel]="editMwstSatz"
                (ngModelChange)="onMwstSatzChange($event)"
              >
                <option [ngValue]="0">0%</option>
                <option [ngValue]="7">7%</option>
                <option [ngValue]="19">19%</option>
              </select>
            </div>
            <span class="value-column">{{ formatCurrency(calculatedShippingBrutto) }}</span>
          </ng-container>

          <!-- View Mode: Nur Anzeige -->
          <ng-template #viewShipping>
            <span class="value-column">{{ formatCurrency(shippingNetto) }}</span>
            <span class="value-column">{{ formatCurrency(shippingMwst) }}</span>
            <span class="value-column">{{ formatCurrency(shippingBrutto) }}</span>
          </ng-template>
        </div>

        <mat-divider class="total-divider"></mat-divider>

        <!-- Gesamtkosten -->
        <div class="cost-row total-row">
          <span class="label-column">Gesamtkosten</span>
          <span class="value-column">{{ formatCurrency(totalNetto) }}</span>
          <span class="value-column">{{ formatCurrency(totalMwst) }}</span>
          <span class="value-column">{{ formatCurrency(totalBrutto) }}</span>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .costs-card {
      height: 100%;
    }

    mat-card-header {
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 500;
      color: #333;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #1976d2;
      }
    }

    mat-card-content {
      padding: 16px;
    }

    .cost-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 12px;
      padding: 8px 0;
      margin-bottom: 8px;
      font-weight: 600;
      font-size: 13px;
      color: #666;
      text-transform: uppercase;
      border-bottom: 2px solid #e0e0e0;
    }

    .cost-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 12px;
      padding: 10px 0;
      font-size: 14px;
      border-bottom: 1px solid #f0f0f0;
      align-items: center;
    }

    .label-column {
      color: #333;
    }

    .value-column {
      text-align: right;
      color: #666;
      font-variant-numeric: tabular-nums;
    }

    // Edit Mode Styles
    .shipping-row.edit-mode {
      background-color: #f8f9fa;
      margin: 0 -16px;
      padding: 10px 16px;
      border-radius: 4px;
    }

    .value-column.editable {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
    }

    .inline-input {
      width: 80px;
      padding: 6px 8px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      font-size: 14px;
      text-align: right;
      font-variant-numeric: tabular-nums;
      background-color: white;
      transition: border-color 0.2s ease;

      &:focus {
        outline: none;
        border-color: #1976d2;
      }

      &::-webkit-inner-spin-button,
      &::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    }

    .currency-suffix {
      color: #666;
      font-size: 14px;
    }

    .value-column.mwst-select {
      display: flex;
      justify-content: flex-end;
    }

    .inline-select {
      padding: 6px 8px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      font-size: 14px;
      background-color: white;
      cursor: pointer;
      transition: border-color 0.2s ease;

      &:focus {
        outline: none;
        border-color: #1976d2;
      }
    }

    .total-divider {
      margin: 16px 0;
      border-top-width: 2px;
    }

    .total-row {
      font-size: 16px;
      border-bottom: none;

      .label-column {
        font-weight: 600;
        color: #1976d2;
      }

      .value-column {
        color: #333;

        &:last-child {
          font-weight: 600;
          color: #1976d2;
        }
      }
    }
  `]
})
export class OrderCostsCardComponent implements OnChanges {
  @Input() order!: Order;
  @Input() mode: 'view' | 'edit' = 'view';
  @Output() shippingCostChange = new EventEmitter<ShippingCostChange>();

  // Edit mode values
  editShippingNetto: number = 0;
  editMwstSatz: number = 19;

  // Cached values
  private _materialsNetto?: number;
  private _materialsMwst?: number;
  private _materialsBrutto?: number;
  private _shippingBrutto?: number;
  private _shippingNetto?: number;
  private _shippingMwst?: number;
  private _totalNetto?: number;
  private _totalMwst?: number;
  private _totalBrutto?: number;

  ngOnChanges() {
    // Reset cache when order changes
    this._materialsNetto = undefined;
    this._materialsMwst = undefined;
    this._materialsBrutto = undefined;
    this._shippingBrutto = undefined;
    this._shippingNetto = undefined;
    this._shippingMwst = undefined;
    this._totalNetto = undefined;
    this._totalMwst = undefined;
    this._totalBrutto = undefined;

    // Initialize edit values from order
    if (this.order && this.mode === 'edit') {
      // Calculate netto from brutto (versandkosten is stored as brutto)
      const brutto = this.order.versandkosten ?? 0;
      const mwstSatz = this.order.versandkosten_mwst_satz ?? 19;
      this.editMwstSatz = mwstSatz;
      this.editShippingNetto = brutto / (1 + (mwstSatz / 100));
    }
  }

  // Edit mode handlers
  onShippingNettoChange(value: number) {
    this.editShippingNetto = value || 0;
    this.emitShippingChange();
  }

  onMwstSatzChange(value: number) {
    this.editMwstSatz = value;
    this.emitShippingChange();
  }

  private emitShippingChange() {
    this.shippingCostChange.emit({
      netto: this.editShippingNetto,
      mwst_satz: this.editMwstSatz
    });
  }

  // Calculated brutto for edit mode
  get calculatedShippingBrutto(): number {
    return this.editShippingNetto * (1 + (this.editMwstSatz / 100));
  }

  // Materialkosten berechnet
  get materialsNetto(): number {
    if (this._materialsNetto !== undefined) return this._materialsNetto;

    if (!this.order?.items) {
      this._materialsNetto = 0;
      return 0;
    }

    this._materialsNetto = this.order.items.reduce((sum, item) => {
      return sum + (item.preis_pro_stueck * item.quantity);
    }, 0);

    return this._materialsNetto;
  }

  get materialsMwst(): number {
    if (this._materialsMwst !== undefined) return this._materialsMwst;

    if (!this.order?.items) {
      this._materialsMwst = 0;
      return 0;
    }

    this._materialsMwst = this.order.items.reduce((sum, item) => {
      const netto = item.preis_pro_stueck * item.quantity;
      const mwstSatz = item.mwst_satz ?? 19;
      return sum + (netto * (mwstSatz / 100));
    }, 0);

    return this._materialsMwst;
  }

  get materialsBrutto(): number {
    if (this._materialsBrutto !== undefined) return this._materialsBrutto;
    this._materialsBrutto = this.materialsNetto + this.materialsMwst;
    return this._materialsBrutto;
  }

  // Versandkosten - versandkosten ist bereits BRUTTO!
  get shippingBrutto(): number {
    if (this._shippingBrutto !== undefined) return this._shippingBrutto;
    // Sicherstellen, dass es eine Zahl ist
    const value = this.order?.versandkosten ?? 0;
    this._shippingBrutto = typeof value === 'string' ? parseFloat(value) : value;
    return this._shippingBrutto;
  }

  get shippingNetto(): number {
    if (this._shippingNetto !== undefined) return this._shippingNetto;

    const brutto = this.shippingBrutto;
    const mwstSatz = this.order?.versandkosten_mwst_satz ?? 19;
    this._shippingNetto = brutto / (1 + (mwstSatz / 100));

    return this._shippingNetto;
  }

  get shippingMwst(): number {
    if (this._shippingMwst !== undefined) return this._shippingMwst;
    this._shippingMwst = this.shippingBrutto - this.shippingNetto;
    return this._shippingMwst;
  }

  // Gesamtkosten - im Edit-Modus die editierten Werte verwenden
  get totalNetto(): number {
    if (this.mode === 'edit') {
      return this.materialsNetto + this.editShippingNetto;
    }
    if (this._totalNetto !== undefined) return this._totalNetto;
    this._totalNetto = this.materialsNetto + this.shippingNetto;
    return this._totalNetto;
  }

  get totalMwst(): number {
    if (this.mode === 'edit') {
      const editShippingMwst = this.editShippingNetto * (this.editMwstSatz / 100);
      return this.materialsMwst + editShippingMwst;
    }
    if (this._totalMwst !== undefined) return this._totalMwst;
    this._totalMwst = this.materialsMwst + this.shippingMwst;
    return this._totalMwst;
  }

  get totalBrutto(): number {
    if (this.mode === 'edit') {
      return this.materialsBrutto + this.calculatedShippingBrutto;
    }
    if (this._totalBrutto !== undefined) return this._totalBrutto;
    this._totalBrutto = this.materialsBrutto + this.shippingBrutto;
    return this._totalBrutto;
  }

  formatCurrency(value: any): string {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '—';
    return num.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' €';
  }
}
