import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { SuppliersService } from '../settings/suppliers.service';
import { Supplier } from '../settings/models/supplier.model';
import { SupplierDialogComponent, SupplierDialogData } from '../../shared/components/supplier-dialog/supplier-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-suppliers-management',
  standalone: true,
  templateUrl: './suppliers-management.component.html',
  styleUrls: ['./suppliers-management.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    BreadcrumbComponent
  ],
})
export class SuppliersManagementComponent {
  private suppliersService = inject(SuppliersService);
  private dialog = inject(MatDialog);

  suppliers: Supplier[] = [];
  displayedColumns: string[] = ['name', 'url', 'kundenkonto', 'is_active', 'aktionen'];

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.suppliersService.getAll().subscribe(suppliers => {
      this.suppliers = suppliers;
    });
  }

  openSupplierDialog(supplier?: Supplier) {
    const dialogData: SupplierDialogData = {
      supplier: supplier
    };

    const dialogRef = this.dialog.open(SupplierDialogComponent, {
      width: '600px',
      data: dialogData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSuppliers();
      }
    });
  }

  deleteSupplier(supplier: Supplier) {
    const dialogData: ConfirmDialogData = {
      title: 'Lieferant löschen',
      message: `Möchten Sie den Lieferanten "${supplier.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      confirmText: 'Löschen',
      cancelText: 'Abbrechen',
      icon: 'delete',
      color: 'warn'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.suppliersService.delete(supplier.id).subscribe({
          next: () => {
            this.loadSuppliers();
          },
          error: (err) => {
            console.error('Fehler beim Löschen des Lieferanten:', err);
            // TODO: Fehlerbehandlung mit Snackbar
          }
        });
      }
    });
  }

  getBreadcrumbLinks() {
    return [
      { label: 'Lieferanten' }
    ];
  }
}
