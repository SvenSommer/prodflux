import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import {
  ProductManualService,
  ProductManual,
  ProductManualDefaults,
} from '../product-manual.service';

@Component({
  selector: 'app-product-manuals-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatChipsModule,
    MatExpansionModule,
    MatAutocompleteModule,
  ],
  template: `
    <div class="manuals-settings">
      <!-- Header -->
      <div class="settings-header">
        <h2>
          <mat-icon>menu_book</mat-icon>
          Produkthandbücher
        </h2>
        <p class="description">
          Verwalten Sie hier die Installationsanleitungen und Handbücher für Ihre Produkte.
          Diese werden basierend auf dem Zielland der Bestellung automatisch angezeigt.
        </p>
      </div>

      <!-- Add/Edit Form -->
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>
            {{ editingManual ? 'Handbuch bearbeiten' : 'Neues Handbuch hinzufügen' }}
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form (ngSubmit)="saveManual()" class="manual-form">
            <div class="form-row">
              <mat-form-field appearance="fill" class="product-field">
                <mat-label>Produkt-Bezeichnung</mat-label>
                <input
                  matInput
                  [(ngModel)]="formData.product_identifier"
                  name="product_identifier"
                  [matAutocomplete]="productAuto"
                  placeholder="z.B. SD-KRT2"
                  required />
                <mat-autocomplete #productAuto="matAutocomplete">
                  <mat-option *ngFor="let product of defaults?.common_products" [value]="product">
                    {{ product }}
                  </mat-option>
                </mat-autocomplete>
                <mat-hint>SKU oder Produktname für die Zuordnung</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="fill" class="language-field">
                <mat-label>Sprache</mat-label>
                <mat-select [(ngModel)]="formData.language" name="language" required>
                  <mat-option *ngFor="let lang of defaults?.languages" [value]="lang.code">
                    {{ lang.name }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="fill" class="type-field">
                <mat-label>Typ</mat-label>
                <mat-select [(ngModel)]="formData.manual_type" name="manual_type" required>
                  <mat-option *ngFor="let type of defaults?.manual_types" [value]="type.code">
                    {{ type.name }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="fill" class="title-field">
                <mat-label>Titel</mat-label>
                <input
                  matInput
                  [(ngModel)]="formData.title"
                  name="title"
                  placeholder="z.B. Installationsanleitung SD-KRT2"
                  required />
                <mat-hint>Angezeigter Name des Handbuchs</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="fill" class="order-field">
                <mat-label>Reihenfolge</mat-label>
                <input
                  matInput
                  type="number"
                  [(ngModel)]="formData.order"
                  name="order"
                  min="0" />
                <mat-hint>Kleinere Werte zuerst</mat-hint>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="fill" class="url-field">
                <mat-label>PDF-URL</mat-label>
                <input
                  matInput
                  [(ngModel)]="formData.pdf_url"
                  name="pdf_url"
                  type="url"
                  placeholder="https://..."
                  required />
                <mat-hint>Direkter Link zur PDF-Datei</mat-hint>
              </mat-form-field>

              <div class="checkbox-field">
                <mat-checkbox [(ngModel)]="formData.is_active" name="is_active">
                  Aktiv
                </mat-checkbox>
              </div>
            </div>

            <div class="form-actions">
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="!isFormValid()">
                <mat-icon>{{ editingManual ? 'save' : 'add' }}</mat-icon>
                {{ editingManual ? 'Speichern' : 'Hinzufügen' }}
              </button>
              <button
                *ngIf="editingManual"
                mat-stroked-button
                type="button"
                (click)="cancelEdit()">
                Abbrechen
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Filter -->
      <div class="filter-row">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Nach Produkt filtern</mat-label>
          <input matInput [(ngModel)]="filterProduct" (input)="loadManuals()" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Nach Sprache filtern</mat-label>
          <mat-select [(ngModel)]="filterLanguage" (selectionChange)="loadManuals()">
            <mat-option [value]="null">Alle Sprachen</mat-option>
            <mat-option *ngFor="let lang of defaults?.languages" [value]="lang.code">
              {{ lang.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Manuals Table grouped by Product -->
      <div class="manuals-list">
        <mat-accordion multi>
          <mat-expansion-panel *ngFor="let group of groupedManuals" [expanded]="true">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>inventory_2</mat-icon>
                {{ group.product }}
              </mat-panel-title>
              <mat-panel-description>
                {{ group.manuals.length }} Handbuch/Handbücher
              </mat-panel-description>
            </mat-expansion-panel-header>

            <table mat-table [dataSource]="group.manuals" class="manuals-table">
              <!-- Language Column -->
              <ng-container matColumnDef="language">
                <th mat-header-cell *matHeaderCellDef>Sprache</th>
                <td mat-cell *matCellDef="let manual">
                  <span class="language-badge" [attr.data-lang]="manual.language">
                    {{ manual.language_display }}
                  </span>
                </td>
              </ng-container>

              <!-- Type Column -->
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Typ</th>
                <td mat-cell *matCellDef="let manual">{{ manual.manual_type_display }}</td>
              </ng-container>

              <!-- Title Column -->
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Titel</th>
                <td mat-cell *matCellDef="let manual">{{ manual.title }}</td>
              </ng-container>

              <!-- URL Column -->
              <ng-container matColumnDef="url">
                <th mat-header-cell *matHeaderCellDef>PDF</th>
                <td mat-cell *matCellDef="let manual">
                  <a [href]="manual.pdf_url" target="_blank" class="pdf-link" matTooltip="PDF öffnen">
                    <mat-icon>picture_as_pdf</mat-icon>
                  </a>
                </td>
              </ng-container>

              <!-- Active Column -->
              <ng-container matColumnDef="active">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let manual">
                  <mat-icon [class.active]="manual.is_active" [class.inactive]="!manual.is_active">
                    {{ manual.is_active ? 'check_circle' : 'cancel' }}
                  </mat-icon>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Aktionen</th>
                <td mat-cell *matCellDef="let manual">
                  <button mat-icon-button color="primary" (click)="editManual(manual)" matTooltip="Bearbeiten">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteManual(manual)" matTooltip="Löschen">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
          </mat-expansion-panel>
        </mat-accordion>

        <!-- Empty State -->
        <div *ngIf="groupedManuals.length === 0" class="empty-state">
          <mat-icon>menu_book</mat-icon>
          <h4>Keine Handbücher gefunden</h4>
          <p>Fügen Sie oben ein neues Handbuch hinzu.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .manuals-settings {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .settings-header {
      h2 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 500;
        color: #333;

        mat-icon {
          color: #1976d2;
        }
      }

      .description {
        margin: 0;
        color: #666;
        font-size: 14px;
      }
    }

    .form-card {
      mat-card-header {
        margin-bottom: 16px;
      }
    }

    .manual-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;

      .product-field {
        flex: 1;
        min-width: 200px;
      }

      .language-field,
      .type-field {
        width: 150px;
      }

      .title-field {
        flex: 2;
        min-width: 250px;
      }

      .order-field {
        width: 100px;
      }

      .url-field {
        flex: 1;
        min-width: 300px;
      }

      .checkbox-field {
        display: flex;
        align-items: center;
        padding-top: 8px;
      }
    }

    .form-actions {
      display: flex;
      gap: 12px;
      padding-top: 8px;

      button {
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }

    .filter-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;

      .filter-field {
        flex: 1;
        min-width: 200px;
        max-width: 300px;
      }
    }

    .manuals-list {
      mat-expansion-panel-header {
        mat-icon {
          margin-right: 8px;
          color: #1976d2;
        }
      }
    }

    .manuals-table {
      width: 100%;

      .language-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;

        &[data-lang="de"] {
          background-color: #ffeeba;
          color: #856404;
        }
        &[data-lang="en"] {
          background-color: #b8daff;
          color: #004085;
        }
        &[data-lang="fr"] {
          background-color: #c3e6cb;
          color: #155724;
        }
        &[data-lang="es"] {
          background-color: #f5c6cb;
          color: #721c24;
        }
      }

      .pdf-link {
        color: #c62828;
        text-decoration: none;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }

        &:hover {
          color: #b71c1c;
        }
      }

      .active {
        color: #2e7d32;
      }

      .inactive {
        color: #c62828;
      }
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #666;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #ccc;
        margin-bottom: 16px;
      }

      h4 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 500;
        color: #333;
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }
  `]
})
export class ProductManualsSettingsComponent implements OnInit {
  private manualService = inject(ProductManualService);
  private snackBar = inject(MatSnackBar);

  // Data
  manuals: ProductManual[] = [];
  groupedManuals: { product: string; manuals: ProductManual[] }[] = [];
  defaults: ProductManualDefaults | null = null;

  // Form
  editingManual: ProductManual | null = null;
  formData = this.getEmptyFormData();

  // Filter
  filterProduct = '';
  filterLanguage: string | null = null;

  // Table
  displayedColumns = ['language', 'type', 'title', 'url', 'active', 'actions'];

  ngOnInit() {
    this.loadDefaults();
    this.loadManuals();
  }

  loadDefaults() {
    this.manualService.getDefaults().subscribe({
      next: (defaults) => {
        this.defaults = defaults;
      },
      error: (err) => {
        console.error('Fehler beim Laden der Optionen:', err);
      }
    });
  }

  loadManuals() {
    const params: { product?: string; language?: string } = {};
    if (this.filterProduct) params.product = this.filterProduct;
    if (this.filterLanguage) params.language = this.filterLanguage;

    this.manualService.getAll(params).subscribe({
      next: (manuals) => {
        this.manuals = manuals;
        this.groupManuals();
      },
      error: (err) => {
        console.error('Fehler beim Laden der Handbücher:', err);
        this.snackBar.open('Fehler beim Laden der Handbücher', 'Schließen', { duration: 5000 });
      }
    });
  }

  groupManuals() {
    const groups = new Map<string, ProductManual[]>();

    for (const manual of this.manuals) {
      const product = manual.product_identifier;
      if (!groups.has(product)) {
        groups.set(product, []);
      }
      groups.get(product)!.push(manual);
    }

    this.groupedManuals = Array.from(groups.entries())
      .map(([product, manuals]) => ({ product, manuals }))
      .sort((a, b) => a.product.localeCompare(b.product));
  }

  getEmptyFormData() {
    return {
      product_identifier: '',
      language: 'de',
      manual_type: 'installation',
      title: '',
      pdf_url: '',
      is_active: true,
      order: 0,
    };
  }

  isFormValid(): boolean {
    return !!(
      this.formData.product_identifier &&
      this.formData.language &&
      this.formData.manual_type &&
      this.formData.title &&
      this.formData.pdf_url
    );
  }

  saveManual() {
    if (!this.isFormValid()) return;

    const request$ = this.editingManual
      ? this.manualService.update(this.editingManual.id, this.formData)
      : this.manualService.create(this.formData);

    request$.subscribe({
      next: () => {
        this.snackBar.open(
          this.editingManual ? 'Handbuch aktualisiert' : 'Handbuch hinzugefügt',
          'OK',
          { duration: 3000 }
        );
        this.cancelEdit();
        this.loadManuals();
      },
      error: (err) => {
        console.error('Fehler beim Speichern:', err);
        this.snackBar.open('Fehler beim Speichern', 'Schließen', { duration: 5000 });
      }
    });
  }

  editManual(manual: ProductManual) {
    this.editingManual = manual;
    this.formData = {
      product_identifier: manual.product_identifier,
      language: manual.language,
      manual_type: manual.manual_type,
      title: manual.title,
      pdf_url: manual.pdf_url,
      is_active: manual.is_active,
      order: manual.order,
    };
  }

  cancelEdit() {
    this.editingManual = null;
    this.formData = this.getEmptyFormData();
  }

  deleteManual(manual: ProductManual) {
    if (!confirm(`Handbuch "${manual.title}" wirklich löschen?`)) return;

    this.manualService.delete(manual.id).subscribe({
      next: () => {
        this.snackBar.open('Handbuch gelöscht', 'OK', { duration: 3000 });
        this.loadManuals();
      },
      error: (err) => {
        console.error('Fehler beim Löschen:', err);
        this.snackBar.open('Fehler beim Löschen', 'Schließen', { duration: 5000 });
      }
    });
  }
}
