import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    RouterModule
  ],
  templateUrl: './product-overview.component.html',
  styleUrls: ['./product-overview.component.scss']
})
export class ProductOverviewComponent {
  @Input() products: ProductLifecycleEntry[] = [];
  @Output() planMultiOrder = new EventEmitter<void>();
  @Output() openOrder = new EventEmitter<ProductLifecycleEntry>();
  @Output() openSell = new EventEmitter<ProductLifecycleEntry>();
  @Output() openManufactureMenu = new EventEmitter<ProductLifecycleEntry>();
}
