import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { MaterialsService, MaterialSupplierPriceOverview } from '../../materials/materials.service';
import { SupplierMaterialPriceDialogComponent } from '../supplier-material-price-dialog/supplier-material-price-dialog.component';

@Component({
  selector: 'app-supplier-material-prices',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatTableModule,
    RouterLink
  ],
  templateUrl: './supplier-material-prices.component.html',
  styleUrls: ['./supplier-material-prices.component.scss']
})
export class SupplierMaterialPricesComponent implements OnInit {
  @Input() supplierId!: number;
  @Input() supplierName: string = '';

  private materialsService = inject(MaterialsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  materialPrices: MaterialSupplierPriceOverview[] = [];
  displayedColumns: string[] = ['material', 'manual_price', 'last_order_price', 'actions'];

  ngOnInit() {
    this.loadMaterialPrices();
  }

  loadMaterialPrices() {
    if (!this.supplierId) return;

    // Lade alle Material-Supplier-Preise und filtere nach diesem Lieferanten
    this.materialsService.getAllMaterialSupplierPrices().subscribe(
      prices => {
        this.materialPrices = prices.filter(p => p.supplier_id === this.supplierId);
      }
    );
  }

  openPriceDialog(priceData?: MaterialSupplierPriceOverview) {
    const dialogRef = this.dialog.open(SupplierMaterialPriceDialogComponent, {
      width: '500px',
      data: {
        supplierId: this.supplierId,
        supplierName: this.supplierName,
        priceData: priceData
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.materialsService.createMaterialSupplierPrice(result).subscribe({
          next: () => {
            this.loadMaterialPrices();
            this.snackBar.open('Preis erfolgreich gespeichert', 'Schließen', {
              duration: 3000
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

  deletePrice(price: MaterialSupplierPriceOverview) {
    if (confirm(`Möchten Sie den Preis für ${price.material_name} wirklich löschen?`)) {
      this.materialsService.deleteMaterialSupplierPrice(price.id!).subscribe({
        next: () => {
          this.loadMaterialPrices();
          this.snackBar.open('Preis erfolgreich gelöscht', 'Schließen', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Fehler beim Löschen des Preises:', error);
          this.snackBar.open('Fehler beim Löschen des Preises', 'Schließen', {
            duration: 5000
          });
        }
      });
    }
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
}
