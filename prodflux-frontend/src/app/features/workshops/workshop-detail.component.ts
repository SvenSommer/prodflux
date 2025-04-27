import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { WorkshopService, Workshop, ProductLifecycleEntry, MaterialRequirement, MaterialStockGroup } from './workshop.service';



@Component({
  selector: 'app-workshop-detail',
  standalone: true,
  templateUrl: './workshop-detail.component.html',
  styleUrls: ['./workshop-detail.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    RouterLink,
    MatTableModule,
    MatMenu,
    MatIcon,
    MatExpansionModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatDialogModule,
  ],
})
export class WorkshopDetailComponent {
  private route = inject(ActivatedRoute);
  private workshopService = inject(WorkshopService);
  private dialog = inject(MatDialog);

  workshopId = 0;
  workshop: Workshop | null = null;


  stock: MaterialStockGroup[] = [];
  displayedColumns = ['nr', 'bild', 'bezeichnung', 'bestand'];

  productLifecycle: ProductLifecycleEntry[] = [];

  selectedProduct: ProductLifecycleEntry | null = null;
  manufactureQty = 1;
  orderQty = 1;

  materialRequirements: MaterialRequirement[] = [];
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

  manufactureProduct() {
    if (!this.selectedProduct || this.manufactureQty < 1) return;

    const payload = {
      product_id: this.selectedProduct.product_id,
      workshop_id: this.workshopId,
      quantity: this.manufactureQty,
    };

    this.workshopService.manufactureProduct(payload).subscribe(() => {
      this.loadLifecycleOverview();
      this.manufactureQty = 1;
    });
  }

  openOrderModal(product: ProductLifecycleEntry) {
    this.selectedProduct = product;
    this.orderQty = 1;
    this.materialRequirements = [];
    this.dialog.open(this.orderDialog);
    this.loadOrderRequirements()
  }

  loadOrderRequirements() {
    if (!this.selectedProduct?.product_id || this.orderQty < 0) {
      this.materialRequirements = [];
      return;
    }

    this.workshopService
      .getSingleProductRequirements(this.selectedProduct.product_id, this.orderQty, this.workshopId)
      .subscribe((data) => {
        this.materialRequirements = data;
      });
  }

  confirmOrder(dialogRef: any) {
    console.log('✅ Bestellung ausgelöst für', this.orderQty, 'x', this.selectedProduct?.product);
    console.table(this.materialRequirements);
    dialogRef.close();
  }

  openSellDialog(product: ProductLifecycleEntry) {
    console.log('🛒 Verkauf für Produkt starten:', product);
  }

  openMultiOrderModal() {
    this.multiOrderProducts = this.productLifecycle.map((p) => ({
      product_id: p.product_id,
      product: p.product,
      quantity: 0,
    }));
    this.materialRequirements = [];
    this.dialog.open(this.multiOrderDialog);
  }

  loadAggregatedRequirements() {
    const products = this.multiOrderProducts
      .filter((p) => p.quantity > 0)
      .map((p) => ({ product_id: p.product_id, quantity: p.quantity }));

    if (!products.length || !this.workshop) {
      this.materialRequirements = [];
      return;
    }

    this.workshopService
      .getAggregatedRequirements(this.workshop.id, products)
      .subscribe((data) => {
        this.materialRequirements = data;
      });
  }

  confirmAggregatedOrder(dialogRef: any) {
    console.log('✅ Sammelbestellung auslösen für:');
    console.table(this.multiOrderProducts.filter((p) => p.quantity > 0));
    console.table(this.materialRequirements);
    dialogRef.close();
  }
}
