// src/app/features/products/product-form.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ProductsService, Product } from './products.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent {
  private route = inject(ActivatedRoute);
  private productsService = inject(ProductsService);
  private router = inject(Router);

  productId: number | null = null
  currentImageUrl: string | null = null;
  newImagePreview: string | null = null;

  product = {
    bezeichnung: '',
    artikelnummer: '',
    version: '',
    bild: null as File | null
  };

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.productId = +idParam;
      this.productsService.getProduct(this.productId).subscribe(p => {
        this.product.bezeichnung = p.bezeichnung;
        this.product.artikelnummer = p.artikelnummer;
        this.product.version = p.version;
        this.currentImageUrl = p.bild || null;
      });
    }
  }


  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.product.bild = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.newImagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  save() {
    const payload = {
      bezeichnung: this.product.bezeichnung,
      artikelnummer: this.product.artikelnummer,
      version: this.product.version,
      bild: this.product.bild || undefined
    };

    if (this.productId) {
      this.productsService.updateProduct(this.productId, payload).subscribe(() => {
        this.router.navigate(['/products', this.productId]);
      });
    } else {
      this.productsService.createProduct(payload).subscribe(p => {
        this.router.navigate(['/products', p.id]);
      });
    }
  }
}
