// src/app/features/workshops/workshop-detail.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { WorkshopsService, Workshop } from '../settings/workshop.services';
import { MatExpansionModule } from '@angular/material/expansion';

interface MaterialStockEntry {
  material_id: number;
  bezeichnung: string;
  bestand: number;
}

@Component({
  selector: 'app-workshop-detail',
  standalone: true,
  templateUrl: './workshop-detail.component.html',
  styleUrls: ['./workshop-detail.component.scss'],
  imports: [CommonModule, MatCardModule, MatTableModule, MatExpansionModule],
})
export class WorkshopDetailComponent {
  private route = inject(ActivatedRoute);
  private workshopsService = inject(WorkshopsService);
  private http = inject(HttpClient);

  workshopId: number = 0;
  workshop: Workshop | null = null;
  stock: MaterialStockEntry[] = [];

  displayedColumns = ['nr', 'bezeichnung', 'bestand'];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.workshopId = Number(params.get('id'));
      this.loadWorkshop();
      this.loadStock();
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
}
