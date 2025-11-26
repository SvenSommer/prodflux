import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export interface PriceData {
  netto: number;
  mwst_satz: number;
  brutto?: number; // Calculated
}

/**
 * Wiederverwendbare Komponente für Preiseingaben mit MwSt.-Berechnung
 * 
 * Features:
 * - Eingabe von Netto-Preis
 * - Auswahl des MwSt.-Satzes (19%, 7%, 0%)
 * - Automatische Berechnung und Anzeige von Brutto
 * - Kann als FormControl verwendet werden
 * 
 * @example
 * <app-price-input 
 *   [(value)]="priceData"
 *   [label]="'Preis pro Stück'"
 *   [required]="true">
 * </app-price-input>
 */
@Component({
  selector: 'app-price-input',
  standalone: true,
  templateUrl: './price-input.component.html',
  styleUrls: ['./price-input.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PriceInputComponent),
      multi: true
    }
  ]
})
export class PriceInputComponent implements ControlValueAccessor {
  @Input() label = 'Preis';
  @Input() required = false;
  @Input() disabled = false;

  netto = 0;
  mwst_satz = 19; // Standard MwSt.-Satz in Deutschland

  // Standard MwSt.-Sätze
  mwstOptions = [
    { value: 19, label: '19% (Regelsteuersatz)' },
    { value: 7, label: '7% (ermäßigt)' },
    { value: 0, label: '0% (steuerfrei)' },
  ];

  // ControlValueAccessor implementation
  private onChange: (value: PriceData) => void = () => {};
  private onTouched: () => void = () => {};

  get brutto(): number {
    return this.netto * (1 + this.mwst_satz / 100);
  }

  get mwstBetrag(): number {
    return this.netto * (this.mwst_satz / 100);
  }

  onNettoChange(): void {
    this.emitValue();
  }

  onMwstSatzChange(): void {
    this.emitValue();
  }

  private emitValue(): void {
    const value: PriceData = {
      netto: this.netto,
      mwst_satz: this.mwst_satz,
      brutto: this.brutto
    };
    this.onChange(value);
    this.onTouched();
  }

  // ControlValueAccessor methods
  writeValue(value: PriceData | null): void {
    if (value) {
      this.netto = value.netto || 0;
      this.mwst_satz = value.mwst_satz || 19;
    } else {
      this.netto = 0;
      this.mwst_satz = 19;
    }
  }

  registerOnChange(fn: (value: PriceData) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
