import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { WorkshopCoverage } from '../../models/planning/planning-result.models';
import { Workshop } from '../../models/api/workshop.model';
import { Material } from '../../models/api/material.model';
import { MaterialTableComponent, MaterialTableRow, MaterialTableColumn } from '../../../../shared/components/material-table/material-table.component';

interface CoverageRowVm {
  materialId: number;
  materialName: string;
  byWorkshop: Record<number, WorkshopCoverage>;
}

interface WorkshopColumnData {
  required: number;
  local: number;
  transfer: number;
  shortage: number;
}

@Component({
  selector: 'app-workshop-coverage-tab',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTableModule, MaterialTableComponent],
  templateUrl: './workshop-coverage-tab.component.html',
  styleUrl: './workshop-coverage-tab.component.scss'
})
export class WorkshopCoverageTabComponent implements OnChanges {
  @Input({ required: true }) coverage: WorkshopCoverage[] = [];
  @Input({ required: true }) workshopById: Record<number, Workshop> = {};
  @Input({ required: true }) materialById: Record<number, Material> = {};
  @Input() workshopIds: number[] = [];

  rows: CoverageRowVm[] = [];

  get materialTableRows(): MaterialTableRow[] {
    return this.rows.map(row => {
      const material = this.materialById[row.materialId];
      return {
        materialId: row.materialId,
        materialName: row.materialName,
        materialImageUrl: material?.bild_url || null,
        categoryName: material?.category?.name || 'Ohne Kategorie',
        categoryOrder: material?.category?.order ?? 9999,
        data: row
      };
    });
  }

  get workshopColumns(): MaterialTableColumn[] {
    return this.workshopIds.map(id => ({
      key: `workshop-${id}`,
      header: this.getWorkshopName(id)
    }));
  }

  ngOnChanges(): void {
    this.buildRows();
  }

  private buildRows(): void {
    if (this.coverage.length === 0) {
      this.rows = [];
      return;
    }

    // Group by material
    const coverageByMaterial: Record<number, WorkshopCoverage[]> = {};
    this.coverage.forEach(cov => {
      if (!coverageByMaterial[cov.materialId]) {
        coverageByMaterial[cov.materialId] = [];
      }
      coverageByMaterial[cov.materialId].push(cov);
    });

    // Build rows
    this.rows = Object.keys(coverageByMaterial).map(materialIdStr => {
      const materialId = Number(materialIdStr);
      const materialCoverage = coverageByMaterial[materialId];

      const byWorkshop: Record<number, WorkshopCoverage> = {};
      materialCoverage.forEach(cov => {
        byWorkshop[cov.workshopId] = cov;
      });

      return {
        materialId,
        materialName: this.materialById[materialId]?.bezeichnung || `Material ${materialId}`,
        byWorkshop
      };
    }).sort((a, b) => a.materialName.localeCompare(b.materialName));
  }

  getWorkshopName(workshopId: number): string {
    return this.workshopById[workshopId]?.name || `Workshop ${workshopId}`;
  }

  getWorkshopData(row: CoverageRowVm, workshopId: number): WorkshopColumnData | null {
    const cov = row.byWorkshop[workshopId];
    if (!cov) {
      return null;
    }

    return {
      required: cov.required,
      local: cov.coveredLocal,
      transfer: cov.coveredByTransfers,
      shortage: cov.remainingShortage
    };
  }

  get groupedRows(): { categoryName: string; categoryOrder: number; rows: CoverageRowVm[] }[] {
    const groups = new Map<string, { categoryName: string; categoryOrder: number; rows: CoverageRowVm[] }>();

    this.rows.forEach(row => {
      const material = this.materialById[row.materialId];
      const categoryName = material?.category?.name || 'Ohne Kategorie';
      const categoryOrder = material?.category?.order ?? 9999;

      if (!groups.has(categoryName)) {
        groups.set(categoryName, { categoryName, categoryOrder, rows: [] });
      }
      groups.get(categoryName)!.rows.push(row);
    });

    return Array.from(groups.values()).sort((a, b) => a.categoryOrder - b.categoryOrder);
  }

  getDisplayedColumns(): string[] {
    const workshopColumns = this.workshopIds.map(id => `workshop-${id}`);
    return ['material', ...workshopColumns];
  }
}
