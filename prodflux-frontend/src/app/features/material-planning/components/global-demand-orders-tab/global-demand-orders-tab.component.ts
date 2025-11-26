import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { GlobalMaterialRow } from '../../models/planning/planning-result.models';
import { Material } from '../../models/api/material.model';

@Component({
  selector: 'app-global-demand-orders-tab',
  standalone: true,
  imports: [CommonModule, MatTableModule],
  templateUrl: './global-demand-orders-tab.component.html',
  styleUrl: './global-demand-orders-tab.component.scss'
})
export class GlobalDemandOrdersTabComponent {
  @Input({ required: true }) rows: GlobalMaterialRow[] = [];
  @Input({ required: true }) materialById: Record<number, Material> = {};

  displayedColumns: string[] = [
    'material',
    'totalRequired',
    'totalStock',
    'openOrders',
    'totalAvailable',
    'shortage',
    'suggestedOrder'
  ];

  showOrderProposal = false;

  getMaterialName(materialId: number): string {
    const material = this.materialById[materialId];
    return material ? material.bezeichnung : `Material ${materialId}`;
  }

  getMaterialOrderNumber(materialId: number): string {
    const material = this.materialById[materialId];
    return material?.bestell_nr || '—';
  }

  toggleOrderProposal(): void {
    this.showOrderProposal = !this.showOrderProposal;
  }

  get ordersToPlace(): GlobalMaterialRow[] {
    return this.rows.filter(row => row.suggestedOrderToCentral > 0);
  }
}
