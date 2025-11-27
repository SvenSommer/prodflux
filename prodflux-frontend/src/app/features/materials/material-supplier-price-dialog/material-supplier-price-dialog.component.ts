import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MaterialsService, MaterialSupplierPriceOverview } from '../materials.service';
import { SuppliersService } from '../../settings/suppliers.service';
import { Supplier } from '../../settings/models/supplier.model';
import { SupplierDialogComponent, SupplierDialogData } from '../../../shared/components/supplier-dialog/supplier-dialog.component';

export interface MaterialSupplierPriceDialogData {
  materialId: number;
  materialName: string;
  priceData?: MaterialSupplierPriceOverview;
}

@Component({
  selector: 'app-material-supplier-price-dialog',
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
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.priceData ? 'Preis bearbeiten' : 'Neuer Preis' }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="price-form">
        <div class="supplier-field-row">
          <mat-form-field appearance="outline" class="supplier-select">
            <mat-label>Lieferant</mat-label>
            <mat-select formControlName="supplier" [disabled]="!!data.priceData">
              <mat-option *ngFor="let supplier of suppliers" [value]="supplier.id">
                {{ supplier.name }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('supplier')?.hasError('required')">
              Bitte wählen Sie einen Lieferanten
            </mat-error>
          </mat-form-field>
          <button
            mat-mini-fab
            color="accent"
            type="button"
            (click)="openNewSupplierDialog()"
            [disabled]="!!data.priceData"
            matTooltip="Neuer Lieferant"
            class="add-supplier-btn">
            <mat-icon>add</mat-icon>
          </button>
        </div>

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
      min-width: 400px;
      padding: 20px 0;
    }

    .full-width {
      width: 100%;
    }

    .supplier-field-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .supplier-select {
      flex: 1;
    }

    .add-supplier-btn {
      margin-top: 4px;
      flex-shrink: 0;
    }
  `]
})
export class MaterialSupplierPriceDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private suppliersService = inject(SuppliersService);
  private dialog = inject(MatDialog);

  form: FormGroup;
  suppliers: Supplier[] = [];

  constructor(
    public dialogRef: MatDialogRef<MaterialSupplierPriceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MaterialSupplierPriceDialogData
  ) {
    this.form = this.fb.group({
      supplier: [data.priceData?.supplier_id || null, Validators.required],
      price: [data.priceData?.manual_price || null, [Validators.required, Validators.min(0.01)]],
      valid_from: [data.priceData?.manual_price_valid_from || new Date().toISOString().split('T')[0], Validators.required],
      note: [data.priceData?.manual_price_note || '']
    });
  }

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.suppliersService.getAll().subscribe(suppliers => {
      this.suppliers = suppliers.filter(s => s.is_active);
    });
  }

  openNewSupplierDialog() {
    const dialogData: SupplierDialogData = {
      title: 'Neuer Lieferant'
    };

    const dialogRef = this.dialog.open(SupplierDialogComponent, {
      width: '500px',
      data: dialogData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(newSupplier => {
      if (newSupplier) {
        // Lieferantenliste neu laden
        this.loadSuppliers();
        // Neuen Lieferanten automatisch auswählen
        setTimeout(() => {
          this.form.patchValue({ supplier: newSupplier.id });
        }, 100);
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.form.valid) {
      const formValue = this.form.value;
      this.dialogRef.close({
        material: this.data.materialId,
        supplier: formValue.supplier,
        price: formValue.price,
        valid_from: formValue.valid_from,
        note: formValue.note
      });
    }
  }
}
