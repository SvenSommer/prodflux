import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import {
  GlobalMaterialRow,
  MaterialTransferSuggestion,
  WorkshopCoverage
} from '../../models/planning/planning-result.models';
import { Workshop } from '../../models/api/workshop.model';
import { Material } from '../../models/api/material.model';
import { MaterialTableComponent, MaterialTableRow, MaterialTableColumn } from '../../../../shared/components/material-table/material-table.component';

interface TransferPlanRowVm {
  materialId: number;
  materialName: string;
  orderQty: number;
  workshopData: Record<number, {
    required: number;
    availableAfter: number;
    delta: number;
  }>;
  transfers: MaterialTransferSuggestion[];
}

@Component({
  selector: 'app-transfer-plan-tab',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MaterialTableComponent],
  templateUrl: './transfer-plan-tab.component.html',
  styleUrl: './transfer-plan-tab.component.scss'
})
export class TransferPlanTabComponent implements OnChanges {
  @Input({ required: true }) materials: GlobalMaterialRow[] = [];
  @Input({ required: true }) transfers: MaterialTransferSuggestion[] = [];
  @Input({ required: true }) coverage: WorkshopCoverage[] = [];
  @Input({ required: true }) workshopById: Record<number, Workshop> = {};
  @Input({ required: true }) materialById: Record<number, Material> = {};
  @Input() workshopIds: number[] = [];
  @Input() centralWorkshopId?: number;

  @Output() adoptTodos = new EventEmitter<void>();

  rows: TransferPlanRowVm[] = [];

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

  get allColumns(): MaterialTableColumn[] {
    return [
      ...this.workshopColumns,
      { key: 'solution', header: 'Lösungsvorschlag' }
    ];
  }

  ngOnChanges(): void {
    this.buildRows();
  }

  private buildRows(): void {
    if (this.materials.length === 0 || this.coverage.length === 0) {
      this.rows = [];
      return;
    }

    // Group coverage by material
    const coverageByMaterial: Record<number, WorkshopCoverage[]> = {};
    this.coverage.forEach(cov => {
      if (!coverageByMaterial[cov.materialId]) {
        coverageByMaterial[cov.materialId] = [];
      }
      coverageByMaterial[cov.materialId].push(cov);
    });

    // Group transfers by material
    const transfersByMaterial: Record<number, MaterialTransferSuggestion[]> = {};
    this.transfers.forEach(transfer => {
      if (!transfersByMaterial[transfer.materialId]) {
        transfersByMaterial[transfer.materialId] = [];
      }
      transfersByMaterial[transfer.materialId].push(transfer);
    });

    // Build rows
    this.rows = this.materials
      .map(material => {
        const materialCoverage = coverageByMaterial[material.materialId] || [];
        const materialTransfers = transfersByMaterial[material.materialId] || [];

        const workshopData: Record<number, {
          required: number;
          availableAfter: number;
          delta: number;
        }> = {};

        materialCoverage.forEach(cov => {
          workshopData[cov.workshopId] = {
            required: cov.required,
            availableAfter: cov.localStockAfterOrdersAndTransfers,
            delta: cov.localStockAfterOrdersAndTransfers - cov.required
          };
        });

        return {
          materialId: material.materialId,
          materialName: this.materialById[material.materialId]?.bezeichnung || `Material ${material.materialId}`,
          orderQty: material.suggestedOrderToCentral,
          workshopData,
          transfers: materialTransfers
        };
      })
      .filter(row => {
        // Filter out materials where total required across all workshops is 0
        const totalRequired = Object.values(row.workshopData).reduce((sum, ws) => sum + ws.required, 0);
        return totalRequired > 0;
      });
  }

  getWorkshopName(workshopId: number): string {
    return this.workshopById[workshopId]?.name || `Workshop ${workshopId}`;
  }

  getTransferText(transfers: MaterialTransferSuggestion[]): string {
    if (transfers.length === 0) {
      return '—';
    }

    return transfers.map(t => {
      const from = this.getWorkshopName(t.fromWorkshopId);
      const to = this.getWorkshopName(t.toWorkshopId);
      const qty = t.quantity.toFixed(2);
      return `${from} → ${to}: ${qty}`;
    }).join(', ');
  }

  get groupedRows(): { categoryName: string; categoryOrder: number; rows: TransferPlanRowVm[] }[] {
    const groups = new Map<string, { categoryName: string; categoryOrder: number; rows: TransferPlanRowVm[] }>();

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
    return ['material', ...workshopColumns, 'solution'];
  }

  onAdoptTodos(): void {
    this.adoptTodos.emit();
  }
}
