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
import { InventoryNavigatorComponent, NavigationEvent, SaveAndNextEvent } from './inventory/inventory-navigator.component';
import { InventoryCompletionDialogComponent, InventoryCompletionData } from './inventory/inventory-completion-dialog.component';
import { InventoryCorrectionsDialogComponent, InventoryCorrectionsDialogData } from './inventory/inventory-corrections-dialog.component';
import { BulkSaveResultDialogComponent, BulkSaveResultData } from './inventory/bulk-save-result-dialog.component';

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

  selectedProduct: ProductLifecycleEntry | null = null;
  manufactureQty = 1;
  orderQty = 1;
  materialRequirements: MaterialRequirement[] = [];
  filteredMissingRequirements: MaterialRequirement[] = [];
  filteredCoveredRequirements: MaterialRequirement[] = [];
  multiOrderProducts: { product_id: number; product: string; quantity: number }[] = [];

  @ViewChild('orderDialog') orderDialog!: TemplateRef<any>;
  @ViewChild('multiOrderDialog') multiOrderDialog!: TemplateRef<any>;

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
    this.workshopService.getStock(this.workshopId).subscribe((data) => {
      this.stock = data;
    });
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
    console.log('TemplateRef:', this.multiOrderDialog);
    if (!this.multiOrderDialog) {
      console.error('❌ multiOrderDialog not available!');
      return;
    }

    this.multiOrderProducts = this.productLifecycle.map((p) => ({
      product_id: p.product_id,
      product: p.product,
      quantity: 0,
    }));
    this.filteredMissingRequirements = [];
    this.filteredCoveredRequirements = [];
    this.dialog.open(this.multiOrderDialog, {
      width: '95vw',
      maxWidth: 'none',
      height: '95vh',
      autoFocus: false
    });
  }

  loadAggregatedRequirements() {
    const products = this.multiOrderProducts
      .filter((p) => p.quantity > 0)
      .map((p) => ({ product_id: p.product_id, quantity: p.quantity }));

    if (!products.length || !this.workshop) {
      this.materialRequirements = [];
      this.filteredMissingRequirements = [];
      this.filteredCoveredRequirements = [];
      return;
    }

    this.workshopService
      .getAggregatedRequirements(this.workshop.id, products)
      .subscribe((data) => {
        this.materialRequirements = data;
        this.filteredMissingRequirements = data.filter(m => m.missing_quantity > 0);
        this.filteredCoveredRequirements = data.filter(m => m.missing_quantity <= 0);
      });
  }

  confirmAggregatedOrder(dialogRef: any) {
    const werkstattName = this.workshop?.name ?? '[Unbekannte Werkstatt]';

    const bestellteProdukte = this.multiOrderProducts
      .filter(p => p.quantity > 0)
      .map(p => `- ${p.product}: ${p.quantity} Stück`)
      .join('\n');

    const formatTableRow = (m: MaterialRequirement) => {
      return `${m.bezeichnung.padEnd(75)} | ${String(m.required_quantity).padStart(8)} | ${String(m.ordered_quantity).padStart(8)} | ${String(m.available_quantity).padStart(9)} | ${String(m.missing_quantity).padStart(7)}`;
    };

    const fehlendeHeader = `Material                                                             | Benötigt | Bestellt | Vorhanden | Fehlend\n` +
                           `---------------------------------------------------------------------|----------|----------|-----------|--------`;

    const gedeckteHeader = `Material                                                            | Benötigt | Bestellt | Vorhanden | Fehlend\n` +
                           `--------------------------------------------------------------------|----------|----------|-----------|--------`;

    const fehlendeMaterialien = this.filteredMissingRequirements.map(formatTableRow).join('\n');
    const gedeckteMaterialien = this.filteredCoveredRequirements.map(formatTableRow).join('\n');

    const body = encodeURIComponent(
      `Materialbedarf für folgende Produkte:\n\n` +
      `${bestellteProdukte}\n\n` +
      `In der Werkstatt "${werkstattName}" werden folgende Materialien benötigt:\n\n` +
      `${fehlendeHeader}\n${fehlendeMaterialien || '(keine)'}\n\n` +
      `Folgende Bestände sind bereits gedeckt:\n\n` +
      `${gedeckteHeader}\n${gedeckteMaterialien || '(keine)'}\n`
    );

    const subject = encodeURIComponent(`Materialbedarf für Werkstatt ${werkstattName}`);
    const mailto = `mailto:info@sdlink.de?subject=${subject}&body=${body}`;

    window.location.href = mailto;
    dialogRef.close();
  }

  // Neue service-basierte Inventur-Methoden

  // Inventurmodus umschalten
  onInventoryModeToggle(): void {
    const currentState = this.inventoryService.currentState;

    if (currentState.isActive) {
      this.inventoryService.resetInventory();
    } else {
      // Alle Materialien aus den Gruppen sammeln
      const allMaterials: any[] = [];
      this.stock.forEach(group => {
        group.materials.forEach(material => {
          allMaterials.push(material);
        });
      });
      this.inventoryService.initializeInventory(allMaterials);
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

    const correctionData = {
      workshop_id: this.workshopId,
      inventory_count: inventoryCount,
      note: `Inventurkorrektur für ${typedEvent.materialName}`
    };

    this.inventoryService.markMaterialAsSaved(typedEvent.materialId);

    this.saveInventoryCorrection(typedEvent.materialId, typedEvent.materialName);
  }

    // Navigation zwischen Materialien
  onNavigation(event: NavigationEvent): void {
    if (event.direction === 'next') {
      this.inventoryService.goToNext();
    } else {
      this.inventoryService.goToPrevious();
    }
  }

  // Speichern und weiter
  onSaveAndNext(event: SaveAndNextEvent): void {
    // Inventurmenge im Service aktualisieren
    this.inventoryService.setInventoryCount(event.materialId, event.inventoryCount);

    // Korrektur speichern
    this.saveInventoryCorrection(event.materialId, event.materialName).then(() => {
      // Zum nächsten Material wechseln
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
    });
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

  // Navigation-spezifische Hilfsmethoden
  getCurrentMaterial(): any | null {
    const currentState = this.inventoryService.currentState;
    if (!currentState.isNavigationMode || currentState.allMaterials.length === 0) {
      return null;
    }
    return currentState.allMaterials[currentState.currentMaterialIndex] || null;
  }

  getCurrentInventoryCount(): number | undefined {
    const currentMaterial = this.getCurrentMaterial();
    if (!currentMaterial) return undefined;

    const currentState = this.inventoryService.currentState;
    return currentState.inventoryCounts[currentMaterial.id];
  }

  canGoToNextMaterial(): boolean {
    const currentState = this.inventoryService.currentState;
    return currentState.currentMaterialIndex < currentState.allMaterials.length - 1;
  }

  canGoToPreviousMaterial(): boolean {
    const currentState = this.inventoryService.currentState;
    return currentState.currentMaterialIndex > 0;
  }

  onInventoryCountChanged(count: number): void {
    const currentMaterial = this.getCurrentMaterial();
    if (currentMaterial) {
      this.inventoryService.setInventoryCount(currentMaterial.id, count);
    }
  }

  // Event-Handler für die neuen Komponenten

  onStartInventoryNavigation(): void {
    try {
      // Erst prüfen, ob Materialien im Service vorhanden sind
      const currentState = this.inventoryService.currentState;
      if (currentState.allMaterials.length === 0) {
        // Falls nicht, Materialien initialisieren
        const allMaterials: any[] = [];
        this.stock.forEach(group => {
          group.materials.forEach(material => {
            allMaterials.push(material);
          });
        });
        this.inventoryService.initializeInventory(allMaterials);
      }

      // Dann Navigation starten
      this.inventoryService.startNavigation();
    } catch (error) {
      console.error('Fehler beim Starten der Inventur-Navigation:', error);
      alert('Keine Materialien zum Inventarisieren gefunden.');
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
        await this.loadWorkshop();
      } catch (error: any) {
        // Spezielle Behandlung für "Bestand ist bereits korrekt"
        const errorMessages = error?.error;
        if (error?.status === 400 &&
            ((Array.isArray(errorMessages) && errorMessages.includes('Der Bestand ist bereits korrekt.')) ||
             (errorMessages?.non_field_errors?.includes?.('Der Bestand ist bereits korrekt.')))) {
          // Bestand ist bereits korrekt - behandle als erfolgreich
          this.inventoryService.markMaterialAsSaved(materialId);
          await this.loadWorkshop();
          return;
        }
        throw error;
      }
    }
  }


}
