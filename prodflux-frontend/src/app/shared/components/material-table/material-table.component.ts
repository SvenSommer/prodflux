import { Component, Input, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';

export interface MaterialTableColumn {
  key: string;
  header: string;
  width?: string;
}

export interface MaterialTableRow {
  materialId: number;
  materialName: string;
  materialImageUrl?: string | null;
  categoryName: string;
  categoryOrder: number;
  data: any; // Original row data for custom columns
}

@Component({
  selector: 'app-material-table',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTableModule],
  templateUrl: './material-table.component.html',
  styleUrl: './material-table.component.scss'
})
export class MaterialTableComponent {
  @Input({ required: true }) rows: MaterialTableRow[] = [];
  @Input({ required: true }) columns: MaterialTableColumn[] = [];
  @Input() showImage: boolean = true;
  @Input() showCategory: boolean = true;

  @ContentChild('customColumn', { read: TemplateRef }) customColumnTemplate?: TemplateRef<any>;

  get groupedRows(): { categoryName: string; categoryOrder: number; rows: MaterialTableRow[] }[] {
    const groups = new Map<string, { categoryName: string; categoryOrder: number; rows: MaterialTableRow[] }>();

    this.rows.forEach(row => {
      const categoryName = row.categoryName || 'Ohne Kategorie';
      const categoryOrder = row.categoryOrder ?? 9999;

      if (!groups.has(categoryName)) {
        groups.set(categoryName, { categoryName, categoryOrder, rows: [] });
      }
      groups.get(categoryName)!.rows.push(row);
    });

    return Array.from(groups.values()).sort((a, b) => a.categoryOrder - b.categoryOrder);
  }

  get displayedColumns(): string[] {
    const cols: string[] = [];
    if (this.showImage) {
      cols.push('image');
    }
    cols.push('material');
    cols.push(...this.columns.map(c => c.key));
    return cols;
  }
}
