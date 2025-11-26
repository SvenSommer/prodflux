import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MaterialsService, Material, MaterialCategoryGroup } from './materials.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MaterialCategoriesService, MaterialCategory } from '../settings/material-categories.service';
import { MatSelectModule } from '@angular/material/select';
import { SuppliersService } from '../settings/suppliers.service';
import { Supplier } from '../settings/models/supplier.model';

@Component({
  selector: 'app-material-form',
  standalone: true,
  templateUrl: './material-form.component.html',
  styleUrls: ['./material-form.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule
  ],
})
export class MaterialFormComponent {
  private route = inject(ActivatedRoute);
  private materialsService = inject(MaterialsService);
  private materialCategoriesService = inject(MaterialCategoriesService);
  private suppliersService = inject(SuppliersService);
  private router = inject(Router);

  materialId: number | null = null;
  currentImageUrl: string | null = null;
  newImagePreview: string | null = null;

  material: {
    bezeichnung: string;
    hersteller_bezeichnung: string;
    bild: File | null;
  } = {
    bezeichnung: '',
    hersteller_bezeichnung: '',
    bild: null,
  };

  groupedMaterials: MaterialCategoryGroup[] = [];

  categories: MaterialCategory[] = [];
  selectedCategoryId: number | null = null;

  suppliers: Supplier[] = [];
  selectedSupplierIds: number[] = [];

  alternatives: Material[] = [];
  allMaterials: Material[] = [];
  newAlternativeId: number | null = null;

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');

    this.materialCategoriesService.getAll().subscribe(cats => this.categories = cats);
    this.suppliersService.getAll().subscribe(suppliers => this.suppliers = suppliers);

    this.materialsService.getMaterialsGrouped().subscribe(groups => {
      this.groupedMaterials = groups;
      this.updateAvailableAlternatives(); // initial befüllen
    });

    if (idParam) {
      this.materialId = +idParam;
      this.materialsService.getMaterial(this.materialId).subscribe((data) => {
        this.material.bezeichnung = data.bezeichnung;
        this.material.hersteller_bezeichnung = data.hersteller_bezeichnung;
        this.currentImageUrl = data.bild_url || null;
        this.selectedCategoryId = data.category?.id || null;
        this.selectedSupplierIds = data.suppliers || [];
        this.newImagePreview = null;
        this.material.bild = null;
        this.updateAvailableAlternatives(); // nach Material-Load neu filtern
      });

      this.materialsService.getMaterialAlternatives(this.materialId).subscribe(alts => {
        this.alternatives = alts;
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.material.bild = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.newImagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  save() {
    const formData = new FormData();
    formData.append('bezeichnung', this.material.bezeichnung);
    formData.append('hersteller_bezeichnung', this.material.hersteller_bezeichnung);
    if (this.material.bild) {
      formData.append('bild', this.material.bild);
    }
    if (this.selectedCategoryId !== null) {
      formData.append('category_id', this.selectedCategoryId.toString());
    }

    // Add suppliers
    this.selectedSupplierIds.forEach((supplierId, index) => {
      formData.append(`suppliers[${index}]`, supplierId.toString());
    });

    const request = this.materialId
      ? this.materialsService.updateMaterialFormData(this.materialId, formData)
      : this.materialsService.createMaterialFormData(formData);

    request.subscribe(() => {
      this.router.navigate(['/materials']);
    });
  }

  confirmDelete() {
    if (confirm('Material wirklich löschen?')) {
      if (this.materialId) {
        this.materialsService.deleteMaterial(this.materialId).subscribe(() => {
          this.router.navigate(['/materials']);
        });
      }
    }
  }

  availableAlternatives: Material[] = [];

  updateAvailableAlternatives() {
    if (this.selectedCategoryId === null) {
      this.availableAlternatives = [];
      return;
    }

    const matchingGroup = this.groupedMaterials.find(
      group => group.category_id === this.selectedCategoryId
    );

    this.availableAlternatives = matchingGroup
      ? matchingGroup.materials.filter(mat => mat.id !== this.materialId) // sich selbst nicht als Alternative anbieten
      : [];
  }

  addAlternative() {
    if (!this.materialId || !this.newAlternativeId) return;

    this.materialsService.addAlternative(this.materialId, this.newAlternativeId).subscribe(() => {
      this.loadAlternatives();           // Alternativen neu laden
      this.newAlternativeId = null;

      // Zusätzlich: Materials neu laden, damit verfügbar/ausblendbar
      this.materialsService.getMaterialsGrouped().subscribe(groups => {
        this.groupedMaterials = groups;
        this.updateAvailableAlternatives();
      });
    });
  }

  removeAlternative(alternativeId: number) {
    if (!this.materialId) return;

    this.materialsService.removeAlternative(this.materialId, alternativeId).subscribe(() => {
      this.loadAlternatives();
    });
  }

  loadAlternatives() {
    if (this.materialId) {
      this.materialsService.getMaterialAlternatives(this.materialId).subscribe(alts => {
        this.alternatives = alts;
      });
    }
  }

  isAlreadyAlternative(id: number): boolean {
    return this.alternatives.some(a => a.id === id);
  }
}
