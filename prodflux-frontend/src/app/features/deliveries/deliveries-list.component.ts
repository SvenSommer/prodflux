import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DeliveriesService, Delivery } from './deliveries.service';
import { MaterialsService } from '../materials/materials.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { WorkshopsService } from '../settings/workshop.services';

@Component({
  selector: 'app-deliveries-list',
  standalone: true,
  templateUrl: './deliveries-list.component.html',
  styleUrls: ['./deliveries-list.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class DeliveriesListComponent {
  private deliveriesService = inject(DeliveriesService);
  private materialsService = inject(MaterialsService);
  private workshopsService = inject(WorkshopsService);

  deliveries: Delivery[] = [];
  materialsMap = new Map<number, string>();
  workshopsMap = new Map<number, string>();


  ngOnInit() {
    this.deliveriesService.getAll().subscribe(list => {
      this.deliveries = list;
    });

    this.materialsService.getMaterials().subscribe(materials => {
      materials.forEach(m => {
        this.materialsMap.set(m.id, m.bezeichnung);
      });
    });

    this.workshopsService.getAll().subscribe(ws => {
      ws.forEach(w => this.workshopsMap.set(w.id, w.name));
    });
  }

  delete(id: number) {
    if (confirm('Lieferung wirklich löschen?')) {
      this.deliveriesService.delete(id).subscribe(() => {
        this.deliveries = this.deliveries.filter(d => d.id !== id);
      });
    }
  }
  getWorkshopName(id: number) {
    return this.workshopsMap.get(id) || `#${id}`;
  }

  getMaterialName(id: number): string {
    return this.materialsMap.get(id) || `#${id}`;
  }

  getMaterialSummary(items: { material: number; quantity: number }[]): string {
    return items.map(i => `${i.quantity}x ${this.getMaterialName(i.material)}`).join(', ');
  }

  formatQuantity(qty: any): string {
    const num = parseFloat(qty);
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  }
}
