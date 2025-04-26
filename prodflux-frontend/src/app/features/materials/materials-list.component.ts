// materials-list.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialsService, MaterialCategoryGroup, Material } from './materials.service';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';

interface GroupedMaterial {
  group: Material[];
}

@Component({
  selector: 'app-materials-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatTableModule,
  ],
  templateUrl: './materials-list.component.html',
  styleUrls: ['./materials-list.component.scss'],
})
export class MaterialsListComponent {
  private materialsService = inject(MaterialsService);
  materialGroups$!: Observable<MaterialCategoryGroup[]>;

  ngOnInit() {
    this.loadMaterials();
  }

  loadMaterials() {
    this.materialGroups$ = this.materialsService.getMaterialsGrouped();
  }

  delete(id: number) {
    if (confirm('Material wirklich löschen?')) {
      this.materialsService.deleteMaterial(id).subscribe(() => {
        this.loadMaterials();
      });
    }
  }

  groupMaterials(materials: Material[]): GroupedMaterial[] {
    const groups: GroupedMaterial[] = [];
    const seen = new Set<number>();

    for (const material of materials) {
      if (seen.has(material.id)) continue;

      if (material.alternatives.length > 0) {
        const group = [material];
        for (const altId of material.alternatives) {
          const alt = materials.find(m => m.id === altId);
          if (alt && !seen.has(alt.id)) {
            group.push(alt);
            seen.add(alt.id);
          }
        }
        seen.add(material.id);
        groups.push({ group });
      } else {
        groups.push({ group: [material] });
        seen.add(material.id);
      }
    }
    return groups;
  }
}
