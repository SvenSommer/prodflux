// src/app/features/products/product-form.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ProductsService, Product } from './products.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent {
  private route = inject(ActivatedRoute);
  private productsService = inject(ProductsService);
  private router = inject(Router);

  productId: number | null = null;
  product: Omit<Product, 'id'> = {
    bezeichnung: '',
    menge: 1,
    preis: 0,
    g_preis_brutto: 0,
    netto: 0
  };

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.productId = +idParam;
      this.productsService.getProduct(this.productId).subscribe(p => {
        this.product = { ...p };
      });
    }
  }

  save() {
    if (this.productId) {
      this.productsService.updateProduct(this.productId, this.product).subscribe(() => {
        this.router.navigate(['/products', this.productId]);
      });
    } else {
      this.productsService.createProduct(this.product).subscribe(p => {
        this.router.navigate(['/products', p.id]);
      });
    }
  }
}
