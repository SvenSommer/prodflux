import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { SuppliersService } from '../settings/suppliers.service';
import { Supplier } from '../settings/models/supplier.model';
import { SupplierDialogComponent, SupplierDialogData } from '../../shared/components/supplier-dialog/supplier-dialog.component';
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
  private router = inject(Router);

  suppliers: Supplier[] = [];
  displayedColumns: string[] = ['name', 'url', 'kundenkonto', 'is_active'];

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.suppliersService.getAll().subscribe(suppliers => {
      this.suppliers = suppliers;
    });
  }

  onSupplierClick(supplier: Supplier) {
    this.router.navigate(['/suppliers', supplier.id]);
  }

  openNewSupplierDialog() {
    const dialogData: SupplierDialogData = {};

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

  getBreadcrumbLinks() {
    return [
      { label: 'Lieferanten' }
    ];
  }
}
