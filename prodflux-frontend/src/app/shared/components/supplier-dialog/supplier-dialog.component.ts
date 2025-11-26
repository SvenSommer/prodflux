import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SuppliersService } from '../../../features/settings/suppliers.service';
import { Supplier, SupplierRequest } from '../../../features/settings/models/supplier.model';

export interface SupplierDialogData {
  supplier?: Supplier;  // Optional: wenn vorhanden, Edit-Mode
  title?: string;       // Optional: Override für Titel
}

@Component({
  selector: 'app-supplier-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './supplier-dialog.component.html',
  styleUrls: ['./supplier-dialog.component.scss']
})
export class SupplierDialogComponent {
  private suppliersService = inject(SuppliersService);

  isEdit: boolean;
  dialogTitle: string;
  errorMessage: string | null = null;
  isSubmitting = false;

  supplierData: SupplierRequest = {
    name: '',
    url: '',
    kundenkonto: '',
    notes: '',
    is_active: true
  };

  constructor(
    public dialogRef: MatDialogRef<SupplierDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SupplierDialogData
  ) {
    this.isEdit = !!data?.supplier;
    this.dialogTitle = data?.title || (this.isEdit ? 'Lieferant bearbeiten' : 'Neuer Lieferant');

    // Bei Edit-Mode die Daten vorausfüllen
    if (data?.supplier) {
      this.supplierData = {
        name: data.supplier.name,
        url: data.supplier.url || '',
        kundenkonto: data.supplier.kundenkonto || '',
        notes: data.supplier.notes || '',
        is_active: data.supplier.is_active
      };
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    // Validierung
    if (!this.supplierData.name || this.supplierData.name.trim() === '') {
      this.errorMessage = 'Name ist erforderlich';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const request = this.isEdit && this.data.supplier
      ? this.suppliersService.update(this.data.supplier.id, this.supplierData)
      : this.suppliersService.create(this.supplierData);

    request.subscribe({
      next: (savedSupplier) => {
        this.dialogRef.close(savedSupplier);
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.status === 400 && err.error) {
          // Zeige Backend-Validierungsfehler an
          if (typeof err.error === 'string') {
            this.errorMessage = err.error;
          } else if (err.error.detail) {
            this.errorMessage = err.error.detail;
          } else {
            this.errorMessage = JSON.stringify(err.error);
          }
        } else {
          this.errorMessage = 'Fehler beim Speichern des Lieferanten';
        }
      }
    });
  }
}
