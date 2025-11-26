import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import {
  GlobalMaterialRow,
  MaterialTransferSuggestion,
  WorkshopCoverage
} from '../../models/planning/planning-result.models';
import { Workshop } from '../../models/api/workshop.model';
import { Material } from '../../models/api/material.model';

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
  imports: [CommonModule, MatTableModule, MatButtonModule],
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
    this.rows = this.materials.map(material => {
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

  getDisplayedColumns(): string[] {
    const workshopColumns = this.workshopIds.map(id => `workshop-${id}`);
    return ['material', ...workshopColumns, 'solution'];
  }

  onAdoptTodos(): void {
    this.adoptTodos.emit();
  }
}
