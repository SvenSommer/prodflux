import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DeliveriesService, Delivery } from './deliveries.service';
import { MaterialsService, MaterialCategoryGroup } from '../materials/materials.service';
import { WorkshopsService } from '../settings/workshop.services';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

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
    BreadcrumbComponent
  ],
})
export class DeliveriesListComponent {
  private deliveriesService = inject(DeliveriesService);
  private materialsService = inject(MaterialsService);
  private workshopsService = inject(WorkshopsService);
  private router = inject(Router);

  deliveries: Delivery[] = [];
  materialsMap = new Map<number, string>();
  workshopsMap = new Map<number, string>();
  materialGroups: MaterialCategoryGroup[] = [];

  ngOnInit(): void {
    this.loadDeliveries();
    this.loadMaterials();
    this.loadWorkshops();
  }

  private loadDeliveries(): void {
    this.deliveriesService.getAll().subscribe(deliveries => {
      this.deliveries = deliveries;
    });
  }

  private loadMaterials(): void {
    this.materialsService.getMaterialsGrouped().subscribe(groups => {
      this.materialGroups = groups;
      groups.forEach(group => {
        group.materials.forEach(material => {
          this.materialsMap.set(material.id, material.bezeichnung);
        });
      });
    });
  }

  private loadWorkshops(): void {
    this.workshopsService.getAll().subscribe(workshops => {
      workshops.forEach(workshop => {
        this.workshopsMap.set(workshop.id, workshop.name);
      });
    });
  }

  delete(id: number): void {
    if (confirm('Lieferung wirklich löschen?')) {
      this.deliveriesService.delete(id).subscribe(() => {
        this.deliveries = this.deliveries.filter(delivery => delivery.id !== id);
      });
    }
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/deliveries', id]);
  }

  getWorkshopName(id: number): string {
    return this.workshopsMap.get(id) || `#${id}`;
  }

  getMaterialName(id: number): string {
    return this.materialsMap.get(id) || `#${id}`;
  }

  formatQuantity(quantity: any): string {
    const num = parseFloat(quantity);
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  }

  getItemsByCategory(items: { material: number; quantity: number }[], categoryId: number): { material: number; quantity: number }[] {
    const group = this.materialGroups.find(g => g.category_id === categoryId);
    if (!group) {
      return [];
    }
    const materialIds = group.materials.map(m => m.id);
    return items.filter(item => materialIds.includes(item.material));
  }

  getMaterialBildUrl(materialId: number): string | null {
    for (const group of this.materialGroups) {
      const material = group.materials.find(m => m.id === materialId);
      if (material && material.bild_url) {
        return material.bild_url;
      }
    }
    return null;
  }

  getCategoryNameForMaterial(materialId: number): string {
    for (const group of this.materialGroups) {
      if (group.materials.some(m => m.id === materialId)) {
        return group.category_name;
      }
    }
    return 'Unbekannte Kategorie';
  }

  getTotalQuantityByCategory(items: { material: number; quantity: number }[], categoryId: number): number {
    const categoryItems = this.getItemsByCategory(items, categoryId);
    return categoryItems.reduce((sum, item) => sum + parseFloat(item.quantity as any), 0);
  }
}
