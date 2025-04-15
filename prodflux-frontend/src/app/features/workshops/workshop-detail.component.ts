// src/app/features/workshops/workshop-detail.component.ts
import { Component, inject } from '@angular/core';
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
  imports: [CommonModule, MatCardModule, RouterLink, MatTableModule, MatMenu, MatIcon, MatExpansionModule,   FormsModule,
    MatFormFieldModule,
    MatInputModule,MatMenuModule,      ],
})
export class WorkshopDetailComponent {
  private route = inject(ActivatedRoute);
  private workshopsService = inject(WorkshopsService);
  private productsService = inject(ProductsService);

  private http = inject(HttpClient);

  workshopId: number = 0;
  workshop: Workshop | null = null;
  stock: MaterialStockEntry[] = [];

  displayedColumns = ['nr', 'bild', 'bezeichnung', 'bestand'];

  producibleProducts: { product_id: number; product: string; possible_units: number }[] = [];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.workshopId = Number(params.get('id'));
      this.loadWorkshop();
      this.loadStock();
      this.loadProducible();
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



  loadProducible() {
    const producible$ = this.http.get<any[]>(`http://localhost:8000/api/products/producible?workshop_id=${this.workshopId}`);
    const overview$ = this.http.get<any[]>(`http://localhost:8000/api/workshops/${this.workshopId}/products/overview/`);

    forkJoin([producible$, overview$]).subscribe(([producible, overview]) => {
      this.producibleProducts = producible.map(p => {
        const match = overview.find(o => o.product_id === p.product_id);
        return {
          ...p,
          produced_units: match?.bestand || 0
        };
      });
    });
  }

  selectedProduct: any = null;
  manufactureQty: number = 1;

  manufactureProduct() {
    if (!this.selectedProduct || !this.manufactureQty || this.manufactureQty < 1) return;

    const payload = {
      product_id: this.selectedProduct.product_id,
      workshop_id: this.workshopId,
      quantity: this.manufactureQty,
    };

    this.http.post('http://localhost:8000/api/manufacture/', payload).subscribe(() => {
      this.loadProducible(); // aktualisieren
      this.manufactureQty = 1;
    });
  }

  materialRequirements: any[] = [];

  loadMaterialRequirements() {
    if (!this.selectedProduct?.product_id || !this.manufactureQty || this.manufactureQty < 1) {
      this.materialRequirements = [];
      return;
    }

    this.productsService
      .getMaterialRequirements(this.selectedProduct.product_id, this.manufactureQty, this.workshopId)
      .subscribe(data => this.materialRequirements = data);
  }
}
