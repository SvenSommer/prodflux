import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MaterialTableComponent, MaterialTableRow, MaterialTableColumn } from '../../../shared/components/material-table/material-table.component';
import { MaterialPickerComponent } from '../../../shared/components/material-picker/material-picker.component';
import { PriceData } from '../../../shared/components/price-input/price-input.component';
import { Material, MaterialCategoryGroup } from '../../materials/materials.service';
import { OrderItem } from '../orders.service';

export interface MaterialAssignment {
  quantity: number;
  price: PriceData;
  artikelnummer: string;
  material_url: string;
}

@Component({
  selector: 'app-order-materials-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MaterialTableComponent,
    MaterialPickerComponent
  ],
  templateUrl: './order-materials-table.component.html',
  styleUrls: ['./order-materials-table.component.scss']
})
export class OrderMaterialsTableComponent implements OnChanges {
  // Mode: 'view' for read-only, 'edit' for editable
  @Input() mode: 'view' | 'edit' = 'view';

  // Data inputs
  @Input() items: OrderItem[] = [];
  @Input() materialsList: Material[] = [];
  @Input() materialGroups: MaterialCategoryGroup[] = [];

  // For edit mode: emit changes
  @Output() itemsChange = new EventEmitter<OrderItem[]>();
  @Output() assignmentsChange = new EventEmitter<{ [materialId: number]: MaterialAssignment }>();

  // Internal state
  selectedMaterialIds = new Set<number>();
  materialAssignments: { [materialId: number]: MaterialAssignment } = {};
  materialTableRows: MaterialTableRow[] = [];

  // Material picker visibility
  showMaterialPicker = false;

  // Columns for view mode
  viewColumns: MaterialTableColumn[] = [
    { key: 'quantity', header: 'Menge', width: '100px' },
    { key: 'preis', header: 'Preis/Stk. (netto)', width: '140px' },
    { key: 'mwst', header: 'MwSt.', width: '80px' },
    { key: 'gesamt_netto', header: 'Gesamt (netto)', width: '130px' },
    { key: 'brutto', header: 'Preis/Stk. (brutto)', width: '140px' },
    { key: 'gesamt_brutto', header: 'Gesamt (brutto)', width: '140px' },
    { key: 'artikelnummer', header: 'Artikelnr.', width: '150px' },
    { key: 'material_url', header: 'Produktlink', width: '110px' }
  ];

  // Columns for edit mode - same as view but with editable fields + remove button
  editColumns: MaterialTableColumn[] = [
    { key: 'remove', header: '', width: '50px' },
    { key: 'quantity', header: 'Menge', width: '80px' },
    { key: 'preis', header: 'Preis/Stk. (netto)', width: '130px' },
    { key: 'mwst', header: 'MwSt.', width: '80px' },
    { key: 'gesamt_netto', header: 'Gesamt (netto)', width: '120px' },
    { key: 'brutto', header: 'Preis/Stk. (brutto)', width: '130px' },
    { key: 'gesamt_brutto', header: 'Gesamt (brutto)', width: '130px' },
    { key: 'artikelnummer', header: 'Artikelnr.', width: '130px' },
    { key: 'material_url', header: 'Produktlink', width: '100px' }
  ];

  get tableColumns(): MaterialTableColumn[] {
    return this.mode === 'view' ? this.viewColumns : this.editColumns;
  }



  ngOnChanges(changes: SimpleChanges) {
    if (changes['items'] || changes['materialsList'] || changes['materialGroups']) {
      this.initializeFromItems();
    }
  }

  private initializeFromItems() {
    // Clear and rebuild state from items
    this.selectedMaterialIds.clear();
    this.materialAssignments = {};

    // Populate from items
    this.items.forEach(item => {
      this.selectedMaterialIds.add(item.material);
      // Ensure mwst_satz is a number and defaults to 19
      const mwstSatz = item.mwst_satz != null ? Number(item.mwst_satz) : 19;
      this.materialAssignments[item.material] = {
        quantity: item.quantity,
        price: {
          netto: item.preis_pro_stueck,
          mwst_satz: mwstSatz
        },
        artikelnummer: item.artikelnummer || '',
        material_url: item.material_url || ''
      };
    });

    this.updateMaterialTableRows();

    // Emit initial assignments in edit mode so parent has the data
    if (this.mode === 'edit' && Object.keys(this.materialAssignments).length > 0) {
      this.emitChanges();
    }
  }

  private updateMaterialTableRows() {
    if (this.mode === 'view') {
      // View mode: show calculated values
      this.materialTableRows = this.items.map(item => {
        const material = this.materialsList.find(m => m.id === item.material);
        const categoryGroup = this.materialGroups.find(g =>
          g.materials.some(m => m.id === item.material)
        );
        const categoryOrder = material?.category?.order ?? 9999;
        const preisProStueckBrutto = this.calculateBrutto(item.preis_pro_stueck, item.mwst_satz);
        const gesamtNetto = item.preis_pro_stueck * item.quantity;
        const gesamtBrutto = preisProStueckBrutto * item.quantity;

        return {
          materialId: item.material,
          materialName: material?.bezeichnung || `Material #${item.material}`,
          materialManufacturerName: material?.hersteller_bezeichnung || undefined,
          materialImageUrl: material?.bild_url || null,
          categoryName: categoryGroup?.category_name || 'Ohne Kategorie',
          categoryOrder: categoryOrder,
          data: {
            quantity: item.quantity,
            preis: item.preis_pro_stueck,
            mwst: item.mwst_satz ?? 19,
            gesamt_netto: gesamtNetto,
            brutto: preisProStueckBrutto,
            gesamt_brutto: gesamtBrutto,
            artikelnummer: item.artikelnummer || '—',
            material_url: item.material_url || null
          }
        };
      });
    } else {
      // Edit mode: show editable fields
      this.materialTableRows = Array.from(this.selectedMaterialIds).map(matId => {
        const material = this.materialsList.find(m => m.id === matId);
        if (!material) {
          return null;
        }

        const group = this.materialGroups.find(g =>
          g.materials.some(m => m.id === matId)
        );

        return {
          materialId: material.id,
          materialName: material.bezeichnung,
          materialManufacturerName: material.hersteller_bezeichnung,
          materialImageUrl: material.bild_url,
          categoryName: group?.category_name || 'Ohne Kategorie',
          categoryOrder: material.category?.order ?? 9999,
          data: material
        };
      }).filter(row => row !== null) as MaterialTableRow[];
    }
  }

  // Toggle material picker visibility
  toggleMaterialPicker() {
    this.showMaterialPicker = !this.showMaterialPicker;
  }

  // Handle material selection from picker
  onMaterialSelected(material: Material) {
    this.addMaterial(material);
  }

  addMaterial(material: Material) {
    if (this.selectedMaterialIds.has(material.id)) {
      return; // Already added
    }

    this.selectedMaterialIds.add(material.id);

    // Initialize assignment
    if (!this.materialAssignments[material.id]) {
      this.materialAssignments[material.id] = {
        quantity: 0,
        price: { netto: 0, mwst_satz: 19 },
        artikelnummer: '',
        material_url: ''
      };
    }

    this.updateMaterialTableRows();
    this.emitChanges();
  }

  removeMaterial(materialId: number) {
    this.selectedMaterialIds.delete(materialId);
    delete this.materialAssignments[materialId];

    this.updateMaterialTableRows();
    this.emitChanges();
  }

  emitChanges() {
    // Emit assignments for parent to use
    this.assignmentsChange.emit({ ...this.materialAssignments });

    // Convert to items format
    const items: OrderItem[] = Array.from(this.selectedMaterialIds).map(materialId => {
      const assignment = this.materialAssignments[materialId];
      return {
        material: materialId,
        quantity: assignment?.quantity ?? 0,
        preis_pro_stueck: assignment?.price?.netto ?? 0,
        mwst_satz: assignment?.price?.mwst_satz ?? 19,
        artikelnummer: assignment?.artikelnummer ?? '',
        material_url: assignment?.material_url ?? ''
      };
    });
    this.itemsChange.emit(items);
  }

  // Helper methods
  calculateBrutto(netto: number, mwstSatz?: number): number {
    const satz = mwstSatz ?? 19;
    return netto * (1 + satz / 100);
  }

  // Methods for edit mode calculated values
  getGesamtNetto(materialId: number): number {
    const assignment = this.materialAssignments[materialId];
    if (!assignment) return 0;
    return assignment.quantity * assignment.price.netto;
  }

  getBruttoProStueck(materialId: number): number {
    const assignment = this.materialAssignments[materialId];
    if (!assignment) return 0;
    return this.calculateBrutto(assignment.price.netto, assignment.price.mwst_satz);
  }

  getGesamtBrutto(materialId: number): number {
    const assignment = this.materialAssignments[materialId];
    if (!assignment) return 0;
    const bruttoProStueck = this.calculateBrutto(assignment.price.netto, assignment.price.mwst_satz);
    return assignment.quantity * bruttoProStueck;
  }

  calculateTotalPrice(assignment: MaterialAssignment): string {
    if (!assignment || assignment.quantity === 0 || assignment.price.netto === 0) {
      return '—';
    }
    const total = assignment.quantity * assignment.price.netto;
    return this.formatCurrency(total);
  }

  formatCurrency(value: any): string {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '—';
    return num.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' €';
  }

  // Public method to get current assignments (for parent save)
  getAssignments(): { [materialId: number]: MaterialAssignment } {
    return { ...this.materialAssignments };
  }

  // Public method to get selected material IDs
  getSelectedMaterialIds(): number[] {
    return Array.from(this.selectedMaterialIds);
  }
}
