// workshop-detail.component.ts
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { WorkshopService, Workshop, ProductLifecycleEntry, MaterialRequirement, MaterialStockGroup } from './workshop.service';
import { ProductsService } from '../products/products.service';
import { ProductOverviewComponent } from './product-overview/product-overview.component';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MaterialsService } from '../materials/materials.service';

// Neue Inventur-Komponenten
import { InventoryService } from './inventory/inventory.service';
import { InventoryControlsComponent } from './inventory/inventory-controls.component';
import { MaterialInventoryTableComponent, InventoryCountChangeEvent, SaveCorrectionEvent } from './inventory/material-inventory-table.component';
import { InventoryNavigatorComponent } from './inventory/inventory-navigator.component';
import { InventoryCorrectionsDialogComponent, InventoryCorrectionsDialogData } from './inventory/inventory-corrections-dialog.component';
import { BulkSaveResultDialogComponent, BulkSaveResultData } from './inventory/bulk-save-result-dialog.component';
import { MultiOrderDialogComponent } from './multi-order-dialog/multi-order-dialog.component';

@Component({
  selector: 'app-workshop-detail',
  standalone: true,
  templateUrl: './workshop-detail.component.html',
  styleUrls: ['./workshop-detail.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatExpansionModule,
    MatDialogModule,
    MatTableModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    ProductOverviewComponent,
    // Inventur-Komponenten (Dialoge werden programmatisch geöffnet)
    InventoryControlsComponent,
    MaterialInventoryTableComponent,
    InventoryNavigatorComponent,
  ],
})
export class WorkshopDetailComponent {
  private route = inject(ActivatedRoute);
  private workshopService = inject(WorkshopService);
  private productService = inject(ProductsService);
  private dialog = inject(MatDialog);
  private materialsService = inject(MaterialsService);
  public inventoryService = inject(InventoryService);

  workshopId = 0;
  workshop: Workshop | null = null;
  isLoading = true;
  stock: MaterialStockGroup[] = [];
  productLifecycle: ProductLifecycleEntry[] = [];
  includeDeprecatedMaterials = false;

  selectedProduct: ProductLifecycleEntry | null = null;
  manufactureQty = 1;
  orderQty = 1;
  materialRequirements: MaterialRequirement[] = [];
  filteredMissingRequirements: MaterialRequirement[] = [];
  filteredCoveredRequirements: MaterialRequirement[] = [];

  @ViewChild('orderDialog') orderDialog!: TemplateRef<any>;
  @ViewChild(InventoryNavigatorComponent) inventoryNavigator!: InventoryNavigatorComponent;

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.workshopId = Number(params.get('id'));
      this.loadWorkshop();
      this.loadStock();
      this.loadLifecycleOverview();
    });
  }

  manufactureProductFromChild(event: { product: ProductLifecycleEntry, quantity: number }) {
    const payload = {
      product_id: event.product.product_id,
      workshop_id: this.workshopId,
      quantity: event.quantity,
    };
    this.workshopService.manufactureProduct(payload).subscribe(() => {
      this.loadLifecycleOverview();
    });
  }

  loadWorkshop() {
    this.isLoading = true;
    this.workshopService.getAll().subscribe({
      next: (all) => {
        this.workshop = all.find((w) => w.id === this.workshopId) || null;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  loadStock() {
    this.workshopService.getStock(this.workshopId, this.includeDeprecatedMaterials).subscribe((data) => {
      this.stock = data;
    });
  }

  onStockUpdated() {
    this.loadStock();
  }

  onToggleDeprecatedMaterials() {
    this.loadStock();
  }

  loadLifecycleOverview() {
    this.workshopService.getLifecycleOverview(this.workshopId).subscribe((data) => {
      this.productLifecycle = data;
    });
  }

  openOrderModal(product: ProductLifecycleEntry) {
    this.selectedProduct = product;
    this.orderQty = 1;
    this.filteredMissingRequirements = [];
    this.filteredCoveredRequirements = [];
    this.dialog.open(this.orderDialog);
    this.loadOrderRequirements();
  }

  loadOrderRequirements() {
    if (!this.selectedProduct?.product_id || this.orderQty < 0) {
      this.filteredMissingRequirements = [];
      this.filteredCoveredRequirements = [];
      return;
    }

    this.productService
      .getMaterialRequirements(this.selectedProduct.product_id, this.orderQty, this.workshopId)
      .subscribe((data) => {
        const flattenedMaterials = data.flatMap((group) =>
          group.materials.map((material) => ({
            material_id: material.id,
            bezeichnung: material.bezeichnung,
            required_quantity: material.required_quantity,
            ordered_quantity: material.ordered_quantity,
            available_quantity: material.available_quantity,
            missing_quantity: material.missing_quantity,
            bild_url: material.bild_url ?? undefined
          }))
        );

        this.materialRequirements = flattenedMaterials;
        this.filteredMissingRequirements = flattenedMaterials.filter(m => m.missing_quantity > 0);
        this.filteredCoveredRequirements = flattenedMaterials.filter(m => m.missing_quantity <= 0);
      });
  }

  confirmOrder(dialogRef: any) {
    console.log('✅ Bestellung ausgelöst für', this.orderQty, 'x', this.selectedProduct?.product);
    console.table(this.filteredMissingRequirements);
    dialogRef.close();
  }

  openSellDialog(product: ProductLifecycleEntry) {
    console.log('🛒 Verkauf für Produkt starten:', product);
  }

  openMultiOrderModal() {
    this.dialog.open(MultiOrderDialogComponent, {
      width: '95vw',
      maxWidth: 'none',
      height: '95vh',
      autoFocus: false,
      data: {
        workshopId: this.workshopId,
        workshopName: this.workshop?.name || '',
        productLifecycle: this.productLifecycle
      }
    });
  }



  // Neue service-basierte Inventur-Methoden

  // Inventurmodus umschalten
  onInventoryModeToggle(): void {
    if (this.inventoryNavigator) {
      const currentState = this.inventoryService.currentState;
      if (currentState.isActive) {
        this.inventoryNavigator.stopInventoryMode();
      } else {
        this.inventoryNavigator.startInventoryMode();
      }
    }
  }

  // Navigation starten
  onStartNavigation(): void {
    try {
      this.inventoryService.startNavigation();
    } catch (error) {
      alert('Keine Materialien zum Inventarisieren gefunden.');
    }
  }

  // Inventurzählung ändern
  onInventoryCountChange(event: any): void {
    const typedEvent = event as InventoryCountChangeEvent;
    this.inventoryService.setInventoryCount(typedEvent.materialId, typedEvent.count);
  }

  // Einzelne Korrektur speichern
  onSaveCorrection(event: any): void {
    const typedEvent = event as SaveCorrectionEvent;
    const currentState = this.inventoryService.currentState;
    const inventoryCount = currentState.inventoryCounts[typedEvent.materialId];

    if (inventoryCount === undefined || inventoryCount < 0) {
      alert('Bitte geben Sie eine gültige Inventurmenge ein.');
      return;
    }

    this.inventoryService.markMaterialAsSaved(typedEvent.materialId);
    this.saveInventoryCorrection(typedEvent.materialId, typedEvent.materialName);
  }

  // Alle Korrekturen speichern
  async onSaveAllInventoryCorrections(): Promise<void> {
    const currentState = this.inventoryService.currentState;
    const inventoryCounts = currentState.inventoryCounts;

    // Nur Materialien mit tatsächlichen Korrekturen sammeln
    const correctionItems: Array<{materialId: number, materialName: string, inventoryCount: number, currentStock: number}> = [];

    Object.keys(inventoryCounts).forEach(materialIdStr => {
      const materialId = parseInt(materialIdStr, 10);
      const inventoryCount = inventoryCounts[materialId];

      // Nur Materialien mit gültigen Inventurmengen verarbeiten
      if (inventoryCount !== undefined && inventoryCount !== null && inventoryCount >= 0) {
        // Material und aktuellen Bestand finden
        const material = this.allMaterials.find(m => m.id === materialId);
        if (material) {
          const currentStock = material.bestand || 0;

          // Nur hinzufügen, wenn sich der Bestand tatsächlich ändert
          if (inventoryCount !== currentStock) {
            correctionItems.push({
              materialId,
              materialName: material.bezeichnung,
              inventoryCount,
              currentStock
            });
          }
        }
      }
    });

    if (correctionItems.length === 0) {
      alert('Keine Inventurkorrekturen vorhanden - alle Bestände sind bereits korrekt.');
      return;
    }

    // Dialog zur Bestätigung öffnen
    const dialogRef = this.dialog.open(InventoryCorrectionsDialogComponent, {
      width: '600px',
      data: { corrections: correctionItems }
    });

    // Warten auf Benutzerentscheidung
    const confirmed = await dialogRef.afterClosed().toPromise();
    if (!confirmed) {
      return;
    }

    // Alle Korrekturen parallel speichern
    let savedCount = 0;
    let errorCount = 0;
    const totalCount = correctionItems.length;

    correctionItems.forEach(async (item) => {
      try {
        await this.saveInventoryCorrection(item.materialId, item.materialName);
        savedCount++;

        if (savedCount + errorCount === totalCount) {
          this.finishBulkSave(savedCount, errorCount);
        }
      } catch (error) {
        console.error(`Fehler beim Speichern von ${item.materialName}:`, error);
        errorCount++;

        if (savedCount + errorCount === totalCount) {
          this.finishBulkSave(savedCount, errorCount);
        }
      }
    });
  }

  private finishBulkSave(savedCount: number, errorCount: number): void {
    const totalCount = savedCount + errorCount;

    // Ergebnis-Dialog anzeigen
    this.dialog.open(BulkSaveResultDialogComponent, {
      width: '400px',
      data: {
        savedCount,
        errorCount,
        totalCount
      }
    });

    // Bestandsdaten nach dem Bulk-Save neu laden
    this.loadWorkshop();
    this.loadStock();
  }

  // Hilfsmethoden und Getter für Template-Bindungen

  get allMaterials() {
    return this.stock.flatMap(group => group.materials);
  }

  get emptySavedMaterialIds() {
    return new Set<number>();
  }

  getTotalMaterialCount(): number {
    return this.stock.reduce((total, group) => total + group.materials.length, 0);
  }

  getUnsavedInventoryCount(): number {
    const currentState = this.inventoryService.currentState;
    return Object.keys(currentState.inventoryCounts).length - currentState.savedMaterialIds.size;
  }

  onStartInventoryNavigation(): void {
    if (this.inventoryNavigator) {
      this.inventoryNavigator.startInventoryMode();
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
        const result = await this.materialsService.createInventoryCorrection(materialId, correctionData).toPromise();
        this.inventoryService.markMaterialAsSaved(materialId);
        // Kein loadWorkshop() hier - aktualisiere nur lokal um Page-Refresh zu vermeiden
        this.updateLocalMaterialStock(materialId, inventoryCount);
      } catch (error: any) {
        // Spezielle Behandlung für "Bestand ist bereits korrekt"
        const errorMessages = error?.error;
        if (error?.status === 400 &&
            ((Array.isArray(errorMessages) && errorMessages.includes('Der Bestand ist bereits korrekt.')) ||
             (errorMessages?.non_field_errors?.includes?.('Der Bestand ist bereits korrekt.')))) {
          // Bestand ist bereits korrekt - behandle als erfolgreich
          this.inventoryService.markMaterialAsSaved(materialId);
          // Kein loadWorkshop() - Bestand ist bereits korrekt
          return;
        }
        throw error;
      }
    }
  }

  // Aktualisiert den Bestand eines Materials lokal ohne kompletten Reload
  private updateLocalMaterialStock(materialId: number, newStock: number): void {
    // Durchsuche alle Kategorien und aktualisiere das Material
    this.stock.forEach(category => {
      const material = category.materials.find(m => m.id === materialId);
      if (material) {
        material.bestand = newStock;
      }
    });
  }


}
