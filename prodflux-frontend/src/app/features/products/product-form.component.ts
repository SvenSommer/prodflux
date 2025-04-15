import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ProductsService, Product } from './products.service';
import { VersionsService, ProductVersion } from '../settings/versions.service';
import { VariantsService, ProductVariant } from '../settings/variants.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent {
  private route = inject(ActivatedRoute);
  private productsService = inject(ProductsService);
  private versionsService = inject(VersionsService);
  private variantsService = inject(VariantsService);
  private router = inject(Router);

  productId: number | null = null;
  currentImageUrl: string | null = null;
  newImagePreview: string | null = null;

  versions: ProductVersion[] = [];
  variants: ProductVariant[] = [];

  product = {
    bezeichnung: '',
    artikelnummer: '',
    version_id: null as number | null,
    varianten_ids: [] as number[],
    bild: null as File | null,
  };

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.versionsService.getAll().subscribe(v => (this.versions = v));
    this.variantsService.getAll().subscribe(v => (this.variants = v));

    if (idParam) {
      this.productId = +idParam;
      this.productsService.getProduct(this.productId).subscribe(p => {
        this.product.bezeichnung = p.bezeichnung;
        this.product.artikelnummer = p.artikelnummer;
        this.product.version_id = p.version?.id || null;
        this.product.varianten_ids = p.varianten?.map(v => v.id) || [];
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
      version_id: this.product.version_id,
      varianten_ids: this.product.varianten_ids,
      bild: this.product.bild || undefined,
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
