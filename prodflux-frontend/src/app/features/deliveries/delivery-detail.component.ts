import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DeliveriesService } from './deliveries.service';
import { MaterialCategoryGroup, MaterialsService } from '../materials/materials.service';
import { WorkshopsService } from '../settings/workshop.services';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-delivery-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    BreadcrumbComponent
  ],
  templateUrl: './delivery-detail.component.html',
  styleUrls: ['./delivery-detail.component.scss'],
})
export class DeliveryDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private deliveriesService = inject(DeliveriesService);
  private materialsService = inject(MaterialsService);
  private workshopsService = inject(WorkshopsService);

  deliveryId = Number(this.route.snapshot.paramMap.get('id'));
  delivery: any;
  materialGroups: MaterialCategoryGroup[] = [];
  materialsMap = new Map<number, { bezeichnung: string; bildUrl?: string }>();
  workshopsMap = new Map<number, string>();

  ngOnInit(): void {
    this.loadMaterials();
    this.loadWorkshops();
    this.loadDelivery();
  }

  private loadMaterials(): void {
    this.materialsService.getMaterialsGrouped().subscribe(groups => {
      this.materialGroups = groups;
      groups.forEach(group => {
        group.materials.forEach(m => {
          this.materialsMap.set(m.id, {
            bezeichnung: m.bezeichnung,
            bildUrl: m.bild_url ?? undefined,
          });
        });
      });
    });
  }

  private loadWorkshops(): void {
    this.workshopsService.getAll().subscribe(ws => {
      ws.forEach(w => this.workshopsMap.set(w.id, w.name));
    });
  }

  private loadDelivery(): void {
    this.deliveriesService.getOne(this.deliveryId).subscribe(d => this.delivery = d);
  }

  getMaterialName(id: number): string {
    return this.materialsMap.get(id)?.bezeichnung || `#${id}`;
  }

  getMaterialBildUrl(id: number): string | undefined {
    return this.materialsMap.get(id)?.bildUrl;
  }

  getWorkshopName(id: number): string {
    return this.workshopsMap.get(id) || `#${id}`;
  }

  getItemsByCategory(items: { material: number; quantity: number; note?: string }[], categoryId: number | null) {
    const group = this.materialGroups.find(g => g.category_id === categoryId);
    if (!group) return [];
    const materialIdsInGroup = group.materials.map(m => m.id);
    return items.filter(i => materialIdsInGroup.includes(i.material));
  }

  formatQuantity(quantity: number | string): string {
    const num = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
    return Number.isFinite(num) ? num.toString() : '0';
  }

  editDelivery(): void {
    this.router.navigate(['/deliveries', this.deliveryId, 'edit']);
  }

  deleteDelivery(): void {
    if (confirm('Möchten Sie diese Lieferung wirklich löschen?')) {
      this.deliveriesService.delete(this.deliveryId).subscribe(() => {
        this.router.navigate(['/deliveries']);
      });
    }
  }

  backToList(): void {
    this.router.navigate(['/deliveries']);
  }
}
