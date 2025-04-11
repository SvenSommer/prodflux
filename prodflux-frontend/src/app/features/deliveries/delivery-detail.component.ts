import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DeliveriesService } from './deliveries.service';
import { MaterialsService } from '../materials/materials.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { WorkshopsService } from '../settings/workshop.services';

@Component({
  selector: 'app-delivery-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule],
  templateUrl: './delivery-detail.component.html',
  styleUrls: ['./delivery-detail.component.scss'],
})
export class DeliveryDetailComponent {
  private route = inject(ActivatedRoute);
  private deliveriesService = inject(DeliveriesService);
  private materialsService = inject(MaterialsService);
  private workshopsService = inject(WorkshopsService);

  deliveryId = Number(this.route.snapshot.paramMap.get('id'));
  delivery: any;
  materialsMap = new Map<number, string>();
  workshopsMap = new Map<number, string>();

  ngOnInit() {
    this.materialsService.getMaterials().subscribe(mats => {
      mats.forEach(m => this.materialsMap.set(m.id, m.bezeichnung));
    });

    this.workshopsService.getAll().subscribe(ws => {
      ws.forEach(w => this.workshopsMap.set(w.id, w.name));
    });

    this.deliveriesService.getOne(this.deliveryId).subscribe(d => this.delivery = d);
  }

  getMaterialName(id: number) {
    return this.materialsMap.get(id) || `#${id}`;
  }

  getWorkshopName(id: number) {
    return this.workshopsMap.get(id) || `#${id}`;
  }
}
