import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

export interface ProductOption {
  id: number;
  label: string;
  imageUrl?: string | null;
}

@Component({
  selector: 'app-product-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './product-select.component.html',
  styleUrl: './product-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ProductSelectComponent),
      multi: true
    }
  ]
})
export class ProductSelectComponent implements ControlValueAccessor {
  @Input() products: ProductOption[] = [];
  @Input() label: string = 'Produkt wählen';
  @Input() placeholder: string = 'Produkt auswählen';
  @Input() required: boolean = false;
  @Input() appearance: 'fill' | 'outline' = 'outline';

  value: number | null = null;
  disabled: boolean = false;

  // ControlValueAccessor methods
  onChange: (value: number | null) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: number | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onValueChange(value: number | null): void {
    this.value = value;
    this.onChange(value);
    this.onTouched();
  }

  getSelectedProduct(): ProductOption | undefined {
    return this.products.find(p => p.id === this.value);
  }
}
