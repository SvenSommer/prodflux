import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Material, MaterialCategoryGroup } from '../../../features/materials/materials.service';

/**
 * A reusable Material Picker component with expandable/collapsible categories.
 *
 * Usage:
 * <app-material-picker
 *   [materialGroups]="materialGroups"
 *   [excludedMaterialIds]="selectedMaterialIds"
 *   [placeholder]="'Material suchen...'"
 *   (materialSelected)="onMaterialSelected($event)">
 * </app-material-picker>
 */
@Component({
  selector: 'app-material-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './material-picker.component.html',
  styleUrls: ['./material-picker.component.scss']
})
export class MaterialPickerComponent implements OnChanges {
  /**
   * Material groups organized by category
   */
  @Input() materialGroups: MaterialCategoryGroup[] = [];

  /**
   * Set of material IDs to exclude from the picker (already selected materials)
   */
  @Input() excludedMaterialIds: Set<number> = new Set();

  /**
   * Placeholder text for the search field
   */
  @Input() placeholder = 'Material suchen...';

  /**
   * Label for the search field
   */
  @Input() searchLabel = 'Material suchen...';

  /**
   * Maximum height of the picker panel (CSS value)
   */
  @Input() maxHeight = '400px';

  /**
   * Whether to show images in the material list
   */
  @Input() showImages = true;

  /**
   * Event emitted when a material is selected
   */
  @Output() materialSelected = new EventEmitter<Material>();

  // Internal state
  searchControl = new FormControl<string>('');
  expandedCategories = new Set<number | null>();

  ngOnChanges(changes: SimpleChanges) {
    // Reset search when material groups change
    if (changes['materialGroups']) {
      this.searchControl.setValue('');
    }
  }

  /**
   * Get filtered material groups based on search and exclusions
   */
  getFilteredGroups(): { category_id: number | null; category_name: string; materials: Material[] }[] {
    const searchValue = this.searchControl.value;
    const searchTerm = typeof searchValue === 'string' ? searchValue.toLowerCase().trim() : '';

    return this.materialGroups
      .map(group => {
        // Filter out excluded materials
        let materials = group.materials.filter(m => !this.excludedMaterialIds.has(m.id));

        // Apply search filter if there's a search term
        if (searchTerm) {
          materials = materials.filter(m =>
            m.bezeichnung.toLowerCase().includes(searchTerm) ||
            (m.hersteller_bezeichnung && m.hersteller_bezeichnung.toLowerCase().includes(searchTerm))
          );
        }

        return { ...group, materials };
      })
      .filter(group => group.materials.length > 0);
  }

  /**
   * Check if search is active
   */
  hasActiveSearch(): boolean {
    const searchValue = this.searchControl.value;
    const searchTerm = typeof searchValue === 'string' ? searchValue.trim() : '';
    return searchTerm.length > 0;
  }

  /**
   * Toggle category expansion
   */
  toggleCategory(categoryId: number | null, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.expandedCategories.has(categoryId)) {
      this.expandedCategories.delete(categoryId);
    } else {
      this.expandedCategories.add(categoryId);
    }
  }

  /**
   * Check if category is expanded (auto-expands when searching)
   */
  isCategoryExpanded(categoryId: number | null): boolean {
    // Auto-expand categories with search results when search is active
    if (this.hasActiveSearch()) {
      return true;
    }
    return this.expandedCategories.has(categoryId);
  }

  /**
   * Select a material and emit the event
   */
  selectMaterial(material: Material, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.materialSelected.emit(material);
  }

  /**
   * Clear the search input
   */
  clearSearch(): void {
    this.searchControl.setValue('');
  }

  /**
   * Expand all categories
   */
  expandAll(): void {
    this.materialGroups.forEach(group => {
      this.expandedCategories.add(group.category_id);
    });
  }

  /**
   * Collapse all categories
   */
  collapseAll(): void {
    this.expandedCategories.clear();
  }

  /**
   * Get total count of available materials
   */
  getTotalAvailableCount(): number {
    return this.getFilteredGroups().reduce((total, group) => total + group.materials.length, 0);
  }
}
