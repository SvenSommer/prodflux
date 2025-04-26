import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { WorkshopsService, Workshop } from './workshop.services';
import { VersionsService, ProductVersion } from './versions.service';
import { VariantsService, ProductVariant } from './variants.service';
import { MaterialCategoriesService, MaterialCategory } from './material-categories.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
  ],
})
export class SettingsComponent {
  private workshopsService = inject(WorkshopsService);
  private versionsService = inject(VersionsService);
  private variantsService = inject(VariantsService);
  private materialCategoriesService = inject(MaterialCategoriesService);

  workshops: Workshop[] = [];
  newWorkshopName = '';
  editingWorkshop: Workshop | null = null;

  materialCategories: MaterialCategory[] = [];
  newMaterialCategoryName = '';
  newMaterialCategoryOrder: number | null = null;
  editingMaterialCategory: MaterialCategory | null = null;

  versions: ProductVersion[] = [];
  newVersionName = '';
  newVersionDescription = '';
  editingVersion: ProductVersion | null = null;

  variants: ProductVariant[] = [];
  newVariantName = '';
  newVariantDescription = '';
  editingVariant: ProductVariant | null = null;

  ngOnInit() {
    this.load();
  }

  load() {
    this.workshopsService.getAll().subscribe(ws => this.workshops = ws);
    this.versionsService.getAll().subscribe(v => this.versions = v);
    this.variantsService.getAll().subscribe(v => this.variants = v);
    this.materialCategoriesService.getAll().subscribe(mc => this.materialCategories = mc);
  }

  saveWorkshop() {
    const payload = { name: this.newWorkshopName };
    const request = this.editingWorkshop
      ? this.workshopsService.update(this.editingWorkshop.id, payload)
      : this.workshopsService.create(payload);

    request.subscribe(() => {
      this.newWorkshopName = '';
      this.editingWorkshop = null;
      this.load();
    });
  }

  editWorkshop(w: Workshop) {
    this.editingWorkshop = w;
    this.newWorkshopName = w.name;
  }

  deleteWorkshop(id: number) {
    if (confirm('Wirklich löschen?')) {
      this.workshopsService.delete(id).subscribe(() => this.load());
    }
  }

  saveMaterialCategory() {
    if (this.newMaterialCategoryName.trim() === '' || this.newMaterialCategoryOrder == null) {
      return;
    }

    const payload = {
      name: this.newMaterialCategoryName,
      order: this.newMaterialCategoryOrder,
    };

    const request = this.editingMaterialCategory
      ? this.materialCategoriesService.update(this.editingMaterialCategory.id, payload)
      : this.materialCategoriesService.create(payload);

    request.subscribe(() => {
      this.newMaterialCategoryName = '';
      this.newMaterialCategoryOrder = null;
      this.editingMaterialCategory = null;
      this.load();
    });
  }

  editMaterialCategory(mc: MaterialCategory) {
    this.editingMaterialCategory = mc;
    this.newMaterialCategoryName = mc.name;
    this.newMaterialCategoryOrder = mc.order;
  }

  deleteMaterialCategory(id: number) {
    if (confirm('Wirklich löschen?')) {
      this.materialCategoriesService.delete(id).subscribe(() => this.load());
    }
  }

  saveVersion() {
    const payload = {
      name: this.newVersionName,
      description: this.newVersionDescription,
    };
    const request = this.editingVersion
      ? this.versionsService.update(this.editingVersion.id, payload)
      : this.versionsService.create(payload);

    request.subscribe(() => {
      this.newVersionName = '';
      this.newVersionDescription = '';
      this.editingVersion = null;
      this.load();
    });
  }

  editVersion(v: ProductVersion) {
    this.editingVersion = v;
    this.newVersionName = v.name;
    this.newVersionDescription = v.description || '';
  }

  deleteVersion(id: number) {
    if (confirm('Wirklich löschen?')) {
      this.versionsService.delete(id).subscribe(() => this.load());
    }
  }

  saveVariant() {
    const payload = {
      name: this.newVariantName,
      description: this.newVariantDescription,
    };
    const request = this.editingVariant
      ? this.variantsService.update(this.editingVariant.id, payload)
      : this.variantsService.create(payload);

    request.subscribe(() => {
      this.newVariantName = '';
      this.newVariantDescription = '';
      this.editingVariant = null;
      this.load();
    });
  }

  editVariant(v: ProductVariant) {
    this.editingVariant = v;
    this.newVariantName = v.name;
    this.newVariantDescription = v.description || '';
  }

  deleteVariant(id: number) {
    if (confirm('Wirklich löschen?')) {
      this.variantsService.delete(id).subscribe(() => this.load());
    }
  }
}
