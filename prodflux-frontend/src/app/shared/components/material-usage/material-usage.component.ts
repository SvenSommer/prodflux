import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { ProductsService, Product, ProductMaterial } from '../../../features/products/products.service';

@Component({
  selector: 'app-material-usage',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="material-usage-container">
      <h3 class="usage-title">VERWENDET IN</h3>

      <div *ngIf="relatedProducts.length > 0; else noProductsTemplate" class="products-grid">
        <div *ngFor="let product of relatedProducts" class="product-item">
          <div class="product-container">
            <img
              *ngIf="product.bild"
              [src]="product.bild"
              [alt]="product.bezeichnung"
              class="product-image"
              (error)="onProductImageError($event)"
              [matTooltip]="product.bezeichnung"
              matTooltipClass="product-tooltip"
            />
            <div *ngIf="!product.bild" class="product-placeholder">
              <mat-icon>inventory_2</mat-icon>
            </div>
            <div class="usage-badge" *ngIf="getProductUsage(product.id)">
              {{ formatUsage(getProductUsage(product.id)!) }}
            </div>
          </div>
        </div>
      </div>

      <ng-template #noProductsTemplate>
        <div class="no-products">
          <mat-icon class="no-products-icon">info</mat-icon>
          <p>Dieses Material wird in keinem Produkt verwendet</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .material-usage-container {
      width: 100%;
    }

    .usage-title {
      font-size: 0.875rem;
      font-weight: 600;
      margin: 0 0 16px 0;
      color: #666;
      letter-spacing: 0.5px;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: 16px;
      max-height: 200px;
      overflow-y: auto;
      padding: 12px;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 8px;
    }

    .product-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      /* Zusätzlicher Raum für das Badge */
      padding: 8px 8px 0 8px;
      position: relative;
    }

    .product-container {
      position: relative;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      border-radius: 6px;
      /* WICHTIG: overflow: visible damit das Badge nicht abgeschnitten wird */
      overflow: visible;
      border: 1px solid #e0e0e0;
    }

    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      cursor: pointer;
    }

    .product-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: #999;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .usage-badge {
      position: absolute;
      /* Badge weiter außerhalb positionieren für bessere Sichtbarkeit */
      top: -8px;
      right: -8px;
      background: #4CAF50;
      color: white;
      border-radius: 50px;
      font-size: 0.625rem;
      font-weight: 600;
      padding: 2px 6px;
      min-width: 18px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      /* Höhere z-index um sicherzustellen, dass es über allem liegt */
      z-index: 10;
      /* Weiße Umrandung für bessere Sichtbarkeit */
      border: 1px solid white;
    }

    .no-products {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
      color: #666;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 8px;

      .no-products-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        margin-bottom: 8px;
        opacity: 0.6;
      }

      p {
        margin: 0;
        font-size: 0.875rem;
      }
    }

    /* Custom Tooltip Styles */
    :global(.product-tooltip) {
      font-size: 0.875rem;
      max-width: 200px;
      white-space: normal;
      text-align: center;
    }
  `]
})
export class MaterialUsageComponent implements OnInit, OnDestroy, OnChanges {
  @Input() materialId: number | null = null;

  relatedProducts: Product[] = [];
  productMaterialUsage: { [productId: number]: number } = {};

  private subscriptions: Subscription[] = [];

  constructor(private productsService: ProductsService) {}

  ngOnInit(): void {
    if (this.materialId) {
      this.loadProductMaterialUsage();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reagiere auf Änderungen der materialId
    if (changes['materialId'] && !changes['materialId'].firstChange) {
      console.log('MaterialUsageComponent: materialId changed from', changes['materialId'].previousValue, 'to', changes['materialId'].currentValue);

      // Alte Subscriptions beenden
      this.subscriptions.forEach(sub => sub.unsubscribe());
      this.subscriptions = [];

      // Daten zurücksetzen
      this.relatedProducts = [];
      this.productMaterialUsage = {};

      // Neue Daten laden wenn materialId verfügbar ist
      if (this.materialId) {
        this.loadProductMaterialUsage();
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadProductMaterialUsage(): void {
    if (!this.materialId) {
      console.log('MaterialUsageComponent: No materialId provided, skipping load');
      return;
    }

    console.log('MaterialUsageComponent: Loading usage data for material ID:', this.materialId);

    // Verwende direkt getProductsUsingMaterial - das gibt bereits alle Produkte zurück (auch deprecated)
    const productsSub = this.productsService.getProductsUsingMaterial(this.materialId).subscribe({
      next: (products: Product[]) => {
        console.log('MaterialUsageComponent: Found', products.length, 'products using material', this.materialId);
        this.relatedProducts = products;
      },
      error: (error) => {
        console.error('Fehler beim Laden der Produkte:', error);
        this.relatedProducts = [];
      }
    });

    // Lade auch die ProductMaterial-Daten für die Mengen-Informationen
    const productMaterialsSub = this.productsService.getAllProductMaterials().subscribe({
      next: (productMaterials: ProductMaterial[]) => {
        // Filter ProductMaterials für das aktuelle Material
        const relevantProductMaterials = productMaterials.filter(pm => pm.material === this.materialId);

        // Erstelle Usage-Map
        this.productMaterialUsage = {};
        relevantProductMaterials.forEach(pm => {
          this.productMaterialUsage[pm.product] = pm.quantity_per_unit;
        });

        console.log('MaterialUsageComponent: Usage map:', this.productMaterialUsage);
      },
      error: (error) => {
        console.error('Fehler beim Laden der ProductMaterial-Daten:', error);
      }
    });

    this.subscriptions.push(productsSub, productMaterialsSub);
  }



  getProductUsage(productId: number): number | null {
    return this.productMaterialUsage[productId] || null;
  }

  formatUsage(value: number): string {
    if (!value && value !== 0) {
      return '0x';
    }

    // Ganzzahlen ohne Dezimalstellen anzeigen
    if (value % 1 === 0) {
      return `${value}x`;
    }

    // Dezimalzahlen formatieren
    const formatted = value.toFixed(2).replace(/\.?0+$/, '');
    return `${formatted}x`;
  }

  onProductImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
    }
  }
}
