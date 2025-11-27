import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialsService, MaterialSupplierPriceOverview } from '../materials.service';
import { MaterialSupplierPriceDialogComponent } from '../material-supplier-price-dialog/material-supplier-price-dialog.component';

@Component({
  selector: 'app-material-supplier-prices',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatTableModule
  ],
  templateUrl: './material-supplier-prices.component.html',
  styleUrls: ['./material-supplier-prices.component.scss']
})
export class MaterialSupplierPricesComponent implements OnInit {
  @Input() materialId!: number;
  @Input() materialName: string = '';

  private materialsService = inject(MaterialsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  supplierPrices: MaterialSupplierPriceOverview[] = [];
  displayedColumns: string[] = ['supplier', 'manual_price', 'last_order_price', 'actions'];

  ngOnInit() {
    this.loadSupplierPrices();
  }

  loadSupplierPrices() {
    if (!this.materialId) return;

    this.materialsService.getMaterialSupplierPricesOverview(this.materialId).subscribe(
      prices => this.supplierPrices = prices
    );
  }

  openPriceDialog(priceData?: MaterialSupplierPriceOverview) {
    const dialogRef = this.dialog.open(MaterialSupplierPriceDialogComponent, {
      width: '500px',
      data: {
        materialId: this.materialId,
        materialName: this.materialName,
        priceData: priceData
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.materialsService.createMaterialSupplierPrice(result).subscribe({
          next: () => {
            this.loadSupplierPrices();
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
