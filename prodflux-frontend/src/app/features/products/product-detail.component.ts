import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductsService, Product, ProductMaterial } from './products.service';
import { FormsModule } from '@angular/forms';
import { MaterialsService, Material, MaterialCategoryGroup } from '../materials/materials.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
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
  materialGroups: MaterialCategoryGroup[] = [];

  editMode: boolean = false;

  ngOnInit() {
    console.log('[ProductDetail] Init gestartet');

    this.loadProduct();

    this.materialsService.getMaterialsGrouped().subscribe(materialGroups => {
      this.materialGroups = materialGroups;
      const allMaterials = materialGroups.flatMap(g => g.materials);
      this.materialsList = allMaterials;

      // ZUERST alle materialAssignments auf 0 setzen
      this.materialAssignments = {};
      for (const mat of allMaterials) {
        this.materialAssignments[mat.id] = 0;
      }

      // DANN Produktmaterialien laden
      this.productsService.getProductMaterials(this.productId).subscribe(productMaterialGroups => {
        const allProductMaterials: { materialId: number; quantity: number }[] = [];

        productMaterialGroups.forEach(group => {
          group.materials.forEach(mat => {
            allProductMaterials.push({
              materialId: mat.id,
              quantity: mat.required_quantity_per_unit ?? 1
            });
          });
        });

        // materials array für Anzeige bauen
        this.materials = allProductMaterials.map(pm => ({
          product: this.productId,
          material: pm.materialId,
          quantity_per_unit: pm.quantity
        }));

        // 🛠 Direkt vorhandene Mengen vorbelegen
        for (const pm of allProductMaterials) {
          this.materialAssignments[pm.materialId] = pm.quantity;
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

  getMaterialsByCategory(categoryId: number | null) {
    const group = this.materialGroups.find(g => g.category_id === categoryId);
    if (!group) return [];

    const materialIds = group.materials.map(m => m.id);
    return this.materials.filter(m => materialIds.includes(m.material));
  }

  getMaterialBildUrl(id: number): string | null {
    const mat = this.materialsList.find(m => m.id === id);
    return mat?.bild_url || null;
  }

  getMaterialAlternatives(materialId: number): number[] {
    const mat = this.materialsList.find(m => m.id === materialId);
    return mat?.alternatives || [];
  }

  getMaterialOrAlternativeBildUrl(materialId: number): string | null {
    const material = this.materialsList.find(m => m.id === materialId);
    if (material?.bild_url) {
      return material.bild_url;
    }

    // Falls Material selbst kein Bild hat → erstes Alternativen-Bild
    const alternatives = material?.alternatives || [];
    for (const altId of alternatives) {
      const altMat = this.materialsList.find(m => m.id === altId);
      if (altMat?.bild_url) {
        return altMat.bild_url;
      }
    }

    return null;
  }
}
