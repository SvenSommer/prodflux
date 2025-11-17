import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductsService, Product, ProductMaterial, MaterialDependencyResponse } from './products.service';
import { FormsModule } from '@angular/forms';
import { MaterialsService, Material, MaterialCategoryGroup } from '../materials/materials.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ToggleProductDialogComponent, ToggleProductDialogData, ToggleProductDialogResult } from './toggle-product-dialog.component';

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
    MatInputModule,
    MatChipsModule
  ],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent {
  private route = inject(ActivatedRoute);
  private productsService = inject(ProductsService);
  private materialsService = inject(MaterialsService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

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

    this.materialsService.getMaterialsGrouped(true).subscribe(materialGroups => {
      this.materialGroups = materialGroups;
      const allMaterials = materialGroups.flatMap(g => g.materials);
      this.materialsList = allMaterials;

      this.materialAssignments = {};
      for (const mat of allMaterials) {
        this.materialAssignments[mat.id] = 0;
      }

      this.productsService.getProductMaterials(this.productId).subscribe(productMaterialGroups => {
        const allProductMaterials: { materialId: number; quantity: number; pmId?: number }[] = [];

        productMaterialGroups.forEach(group => {
          group.materials.forEach(mat => {
            allProductMaterials.push({
              materialId: mat.id,
              quantity: mat.required_quantity_per_unit ?? 1,
              pmId: mat.product_material_id ?? undefined
            });
          });
        });

        this.materials = allProductMaterials.map(pm => ({
          id: pm.pmId,                       // << wichtig: Zuordnungs-ID merken
          product: this.productId,
          material: pm.materialId,
          quantity_per_unit: pm.quantity
        }));

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
        requests.push(
          this.productsService.addProductMaterial({
            product: this.productId,
            material: materialId,
            quantity_per_unit: qty
          }).toPromise()
        );

      } else if (qty === 0 && existing && existing.id) {
        requests.push(this.productsService.deleteProductMaterial(existing.id).toPromise());

      } else if (qty > 0 && existing && existing.quantity_per_unit !== qty) {
        const chain = existing.id
          ? this.productsService.deleteProductMaterial(existing.id).toPromise().then(() =>
              this.productsService.addProductMaterial({
                product: this.productId,
                material: materialId,
                quantity_per_unit: qty
              }).toPromise()
            )
          : this.productsService.addProductMaterial({
              product: this.productId,
              material: materialId,
              quantity_per_unit: qty
            }).toPromise();

        requests.push(chain);
      }
    }

    Promise.all(requests).then(() => this.ngOnInit());
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

  isMaterialDeprecated(materialId: number): boolean {
    const mat = this.materialsList.find(m => m.id === materialId);
    return mat?.deprecated || false;
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

  toggleDeprecatedStatus(): void {
    if (!this.product) {
      return;
    }

    // Erst Material-Dependencies laden, dann Dialog öffnen
    this.productsService.getProductMaterialDependencies(this.product.id).subscribe({
      next: (dependencies) => {
        this.openToggleDeprecatedDialog(dependencies);
      },
      error: (error) => {
        console.error('Fehler beim Laden der Material-Dependencies:', error);
        this.snackBar.open('Fehler beim Laden der Dependencies', 'Schließen', {
          duration: 5000
        });
      }
    });
  }

  deprecateProduct(): void {
    // Diese Methode ist jetzt redundant zu toggleDeprecatedStatus
    this.toggleDeprecatedStatus();
  }

  private openToggleDeprecatedDialog(dependencies: MaterialDependencyResponse): void {
    if (!this.product) {
      return;
    }

    const dialogData: ToggleProductDialogData = {
      product: {
        id: this.product.id,
        bezeichnung: this.product.bezeichnung,
        deprecated: this.product.deprecated || false
      },
      dependencies
    };

    const dialogRef = this.dialog.open(ToggleProductDialogComponent, {
      data: dialogData,
      width: '600px'
    });

    dialogRef.afterClosed().subscribe((result: ToggleProductDialogResult) => {
      if (result?.confirmed) {
        this.productsService.toggleProductDeprecated(
          this.product!.id, 
          result.handleMaterials
        ).subscribe({
          next: (response) => {
            this.product!.deprecated = response.product_deprecated;
            const statusText = response.action === 'deprecated' ? 'als veraltet markiert' : 'wieder aktiviert';
            let message = `Produkt wurde ${statusText}`;
            
            if (response.materials_count > 0) {
              message += ` (${response.materials_count} Materialien ${response.action === 'deprecated' ? 'ebenfalls als veraltet markiert' : 'wieder aktiviert'})`;
            }
            
            this.snackBar.open(message, 'Schließen', {
              duration: 4000
            });
          },
          error: (error) => {
            console.error('Fehler beim Ändern des deprecated-Status:', error);
            this.snackBar.open('Fehler beim Ändern des Status', 'Schließen', {
              duration: 5000
            });
          }
        });
      }
    });
  }


}
