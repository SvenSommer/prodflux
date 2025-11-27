import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MaterialsService, MaterialSupplierPriceOverview, Material } from '../../materials/materials.service';
import { Observable, map, startWith } from 'rxjs';

export interface SupplierMaterialPriceDialogData {
  supplierId: number;
  supplierName: string;
  priceData?: MaterialSupplierPriceOverview;
}

@Component({
  selector: 'app-supplier-material-price-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatSelectModule,
    MatIconModule,
    MatAutocompleteModule
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.priceData ? 'Preis bearbeiten' : 'Neuer Preis für ' + data.supplierName }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="price-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Material</mat-label>
          <input
            matInput
            formControlName="materialSearch"
            [matAutocomplete]="auto"
            [disabled]="!!data.priceData"
            placeholder="Material suchen...">
          <mat-autocomplete
            #auto="matAutocomplete"
            [displayWith]="displayMaterial"
            (optionSelected)="onMaterialSelected($event.option.value)">
            <mat-option *ngFor="let material of filteredMaterials$ | async" [value]="material">
              <div class="material-option">
                <strong>{{ material.bezeichnung }}</strong>
                <span *ngIf="material.hersteller_bezeichnung" class="manufacturer">
                  {{ material.hersteller_bezeichnung }}
                </span>
              </div>
            </mat-option>
          </mat-autocomplete>
          <mat-error *ngIf="form.get('material')?.hasError('required')">
            Bitte wählen Sie ein Material
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Preis (netto)</mat-label>
          <input matInput type="number" step="0.01" formControlName="price" required>
          <span matSuffix>€</span>
          <mat-error *ngIf="form.get('price')?.hasError('required')">
            Bitte geben Sie einen Preis ein
          </mat-error>
          <mat-error *ngIf="form.get('price')?.hasError('min')">
            Preis muss größer als 0 sein
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Gültig ab</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="valid_from" required>
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          <mat-error *ngIf="form.get('valid_from')?.hasError('required')">
            Bitte wählen Sie ein Datum
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notiz (optional)</mat-label>
          <textarea matInput formControlName="note" rows="3"></textarea>
          <mat-hint>z.B. Mindestbestellmenge, Rabattbedingungen</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Abbrechen</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!form.valid">
        Speichern
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .price-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 500px;
      padding: 20px 0;
    }

    .full-width {
      width: 100%;
    }

    .material-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 4px 0;

      .manufacturer {
        font-size: 0.875rem;
        color: #666;
      }
    }

    mat-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
    }
  `]
})
export class SupplierMaterialPriceDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private materialsService = inject(MaterialsService);

  form: FormGroup;
  allMaterials: Material[] = [];
  filteredMaterials$!: Observable<Material[]>;

  constructor(
    public dialogRef: MatDialogRef<SupplierMaterialPriceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SupplierMaterialPriceDialogData
  ) {
    this.form = this.fb.group({
      material: [data.priceData?.material_id || null, Validators.required],
      materialSearch: [''],
      price: [data.priceData?.manual_price || null, [Validators.required, Validators.min(0.01)]],
      valid_from: [data.priceData?.manual_price_valid_from || new Date().toISOString().split('T')[0], Validators.required],
      note: [data.priceData?.manual_price_note || '']
    });
  }

  ngOnInit() {
    this.loadMaterials();
    this.setupMaterialFilter();
  }

  loadMaterials() {
    this.materialsService.getMaterialsGrouped(true).subscribe(groups => {
      this.allMaterials = groups.flatMap(g => g.materials);

      // Wenn wir im Edit-Mode sind, setze das Material
      if (this.data.priceData) {
        const material = this.allMaterials.find(m => m.id === this.data.priceData!.material_id);
        if (material) {
          this.form.patchValue({
            materialSearch: material,
            material: material.id
          });
        }
      }
    });
  }

  setupMaterialFilter() {
    this.filteredMaterials$ = this.form.get('materialSearch')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const searchValue = typeof value === 'string' ? value : value?.bezeichnung || '';
        return this._filterMaterials(searchValue);
      })
    );
  }

  private _filterMaterials(value: string): Material[] {
    const filterValue = value.toLowerCase();
    return this.allMaterials.filter(material =>
      material.bezeichnung.toLowerCase().includes(filterValue) ||
      (material.hersteller_bezeichnung && material.hersteller_bezeichnung.toLowerCase().includes(filterValue))
    );
  }

  displayMaterial(material: Material | null): string {
    if (!material) return '';
    return material.bezeichnung;
  }

  onMaterialSelected(material: Material) {
    this.form.patchValue({ material: material.id });
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.form.valid) {
      const formValue = this.form.value;
      this.dialogRef.close({
        material: formValue.material,
        supplier: this.data.supplierId,
        price: formValue.price,
        valid_from: formValue.valid_from,
        note: formValue.note
      });
    }
  }
}
