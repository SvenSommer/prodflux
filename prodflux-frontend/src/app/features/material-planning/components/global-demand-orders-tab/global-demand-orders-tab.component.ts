import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { GlobalMaterialRow } from '../../models/planning/planning-result.models';
import { Material } from '../../models/api/material.model';
import { MaterialTableComponent, MaterialTableRow, MaterialTableColumn } from '../../../../shared/components/material-table/material-table.component';
import { OrderProposalDialogComponent } from '../order-proposal-dialog/order-proposal-dialog.component';

@Component({
  selector: 'app-global-demand-orders-tab',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MaterialTableComponent],
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

  constructor(private dialog: MatDialog) {}

  getMaterialName(materialId: number): string {
    const material = this.materialById[materialId];
    return material ? material.bezeichnung : `Material ${materialId}`;
  }

  getMaterialOrderNumber(materialId: number): string {
    const material = this.materialById[materialId];
    return material?.bestell_nr || '—';
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
        materialManufacturerName: material?.hersteller_bezeichnung,
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
    const dialogRef = this.dialog.open(OrderProposalDialogComponent, {
      data: {
        ordersToPlace: this.ordersToPlace,
        materialById: this.materialById
      },
      width: '1200px',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createOrder.emit();
      }
    });
  }
}
