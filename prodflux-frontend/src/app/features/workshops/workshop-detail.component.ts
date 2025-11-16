// workshop-detail.component.ts
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
import { MaterialsService } from '../materials/materials.service';

@Component({
  selector: 'app-workshop-detail',
  standalone: true,
  templateUrl: './workshop-detail.component.html',
  styleUrls: ['./workshop-detail.component.scss'],
  imports: [
    CommonModule,
    RouterLink,
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
    ProductOverviewComponent,
  ],
})
export class WorkshopDetailComponent {
  private route = inject(ActivatedRoute);
  private workshopService = inject(WorkshopService);
  private productService = inject(ProductsService);
  private dialog = inject(MatDialog);
  private materialsService = inject(MaterialsService);

  workshopId = 0;
  workshop: Workshop | null = null;
  stock: MaterialStockGroup[] = [];
  productLifecycle: ProductLifecycleEntry[] = [];

  // Inventurmodus
  inventoryMode = false;
  inventoryCounts: { [materialId: number]: number } = {};

  // Navigation durch Materialien
  currentMaterialIndex = 0;
  allMaterials: any[] = [];
  inventoryNavigationMode = false;
  processedMaterialIds: Set<number> = new Set();
  savedMaterialIds: Set<number> = new Set();

  selectedProduct: ProductLifecycleEntry | null = null;
  manufactureQty = 1;
  orderQty = 1;
  materialRequirements: MaterialRequirement[] = [];
  filteredMissingRequirements: MaterialRequirement[] = [];
  filteredCoveredRequirements: MaterialRequirement[] = [];
  multiOrderProducts: { product_id: number; product: string; quantity: number }[] = [];

  @ViewChild('orderDialog') orderDialog!: TemplateRef<any>;
  @ViewChild('multiOrderDialog') multiOrderDialog!: TemplateRef<any>;
  @ViewChild('inventoryCompletionDialog') inventoryCompletionDialog!: TemplateRef<any>;

  inventoryDialogData = { processedCount: 0, savedCount: 0, totalCount: 0 };

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
    this.workshopService.getAll().subscribe((all) => {
      this.workshop = all.find((w) => w.id === this.workshopId) || null;
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

  // Inventurmodus-Methoden
  toggleInventoryMode() {
    this.inventoryMode = !this.inventoryMode;
    if (this.inventoryMode) {
      // Aktuelle Bestände als Standardwerte setzen
      this.initializeInventoryCounts();
      this.initializeMaterialNavigation();
    } else {
      // Inventar-Zählungen zurücksetzen
      this.inventoryCounts = {};
      this.inventoryNavigationMode = false;
      this.currentMaterialIndex = 0;
      this.allMaterials = [];
      this.processedMaterialIds.clear();
      this.savedMaterialIds.clear();
    }
  }

  initializeInventoryCounts() {
    this.inventoryCounts = {};
    this.stock.forEach(group => {
      group.materials.forEach(material => {
        this.inventoryCounts[material.id] = material.bestand || 0;
      });
    });
  }

  saveInventoryCorrection(materialId: number, materialName: string) {
    const inventoryCount = this.inventoryCounts[materialId];
    if (inventoryCount === undefined || inventoryCount < 0) {
      alert('Bitte geben Sie eine gültige Inventurmenge ein.');
      return;
    }

    const correctionData = {
      workshop_id: this.workshopId,
      inventory_count: inventoryCount,
      note: `Inventurkorrektur für ${materialName}`
    };

    this.materialsService.createInventoryCorrection(materialId, correctionData).subscribe({
      next: (response) => {
        console.log('Inventurkorrektur erfolgreich erstellt:', response);
        this.savedMaterialIds.add(materialId);
        // Bestände neu laden
        this.loadStock();
      },
      error: (error) => {
        console.error('Fehler beim Erstellen der Inventurkorrektur:', error);
        alert('Fehler beim Speichern der Inventurkorrektur. Bitte versuchen Sie es erneut.');
      }
    });
  }

  saveAllInventoryCorrections() {
    const corrections = Object.keys(this.inventoryCounts).length;
    if (corrections === 0) {
      alert('Keine Inventurzählungen zum Speichern vorhanden.');
      return;
    }

    let savedCount = 0;
    let errorCount = 0;

    // Material-Namen für bessere Benachrichtigungen sammeln
    const materialNames: { [id: number]: string } = {};
    this.stock.forEach(group => {
      group.materials.forEach(material => {
        materialNames[material.id] = material.bezeichnung;
      });
    });

    // Alle Korrekturen sequenziell abarbeiten
    const materialIds = Object.keys(this.inventoryCounts).map(id => parseInt(id));

    materialIds.forEach((materialId, index) => {
      const inventoryCount = this.inventoryCounts[materialId];
      const materialName = materialNames[materialId] || `Material ${materialId}`;

      if (inventoryCount >= 0) {
        const correctionData = {
          workshop_id: this.workshopId,
          inventory_count: inventoryCount,
          note: `Inventurkorrektur für ${materialName}`
        };

        this.materialsService.createInventoryCorrection(materialId, correctionData).subscribe({
          next: (response) => {
            savedCount++;
            if (savedCount + errorCount === materialIds.length) {
              this.finishInventoryCorrections(savedCount, errorCount);
            }
          },
          error: (error) => {
            console.error(`Fehler bei Inventurkorrektur für ${materialName}:`, error);
            errorCount++;
            if (savedCount + errorCount === materialIds.length) {
              this.finishInventoryCorrections(savedCount, errorCount);
            }
          }
        });
      } else {
        errorCount++;
        if (savedCount + errorCount === materialIds.length) {
          this.finishInventoryCorrections(savedCount, errorCount);
        }
      }
    });
  }

  private finishInventoryCorrections(savedCount: number, errorCount: number) {
    if (errorCount > 0) {
      alert(`Inventur abgeschlossen. ${savedCount} Korrekturen gespeichert, ${errorCount} Fehler aufgetreten.`);
    } else {
      alert(`Inventur erfolgreich abgeschlossen. ${savedCount} Korrekturen gespeichert.`);
    }

    // Inventurmodus beenden und Bestände neu laden
    this.inventoryMode = false;
    this.inventoryCounts = {};
    this.loadStock();
  }

  getInventoryCountsLength(): number {
    return Object.keys(this.inventoryCounts).length;
  }

  getDisplayedColumns(): string[] {
    if (this.inventoryMode) {
      return ['nr', 'bild', 'bezeichnung', 'bestand', 'inventurmenge', 'inventur-aktionen'];
    } else {
      return ['nr', 'bild', 'bezeichnung', 'bestand'];
    }
  }

  // Material-Navigation
  initializeMaterialNavigation() {
    // Alle Materialien aus allen Gruppen sammeln
    this.allMaterials = [];
    this.stock.forEach(group => {
      group.materials.forEach(material => {
        this.allMaterials.push({
          ...material,
          categoryName: group.category_name
        });
      });
    });
    this.currentMaterialIndex = 0;
  }

  startInventoryNavigation() {
    if (this.allMaterials.length === 0) {
      alert('Keine Materialien zum Inventarisieren gefunden.');
      return;
    }
    this.inventoryNavigationMode = true;
    this.currentMaterialIndex = 0;
    this.processedMaterialIds.clear();
    this.savedMaterialIds.clear();

    // Aktuelles Material als bearbeitet markieren
    const currentMaterial = this.getCurrentMaterial();
    if (currentMaterial) {
      this.processedMaterialIds.add(currentMaterial.id);
    }

    // Fokus auf das Eingabefeld setzen
    setTimeout(() => {
      const input = document.querySelector('.inventory-navigation input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  }

  getCurrentMaterial() {
    return this.allMaterials[this.currentMaterialIndex];
  }

  goToNextMaterial() {
    if (this.currentMaterialIndex < this.allMaterials.length - 1) {
      this.currentMaterialIndex++;
      const currentMaterial = this.getCurrentMaterial();
      if (currentMaterial) {
        this.processedMaterialIds.add(currentMaterial.id);
      }
      this.focusCurrentInput();
    }
  }

  goToPreviousMaterial() {
    if (this.currentMaterialIndex > 0) {
      this.currentMaterialIndex--;
      const currentMaterial = this.getCurrentMaterial();
      if (currentMaterial) {
        this.processedMaterialIds.add(currentMaterial.id);
      }
      this.focusCurrentInput();
    }
  }

  private focusCurrentInput() {
    setTimeout(() => {
      const input = document.querySelector('.inventory-navigation input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  }

  saveCurrentAndNext() {
    const currentMaterial = this.getCurrentMaterial();
    if (currentMaterial && this.inventoryCounts[currentMaterial.id] !== undefined) {
      const inventoryCount = this.inventoryCounts[currentMaterial.id];

      if (inventoryCount === undefined || inventoryCount < 0) {
        alert('Bitte geben Sie eine gültige Inventurmenge ein.');
        return;
      }

      const correctionData = {
        workshop_id: this.workshopId,
        inventory_count: inventoryCount,
        note: `Inventurkorrektur für ${currentMaterial.bezeichnung}`
      };

      // Material als gespeichert markieren (für UI-Feedback)
      this.savedMaterialIds.add(currentMaterial.id);

      this.materialsService.createInventoryCorrection(currentMaterial.id, correctionData).subscribe({
        next: (response) => {
          console.log('Inventurkorrektur erfolgreich erstellt:', response);

          // Bestände neu laden
          this.loadStock();

          // Nach erfolgreichem Speichern zum nächsten Material
          if (this.currentMaterialIndex < this.allMaterials.length - 1) {
            this.goToNextMaterial();
          } else {
            // Alle Materialien durchgegangen
            this.finishInventoryNavigation();
          }
        },
        error: (error) => {
          console.error('Fehler beim Erstellen der Inventurkorrektur:', error);
          alert('Fehler beim Speichern der Inventurkorrektur. Bitte versuchen Sie es erneut.');
          // Material als nicht gespeichert markieren bei Fehler
          this.savedMaterialIds.delete(currentMaterial.id);
        }
      });
    }
  }  finishInventoryNavigation() {
    this.inventoryNavigationMode = false;

    const processedCount = this.processedMaterialIds.size;
    const savedCount = this.savedMaterialIds.size;

    // Dialog öffnen
    this.openInventoryCompletionDialog(processedCount, savedCount);
  }

  onInventoryKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.saveCurrentAndNext();
    } else if (event.key === 'ArrowRight' || event.key === 'Tab') {
      event.preventDefault();
      this.goToNextMaterial();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.goToPreviousMaterial();
    }
  }

  getInventoryProgress(): string {
    if (this.allMaterials.length === 0) return '0/0';
    return `${this.currentMaterialIndex + 1}/${this.allMaterials.length}`;
  }

  onImageError(event: Event) {
    // Bild konnte nicht geladen werden, verstecke es
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
    }
  }

  openInventoryCompletionDialog(processedCount: number, savedCount: number) {
    const dialogRef = this.dialog.open(this.inventoryCompletionDialog, {
      width: '450px',
      data: {
        processedCount,
        savedCount,
        totalCount: this.allMaterials.length
      }
    });

    // Daten für den Dialog setzen
    this.inventoryDialogData = {
      processedCount,
      savedCount,
      totalCount: this.allMaterials.length
    };

    dialogRef.afterClosed().subscribe(() => {
      // Dialog wurde geschlossen, Sets zurücksetzen
      this.processedMaterialIds.clear();
      this.savedMaterialIds.clear();
    });
  }
}
