import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { SuppliersService } from '../settings/suppliers.service';
import { MaterialsService, Material, MaterialSupplierPriceOverview } from '../materials/materials.service';
import { Supplier } from '../settings/models/supplier.model';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { SupplierDialogComponent, SupplierDialogData } from '../../shared/components/supplier-dialog/supplier-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { MaterialTableComponent, MaterialTableRow, MaterialTableColumn } from '../../shared/components/material-table/material-table.component';
import { SupplierMaterialPriceDialogComponent, SupplierMaterialPriceDialogData } from './supplier-material-price-dialog/supplier-material-price-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  templateUrl: './supplier-detail.component.html',
  styleUrls: ['./supplier-detail.component.scss'],
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatChipsModule,
    BreadcrumbComponent,
    MaterialTableComponent
  ],
})
export class SupplierDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private suppliersService = inject(SuppliersService);
  private materialsService = inject(MaterialsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  supplierId!: number;
  supplier?: Supplier;
  allMaterials: Material[] = [];
  supplierMaterials: Material[] = [];
  materialPrices: Map<number, MaterialSupplierPriceOverview> = new Map();

  materialTableColumns: MaterialTableColumn[] = [
    { key: 'manual_price', header: 'Manueller Preis', width: '250px' },
    { key: 'last_order_price', header: 'Letzter Bestellpreis', width: '200px' }
  ];

  ngOnInit() {
    this.supplierId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadSupplier();
    this.loadMaterials();
  }

  loadSupplier() {
    this.suppliersService.get(this.supplierId).subscribe({
      next: (supplier) => {
        this.supplier = supplier;
      },
      error: (err) => {
        console.error('Fehler beim Laden des Lieferanten:', err);
        this.router.navigate(['/suppliers']);
      }
    });
  }

  loadMaterials() {
    this.materialsService.getMaterialsGrouped(true).subscribe(groups => {
      this.allMaterials = groups.flatMap(g => g.materials);
      this.updateSupplierMaterials();
    });
  }

  updateSupplierMaterials() {
    this.supplierMaterials = this.allMaterials.filter(m =>
      m.suppliers?.includes(this.supplierId)
    );
    // Lade Preise nachdem die Materialien geladen wurden
    this.loadMaterialPrices();
  }

  loadMaterialPrices() {
    if (this.supplierMaterials.length === 0) return;

    // Lade Preise für alle Materialien dieses Lieferanten
    this.supplierMaterials.forEach(material => {
      this.materialsService.getMaterialSupplierPricesOverview(material.id).subscribe(prices => {
        const priceForThisSupplier = prices.find(p => p.supplier_id === this.supplierId);
        if (priceForThisSupplier) {
          this.materialPrices.set(material.id, priceForThisSupplier);
        }
      });
    });
  }

  getMaterialTableRows(): MaterialTableRow[] {
    return this.supplierMaterials.map(material => {
      const priceData = this.materialPrices.get(material.id);
      return {
        materialId: material.id,
        materialName: material.bezeichnung,
        materialManufacturerName: material.hersteller_bezeichnung || undefined,
        materialImageUrl: material.bild_url || null,
        categoryName: material.category?.name || 'Ohne Kategorie',
        categoryOrder: material.category?.order ?? 9999,
        data: {
          hersteller: material.hersteller_bezeichnung || '—',
          material: material,
          priceData: priceData
        }
      };
    });
  }

  openEditDialog() {
    if (!this.supplier) return;

    const dialogData: SupplierDialogData = {
      supplier: this.supplier
    };

    const dialogRef = this.dialog.open(SupplierDialogComponent, {
      width: '600px',
      data: dialogData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSupplier();
      }
    });
  }

  deleteSupplier() {
    if (!this.supplier) return;

    const dialogData: ConfirmDialogData = {
      title: 'Lieferant löschen',
      message: `Möchten Sie den Lieferanten "${this.supplier.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
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
        this.suppliersService.delete(this.supplierId).subscribe({
          next: () => {
            this.router.navigate(['/suppliers']);
          },
          error: (err) => {
            console.error('Fehler beim Löschen des Lieferanten:', err);
          }
        });
      }
    });
  }

  removeMaterialFromSupplier(material: Material) {
    const dialogData: ConfirmDialogData = {
      title: 'Material entfernen',
      message: `Möchten Sie das Material "${material.bezeichnung}" wirklich von diesem Lieferanten entfernen?`,
      confirmText: 'Entfernen',
      cancelText: 'Abbrechen',
      icon: 'remove_circle',
      color: 'warn'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const updatedSuppliers = material.suppliers?.filter(id => id !== this.supplierId) || [];

        this.materialsService.updateMaterial(material.id, {
          suppliers: updatedSuppliers
        }).subscribe({
          next: () => {
            this.loadMaterials();
          },
          error: (err) => {
            console.error('Fehler beim Entfernen des Materials:', err);
          }
        });
      }
    });
  }

  getBreadcrumbLinks() {
    return [
      { label: 'Lieferanten', url: '/suppliers' },
      { label: this.supplier?.name || `#${this.supplierId}` }
    ];
  }

  formatPrice(price: number | string | null): string {
    if (price === null || price === undefined) return '—';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return '—';
    return `${numPrice.toFixed(2)} €`;
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('de-DE');
  }

  navigateToOrder(orderId: number) {
    this.router.navigate(['/orders', orderId]);
  }

  extractOrderId(orderNumber: string | null): number {
    if (!orderNumber) return 0;
    // Versuche die Order-ID aus der Bestellnummer zu extrahieren (z.B. "BES-123" -> 123)
    const match = orderNumber.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  openPriceDialog(material: Material, priceData?: MaterialSupplierPriceOverview) {
    const dialogData: SupplierMaterialPriceDialogData = {
      supplierId: this.supplierId,
      supplierName: this.supplier?.name || '',
      priceData: priceData ? {
        ...priceData,
        material_id: material.id,
        material_name: material.bezeichnung
      } : undefined
    };

    const dialogRef = this.dialog.open(SupplierMaterialPriceDialogComponent, {
      width: '600px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.materialsService.createMaterialSupplierPrice(result).subscribe({
          next: () => {
            this.snackBar.open('Preis erfolgreich gespeichert', 'Schließen', {
              duration: 3000
            });
            // Preise für dieses Material neu laden
            this.materialsService.getMaterialSupplierPricesOverview(material.id).subscribe(prices => {
              const priceForThisSupplier = prices.find(p => p.supplier_id === this.supplierId);
              if (priceForThisSupplier) {
                this.materialPrices.set(material.id, priceForThisSupplier);
              }
            });
          },
          error: (error) => {
            console.error('Fehler beim Speichern des Preises:', error);
            this.snackBar.open('Fehler beim Speichern des Preises', 'Schließen', {
              duration: 5000
            });
          }
        });
      }
    });
  }
}
