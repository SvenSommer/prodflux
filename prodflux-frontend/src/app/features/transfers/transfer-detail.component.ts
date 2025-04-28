import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { MaterialCategoryGroup, MaterialsService } from '../materials/materials.service';
import { WorkshopsService } from '../settings/workshop.services';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { MatIconModule } from '@angular/material/icon';
import { TransfersService, Transfer } from './transfers.service';

@Component({
  selector: 'app-transfer-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, BreadcrumbComponent, RouterModule, MatIconModule],
  templateUrl: './transfer-detail.component.html',
  styleUrls: ['./transfer-detail.component.scss'],
})
export class TransferDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private transfersService = inject(TransfersService);
  private materialsService = inject(MaterialsService);
  private workshopsService = inject(WorkshopsService);

  transferId = Number(this.route.snapshot.paramMap.get('id'));
  transfer: Transfer | undefined;
  materialsMap = new Map<number, string>();
  materialGroups: MaterialCategoryGroup[] = [];
  workshopsMap = new Map<number, string>();

  ngOnInit() {
    this.materialsService.getMaterialsGrouped().subscribe(groups => {
      this.materialGroups = groups;
      groups.forEach(group => {
        group.materials.forEach(m => {
          this.materialsMap.set(m.id, m.bezeichnung);
        });
      });
    });

    this.transfersService.get(this.transferId).subscribe((t: Transfer) => {
      this.transfer = t;
    });

    this.workshopsService.getAll().subscribe(workshops => {
      workshops.forEach(w => {
        this.workshopsMap.set(w.id, w.name);
      });
    });
  }

  getWorkshopName(id: number): string {
    return this.workshopsMap.get(id) || `#${id}`;
  }

  getMaterialName(id: number): string {
    return this.materialsMap.get(id) || `#${id}`;
  }

  getItemsByCategory(items: { material: number; quantity: number; note?: string }[], categoryId: number | null) {
    const group = this.materialGroups.find(g => g.category_id === categoryId);
    if (!group) {
      return [];
    }
    const materialIdsInGroup = group.materials.map(m => m.id);
    return items.filter(i => materialIdsInGroup.includes(i.material));
  }

  deleteTransfer() {
    if (confirm('Transfer wirklich löschen?')) {
      this.transfersService.delete(this.transferId).subscribe(() => {
        this.router.navigate(['/transfers']);
      });
    }
  }
}
