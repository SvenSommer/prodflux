import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DeliveriesService } from './deliveries.service';
import { Delivery } from '../../shared/models/delivery.model';
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

  getItemsByCategory(items: { material: number; quantity: number }[], categoryId: number | null): { material: number; quantity: number }[] {
    if (categoryId === null) {
      return [];
    }
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

  getTotalQuantityByCategory(items: Array<{ material: number; quantity: number } & Record<string, any>>, categoryId: number | null): number {
    if (categoryId === null) {
      return 0;
    }
    const categoryItems = this.getItemsByCategory(items, categoryId);
    return categoryItems.reduce((sum, item) => sum + parseFloat(item.quantity as any), 0);
  }

  /**
   * Get display text for order column
   */
  getOrderDisplay(delivery: Delivery): string {
    if (delivery.order_detail) {
      return delivery.order_detail.order_number;
    }
    if (delivery.order) {
      return `#${delivery.order}`;
    }
    return '—';
  }

  /**
   * Get router link for order (if applicable)
   */
  getOrderLink(delivery: Delivery): any[] | null {
    if (delivery.order_detail) {
      return ['/orders', delivery.order_detail.id];
    }
    if (delivery.order) {
      return ['/orders', delivery.order];
    }
    return null;
  }

  /**
   * Check if order is linkable (has order_detail or order)
   */
  hasOrderLink(delivery: Delivery): boolean {
    return !!(delivery.order_detail || delivery.order);
  }

  /**
   * Get display text for supplier column
   */
  getSupplierDisplay(delivery: Delivery): string {
    if (delivery.order_detail) {
      return delivery.order_detail.supplier_name;
    }
    return '—';
  }
}
