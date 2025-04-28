import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MaterialsService, MaterialCategoryGroup } from '../materials/materials.service';
import { WorkshopsService } from '../settings/workshop.services';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { TransfersService, Transfer } from './transfers.service';

@Component({
  selector: 'app-transfers-list',
  standalone: true,
  templateUrl: './transfers-list.component.html',
  styleUrls: ['./transfers-list.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    BreadcrumbComponent
  ],
})
export class TransfersListComponent {
  private transfersService = inject(TransfersService);
  private materialsService = inject(MaterialsService);
  private workshopsService = inject(WorkshopsService);
  private router = inject(Router);

  transfers: Transfer[] = [];
  materialsMap = new Map<number, string>();
  workshopsMap = new Map<number, string>();
  materialGroups: MaterialCategoryGroup[] = [];

  ngOnInit(): void {
    this.loadTransfers();
    this.loadMaterials();
    this.loadWorkshops();
  }

  private loadTransfers(): void {
    this.transfersService.getAll().subscribe(transfers => {
      this.transfers = transfers;
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

  navigateToDetail(id: number): void {
    this.router.navigate(['/transfers', id]);
  }

  getWorkshopName(id: number): string {
    return this.workshopsMap.get(id) || `#${id}`;
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

  getTotalQuantityByCategory(items: Array<{ material: number; quantity: number } & Record<string, any>>, categoryId: number | null): number {
    if (categoryId === null) {
      return 0;
    }
    const categoryItems = this.getItemsByCategory(items, categoryId);
    return categoryItems.reduce((sum, item) => sum + parseFloat(item.quantity as any), 0);
  }
}
