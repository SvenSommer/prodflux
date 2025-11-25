import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, HostListener, ViewChild, ElementRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MaterialUsageComponent } from '../../../shared/components/material-usage/material-usage.component';
import { InventoryService, InventoryProgress } from './inventory.service';
import { MaterialStockMaterial, MaterialStockGroup } from '../workshop.service';
import { ProductsService, Product } from '../../products/products.service';
import { MaterialsService } from '../../materials/materials.service';
import { InventoryCompletionDialogComponent, InventoryCompletionData } from './inventory-completion-dialog.component';
import { Subscription } from 'rxjs';

export interface NavigationEvent {
  direction: 'next' | 'previous';
}

export interface SaveAndNextEvent {
  materialId: number;
  materialName: string;
  inventoryCount: number;
}

@Component({
  selector: 'app-inventory-navigator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MaterialUsageComponent
  ],
  templateUrl: './inventory-navigator.component.html',
  styleUrls: ['./inventory-navigator.component.scss']
})
export class InventoryNavigatorComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @ViewChild('inventoryInput') inventoryInput!: ElementRef<HTMLInputElement>;

  // Input-Properties aus Workshop-Detail
  @Input() workshopId!: number;
  @Input() stock: MaterialStockGroup[] = [];

  // Output-Events für Parent-Komponente
  @Output() stockUpdated = new EventEmitter<void>();

  // Interne Properties
  isVisible = false;
  currentMaterial: MaterialStockMaterial | null = null;
  inventoryCount: number | undefined = undefined;
  canGoToNext = false;
  canGoToPrevious = false;

  progress: InventoryProgress = {
    processedCount: 0,
    savedCount: 0,
    totalCount: 0,
    currentIndex: 0,
    progressPercentage: 0
  };

  relatedProducts: Product[] = [];
  productMaterialUsage: { [productId: number]: number } = {};
  shouldFocus = false;
  private subscription: Subscription = new Subscription();
  private lastLoadedMaterialId: number | null = null;

  private dialog = inject(MatDialog);
  private inventoryService = inject(InventoryService);
  private productsService = inject(ProductsService);
  private materialsService = inject(MaterialsService);

  ngOnInit(): void {
    // Subscribe to inventory state changes
    this.subscription.add(
      this.inventoryService.state$.subscribe((state) => {
        this.isVisible = state.isNavigationMode;
        this.progress = this.inventoryService.getProgress();
        this.updateNavigationState();

        // Material aktualisieren wenn Index sich ändert
        if (state.isNavigationMode && state.allMaterials.length > 0) {
          this.currentMaterial = state.allMaterials[state.currentMaterialIndex] || null;
          this.inventoryCount = state.inventoryCounts[this.currentMaterial?.id || 0];
        }
      })
    );
  }

  ngOnChanges(): void {
    // Reload products only when current material actually changes
    if (this.currentMaterial && this.currentMaterial.id !== this.lastLoadedMaterialId) {
      this.lastLoadedMaterialId = this.currentMaterial.id;
      this.loadRelatedProducts();
      this.focusInventoryInput();
    } else if (this.currentMaterial) {
      this.focusInventoryInput();
    } else {
      this.lastLoadedMaterialId = null;
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.focusInventoryInput();
  }

  // Inventur-Steuerungs-Methoden (aus workshop-detail übertragen)

  startInventoryMode(): void {
    const allMaterials: MaterialStockMaterial[] = [];
    this.stock.forEach(group => {
      group.materials.forEach(material => {
        allMaterials.push(material);
      });
    });

    if (allMaterials.length === 0) {
      alert('Keine Materialien zum Inventarisieren gefunden.');
      return;
    }

    this.inventoryService.initializeInventory(allMaterials);
    this.inventoryService.startNavigation();
  }

  stopInventoryMode(): void {
    this.inventoryService.resetInventory();
  }

  // Navigation zwischen Materialien
  onNavigation(event: NavigationEvent): void {
    const currentMaterial = this.currentMaterial;
    const currentCount = this.inventoryCount;

    if (currentMaterial && currentCount !== undefined && currentCount !== null) {
      this.inventoryService.setInventoryCount(currentMaterial.id, currentCount);
    }

    if (event.direction === 'next') {
      this.inventoryService.goToNext();
    } else {
      this.inventoryService.goToPrevious();
    }
  }

  onNavigate(direction: 'next' | 'previous'): void {
    this.onNavigation({ direction });
  }

  // Speichern und weiter
  onSaveAndNext(): void {
    if (this.currentMaterial && this.inventoryCount !== undefined && this.inventoryCount >= 0) {
      this.inventoryService.setInventoryCount(this.currentMaterial.id, this.inventoryCount);

      this.saveInventoryCorrection(this.currentMaterial.id, this.currentMaterial.bezeichnung).then(() => {
        if (this.canGoToNextMaterial()) {
          this.inventoryService.goToNext();
        } else {
          this.onFinishInventory();
        }
      }).catch((error) => {
        console.error('Fehler beim Speichern der Inventurkorrektur:', error);
        alert('Fehler beim Speichern der Inventurkorrektur. Bitte versuchen Sie es erneut.');
      });
    }
  }

  // Inventur beenden
  onFinishInventory(): void {
    const progress = this.inventoryService.getProgress();

    const dialogData: InventoryCompletionData = {
      processedCount: progress.processedCount,
      savedCount: progress.savedCount,
      totalCount: progress.totalCount
    };

    const dialogRef = this.dialog.open(InventoryCompletionDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: dialogData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(() => {
      this.inventoryService.finishNavigation();
      this.stockUpdated.emit(); // Signal an Parent zum Neuladen
    });
  }

  // Inventurzählung ändern
  onInventoryCountChanged(count: number): void {
    this.inventoryCount = count;
    if (this.currentMaterial) {
      this.inventoryService.setInventoryCount(this.currentMaterial.id, count);
    }
  }

  // Private Hilfsmethoden

  private async saveInventoryCorrection(materialId: number, materialName: string): Promise<void> {
    const currentState = this.inventoryService.currentState;
    const inventoryCount = currentState.inventoryCounts[materialId];

    if (inventoryCount !== undefined && inventoryCount !== null) {
      const correctionData = {
        workshop_id: this.workshopId,
        inventory_count: inventoryCount,
        note: `Inventurkorrektur für ${materialName}`
      };

      try {
        await this.materialsService.createInventoryCorrection(materialId, correctionData).toPromise();
        this.inventoryService.markMaterialAsSaved(materialId);
        this.updateLocalMaterialStock(materialId, inventoryCount);
      } catch (error: any) {
        const errorMessages = error?.error;
        if (error?.status === 400 &&
            ((Array.isArray(errorMessages) && errorMessages.includes('Der Bestand ist bereits korrekt.')) ||
             (errorMessages?.non_field_errors?.includes?.('Der Bestand ist bereits korrekt.')))) {
          this.inventoryService.markMaterialAsSaved(materialId);
          return;
        }
        throw error;
      }
    }
  }

  private updateLocalMaterialStock(materialId: number, newStock: number): void {
    this.stock.forEach(category => {
      const material = category.materials.find(m => m.id === materialId);
      if (material) {
        material.bestand = newStock;
      }
    });
  }

  private updateNavigationState(): void {
    const currentState = this.inventoryService.currentState;
    this.canGoToNext = currentState.currentMaterialIndex < currentState.allMaterials.length - 1;
    this.canGoToPrevious = currentState.currentMaterialIndex > 0;
  }

  private canGoToNextMaterial(): boolean {
    const currentState = this.inventoryService.currentState;
    return currentState.currentMaterialIndex < currentState.allMaterials.length - 1;
  }

  private canGoToPreviousMaterial(): boolean {
    const currentState = this.inventoryService.currentState;
    return currentState.currentMaterialIndex > 0;
  }

  private loadRelatedProducts(): void {
    if (!this.currentMaterial) {
      this.relatedProducts = [];
      this.productMaterialUsage = {};
      return;
    }

    this.subscription.add(
      this.productsService.getProductsUsingMaterial(this.currentMaterial.id).subscribe({
        next: (products) => {
          this.relatedProducts = products;
          this.loadProductMaterialUsage();
        },
        error: (error) => {
          console.error('❌ Fehler beim Laden der Produktinformationen:', error);
          this.relatedProducts = [];
          this.productMaterialUsage = {};
        }
      })
    );
  }

  private loadProductMaterialUsage(): void {
    if (!this.currentMaterial) return;

    this.subscription.add(
      this.productsService.getAllProductMaterials().subscribe({
        next: (allProductMaterials: any[]) => {
          const relevantMaterials = allProductMaterials.filter((pm: any) => pm.material === this.currentMaterial!.id);

          this.productMaterialUsage = {};
          relevantMaterials.forEach((pm: any) => {
            this.productMaterialUsage[pm.product] = pm.quantity_per_unit;
          });
        },
        error: (error: any) => {
          console.error('❌ Fehler beim Laden aller ProductMaterials:', error);
          this.relatedProducts.forEach(product => {
            this.productMaterialUsage[product.id] = 1;
          });
        }
      })
    );
  }

  private focusInventoryInput(): void {
    setTimeout(() => {
      if (this.inventoryInput && this.isVisible) {
        const inputElement = this.inventoryInput.nativeElement;
        inputElement.focus();
        if (inputElement.value) {
          inputElement.select();
        }
      }
    }, 100);
  }

  // Event-Handler für Template

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isVisible) {
      return;
    }

    if (event.key === 'ArrowRight') {
      if (this.canGoToNext) {
        event.preventDefault();
        this.onNavigate('next');
      }
    } else if (event.key === 'ArrowLeft') {
      if (this.canGoToPrevious) {
        event.preventDefault();
        this.onNavigate('previous');
      }
    }
  }

  onInputKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSaveAndNext();
    }
  }

  onInputFocus(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.value) {
      input.select();
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
    }
  }

  onProductImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
    }
  }

  // Template Hilfsmethoden

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  getProductTooltip(product: Product): string {
    const productName = product.bezeichnung || 'Unbekanntes Produkt';
    const usage = this.productMaterialUsage[product.id];

    if (usage !== undefined && usage > 0) {
      const usageText = usage === 1 ? '1 Stück' : `${usage} Stück`;
      return `${productName}\nVerbrauch: ${usageText} pro Produkt`;
    }

    return productName;
  }

  getProductUsage(productId: number): number | null {
    const usage = this.productMaterialUsage[productId];
    const numericUsage = usage !== undefined ? Number(usage) : null;
    return (numericUsage !== null && numericUsage > 0) ? numericUsage : null;
  }

  formatUsage(value: number): string {
    if (Number.isInteger(value)) {
      return `${Math.round(value)}x`;
    }

    const formatted = Number(value.toFixed(2));

    if (Number.isInteger(formatted)) {
      return `${formatted}x`;
    }

    return `${formatted}x`;
  }
}
