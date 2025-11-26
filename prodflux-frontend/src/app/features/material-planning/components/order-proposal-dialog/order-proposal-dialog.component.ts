import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { GlobalMaterialRow } from '../../models/planning/planning-result.models';
import { Material } from '../../models/api/material.model';
import { MaterialTableComponent, MaterialTableRow, MaterialTableColumn } from '../../../../shared/components/material-table/material-table.component';

export interface OrderProposalDialogData {
  ordersToPlace: GlobalMaterialRow[];
  materialById: Record<number, Material>;
}

@Component({
  selector: 'app-order-proposal-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MaterialTableComponent],
  templateUrl: './order-proposal-dialog.component.html',
  styleUrl: './order-proposal-dialog.component.scss'
})
export class OrderProposalDialogComponent {
  columns: MaterialTableColumn[] = [
    { key: 'quantity', header: 'Menge' },
    { key: 'price', header: 'Preis/Einheit' }
  ];

  constructor(
    public dialogRef: MatDialogRef<OrderProposalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OrderProposalDialogData
  ) {}

  getMaterialName(materialId: number): string {
    const material = this.data.materialById[materialId];
    return material ? material.bezeichnung : `Material ${materialId}`;
  }

  get materialTableRows(): MaterialTableRow[] {
    return this.data.ordersToPlace.map(row => {
      const material = this.data.materialById[row.materialId];
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

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
