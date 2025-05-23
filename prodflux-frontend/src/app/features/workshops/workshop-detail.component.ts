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
    ProductOverviewComponent,
  ],
})
export class WorkshopDetailComponent {
  private route = inject(ActivatedRoute);
  private workshopService = inject(WorkshopService);
  private productService = inject(ProductsService);
  private dialog = inject(MatDialog);

  workshopId = 0;
  workshop: Workshop | null = null;
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
}
