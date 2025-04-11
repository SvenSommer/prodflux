// products-list.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductsService, Product } from './products.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss'],
})
export class ProductsListComponent {
  private productsService = inject(ProductsService);
  products$ = this.productsService.getProducts();


  get safeProducts(): Product[] {
    // `products$ | async` kann null sein → Fallback auf []
    return this.productsSnapshot ?? [];
  }

  private productsSnapshot: Product[] | null = null;

  ngOnInit() {
    this.products$.subscribe(products => {
      this.productsSnapshot = products;
    });
  }

}
