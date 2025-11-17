// products-list.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductsService, Product } from './products.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Observable, map } from 'rxjs';

interface SeparatedProducts {
  active: Product[];
  deprecated: Product[];
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSlideToggleModule,
  ],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss'],
})
export class ProductsListComponent {
  private productsService = inject(ProductsService);
  includeDeprecated = false;
  
  products$: Observable<Product[]> = this.productsService.getProducts(this.includeDeprecated);

  get safeProducts(): Product[] {
    return this.productsSnapshot ?? [];
  }

  private productsSnapshot: Product[] | null = null;

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.products$ = this.productsService.getProducts(this.includeDeprecated);
    this.products$.subscribe(products => {
      this.productsSnapshot = products;
    });
  }

  onDeprecatedToggle() {
    this.loadProducts();
  }

  separateProductsByStatus(products: Product[]): SeparatedProducts {
    return {
      active: products.filter(p => !p.deprecated),
      deprecated: products.filter(p => p.deprecated)
    };
  }
}
