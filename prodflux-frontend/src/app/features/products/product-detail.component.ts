import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductsService, Product, ProductMaterial } from './products.service';
import { FormsModule } from '@angular/forms';
import { MaterialsService, Material } from '../materials/materials.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-detail.component.html',
})
export class ProductDetailComponent {
  private route = inject(ActivatedRoute);
  private productsService = inject(ProductsService);
  private materialsService = inject(MaterialsService);
  private router = inject(Router);

  productId = Number(this.route.snapshot.paramMap.get('id'));
  product?: Product;
  materials: ProductMaterial[] = [];
  materialsList: Material[] = [];
  materialAssignments: { [materialId: number]: number } = {};

  editMode: boolean = false;

  ngOnInit() {
    this.loadProduct();
    this.materialsService.getMaterials().subscribe(list => {
      this.materialsList = list;
      this.materialAssignments = {};
      for (const mat of list) {
        this.materialAssignments[mat.id] = 0;
      }

      this.productsService.getProductMaterials(this.productId).subscribe(mats => {
        this.materials = mats;
        for (const assignment of mats) {
          this.materialAssignments[assignment.material] = assignment.quantity_per_unit;
        }
      });
    });
  }

  loadProduct() {
    this.productsService.getProduct(this.productId).subscribe(p => this.product = p);
  }

  deleteProduct() {
    if (confirm('Produkt wirklich löschen?')) {
      this.productsService.deleteProduct(this.productId).subscribe(() => {
        this.router.navigate(['/products']);
      });
    }
  }

  toggleEditMode() {
    if (this.editMode) {
      this.saveAllAssignments();
    }
    this.editMode = !this.editMode;
  }

  saveAllAssignments() {
    const requests: Promise<any>[] = [];

    for (const [materialIdStr, qty] of Object.entries(this.materialAssignments)) {
      const materialId = +materialIdStr;
      const existing = this.materials.find(m => m.material === materialId);

      if (qty > 0 && !existing) {
        requests.push(this.productsService.addProductMaterial({
          product: this.productId,
          material: materialId,
          quantity_per_unit: qty
        }).toPromise());
      } else if (qty === 0 && existing) {
        requests.push(this.productsService.deleteProductMaterial(existing.id!).toPromise());
      } else if (qty > 0 && existing && existing.quantity_per_unit !== qty) {
        requests.push(this.productsService.deleteProductMaterial(existing.id!).toPromise().then(() =>
          this.productsService.addProductMaterial({
            product: this.productId,
            material: materialId,
            quantity_per_unit: qty
          }).toPromise()
        ));
      }
    }

    Promise.all(requests).then(() => {
      this.ngOnInit(); // Daten neu laden
    });
  }

  getMaterialBezeichnung(materialId: number): string {
    const mat = this.materialsList.find(m => m.id === materialId);
    return mat ? mat.bezeichnung : `Material #${materialId}`;
  }

  getMaterialHersteller(materialId: number): string {
    const mat = this.materialsList.find(m => m.id === materialId);
    return mat?.hersteller_bezeichnung || '';
  }
}
