// product-overview.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ProductLifecycleEntry } from '../workshop.service';

@Component({
  selector: 'app-product-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    RouterModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './product-overview.component.html',
  styleUrls: ['./product-overview.component.scss']
})
export class ProductOverviewComponent {
  @Input() products: ProductLifecycleEntry[] = [];
  @Output() planMultiOrder = new EventEmitter<void>();
  @Output() openOrder = new EventEmitter<ProductLifecycleEntry>();
  @Output() openSell = new EventEmitter<ProductLifecycleEntry>();
  @Output() manufacture = new EventEmitter<{ product: ProductLifecycleEntry, quantity: number }>();

  selectedProduct: ProductLifecycleEntry | null = null;
  manufactureQty = 1;

  confirmManufacture() {
    if (!this.selectedProduct || this.manufactureQty < 1) return;
    this.manufacture.emit({
      product: this.selectedProduct,
      quantity: this.manufactureQty
    });
    this.manufactureQty = 1;
  }
}
