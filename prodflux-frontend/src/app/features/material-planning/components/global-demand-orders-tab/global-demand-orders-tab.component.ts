import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { GlobalMaterialRow } from '../../models/planning/planning-result.models';
import { Material } from '../../models/api/material.model';
import { MaterialTableComponent, MaterialTableRow, MaterialTableColumn } from '../../../../shared/components/material-table/material-table.component';

@Component({
  selector: 'app-global-demand-orders-tab',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MaterialTableComponent],
  templateUrl: './global-demand-orders-tab.component.html',
  styleUrl: './global-demand-orders-tab.component.scss'
})
export class GlobalDemandOrdersTabComponent {
  @Input({ required: true }) rows: GlobalMaterialRow[] = [];
  @Input({ required: true }) materialById: Record<number, Material> = {};
  @Output() createOrder = new EventEmitter<void>();

  columns: MaterialTableColumn[] = [
    { key: 'totalRequired', header: 'Gesamtbedarf' },
    { key: 'totalStock', header: 'Gesamtbestand' },
    { key: 'openOrders', header: 'Offene Bestellungen' },
    { key: 'totalAvailable', header: 'Verfügbar gesamt' },
    { key: 'shortage', header: 'Fehlmenge' },
    { key: 'suggestedOrder', header: 'Vorgeschlagene Bestellung' }
  ];

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

  get filteredRows(): GlobalMaterialRow[] {
    return this.rows.filter(row => row.totalRequired > 0);
  }

  get materialTableRows(): MaterialTableRow[] {
    return this.filteredRows.map(row => {
      const material = this.materialById[row.materialId];
      return {
        materialId: row.materialId,
        materialName: material?.bezeichnung || `Material ${row.materialId}`,
        materialImageUrl: material?.bild_url || null,
        categoryName: material?.category?.name || 'Ohne Kategorie',
        categoryOrder: material?.category?.order ?? 9999,
        data: row
      };
    });
  }

  get ordersToPlace(): GlobalMaterialRow[] {
    return this.rows.filter(row => row.suggestedOrderToCentral > 0);
  }

  onCreateOrder(): void {
    this.createOrder.emit();
  }
}
