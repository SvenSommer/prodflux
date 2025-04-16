// src/app/features/workshops/workshop-detail.component.ts
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { WorkshopsService, Workshop } from '../settings/workshop.services';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { forkJoin } from 'rxjs';
import { ProductsService } from '../products/products.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

interface MaterialStockEntry {
  material_id: number;
  bezeichnung: string;
  bestand: number;
  bild_url?: string;
}

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
    MatDialogModule
  ],
})
export class WorkshopDetailComponent {
  private route = inject(ActivatedRoute);
  private workshopsService = inject(WorkshopsService);
  private productsService = inject(ProductsService);
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);

  workshopId: number = 0;
  workshop: Workshop | null = null;
  stock: MaterialStockEntry[] = [];
  displayedColumns = ['nr', 'bild', 'bezeichnung', 'bestand'];

  producibleProducts: { product_id: number; product: string; possible_units: number }[] = [];
  productLifecycle: any[] = [];

  selectedProduct: any = null;
  manufactureQty: number = 1;
  orderQty: number = 1;
  materialRequirements: any[] = [];

  @ViewChild('orderDialog') orderDialog!: TemplateRef<any>;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.workshopId = Number(params.get('id'));
      this.loadWorkshop();
      this.loadStock();
      this.loadLifecycleOverview();
    });
  }

  loadWorkshop() {
    this.workshopsService.getAll().subscribe(all => {
      this.workshop = all.find(w => w.id === this.workshopId) || null;
    });
  }

  loadStock() {
    this.http.get<MaterialStockEntry[]>(`http://localhost:8000/api/workshops/${this.workshopId}/material-stock/`)
      .subscribe(data => this.stock = data);
  }

  loadLifecycleOverview() {
    this.http.get<any[]>(`http://localhost:8000/api/products/lifecycle-overview/?workshop_id=${this.workshopId}`)
      .subscribe(data => this.productLifecycle = data);
  }

  manufactureProduct() {
    if (!this.selectedProduct || !this.manufactureQty || this.manufactureQty < 1) return;

    const payload = {
      product_id: this.selectedProduct.product_id,
      workshop_id: this.workshopId,
      quantity: this.manufactureQty,
    };

    this.http.post('http://localhost:8000/api/manufacture/', payload).subscribe(() => {
      this.loadLifecycleOverview();
      this.manufactureQty = 1;
    });
  }

  openOrderModal(product: any) {
    this.selectedProduct = product;
    this.orderQty = 1;
    this.materialRequirements = [];
    this.dialog.open(this.orderDialog);
  }

  loadOrderRequirements() {
    if (!this.selectedProduct?.product_id || this.orderQty < 1) {
      this.materialRequirements = [];
      return;
    }

    const url = `http://localhost:8000/api/products/${this.selectedProduct.product_id}/requirements/?quantity=${this.orderQty}&workshop_id=${this.workshopId}`;
    this.http.get<any[]>(url).subscribe(data => {
      this.materialRequirements = data;
    });
  }

  confirmOrder(dialogRef: any) {
    console.log("Bestellung auslösen für", this.orderQty, "x", this.selectedProduct.product);
    console.log("Benötigte Materialien:", this.materialRequirements);
    dialogRef.close();
  }

  openSellDialog(product: any) {
    // TODO: Dialog zum Verkauf öffnen
    console.log("Verkauf für Produkt starten:", product);
  }
}
