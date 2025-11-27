# Übersichts-Seiten Design Template für Prodflux

Diese Dokumentation beschreibt das Design-Pattern und die Architektur für Übersichts-/Listen-Seiten in Prodflux, basierend auf der überarbeiteten Orders-List-Seite. Verwenden Sie dieses Template als Vorlage für das Refactoring und Redesign anderer Übersichtsseiten.

## 📐 Architektur-Prinzipien

### 1. Komponentenbasierte Struktur
- **Hauptkomponente** (`*-list.component.ts`): Orchestriert die Seite, lädt Daten, verwaltet Tabellenzustand
- **Standalone Components**: Alle Komponenten sind standalone (Angular 18+)
- **Wiederverwendbare Komponenten**: MaterialTableComponent für erweiterte Ansichten, Breadcrumb für Navigation
- **Smart Component**: Liste-Komponente lädt Daten und verwaltet State

### 2. Tabellenbasierte Darstellung
Übersichtsseiten verwenden Angular Material Tables mit:
- **Klickbare Zeilen**: Navigation zur Detailseite
- **Expandable Rows**: Zusätzliche Details (z.B. Materiallisten) bei Bedarf
- **Responsive Spalten**: Anpassung der angezeigten Informationen
- **Header Actions**: Primäre Aktionen (Neu erstellen) im Header

## 🎨 Layout & Styling

### HTML-Struktur

```html
<div class="page-container">
  <!-- 1. Breadcrumb Navigation -->
  <app-breadcrumb [links]="breadcrumbLinks"></app-breadcrumb>

  <!-- 2. Table Wrapper -->
  <div class="[entity]-table-wrapper">
    
    <!-- 3. Header mit Titel und Aktionen -->
    <div class="header-row">
      <h2>[Entity Plural]</h2>
      <a [routerLink]="['/[entities]/new']">
        <button mat-raised-button color="primary">
          <mat-icon>add</mat-icon>
          Neue/r [Entity]
        </button>
      </a>
    </div>

    <!-- 4. Angular Material Table -->
    <table 
      mat-table 
      [dataSource]="[entities]" 
      class="mat-elevation-z1 full-width-table clickable-table"
      multiTemplateDataRows>
      
      <!-- Standard Columns -->
      <ng-container matColumnDef="id">
        <th mat-header-cell *matHeaderCellDef>ID</th>
        <td mat-cell *matCellDef="let item">{{ item.id }}</td>
      </ng-container>

      <!-- Weitere Standard-Spalten -->
      
      <!-- Optional: Expandable Column für Details -->
      <ng-container matColumnDef="details">
        <th mat-header-cell *matHeaderCellDef>[Details Label]</th>
        <td mat-cell *matCellDef="let item" (click)="$event.stopPropagation()">
          <button 
            mat-button 
            (click)="toggleExpansion(item.id, $event)"
            class="details-toggle-btn">
            <mat-icon>{{ isExpanded(item.id) ? 'expand_less' : 'expand_more' }}</mat-icon>
            {{ getDetailsSummary(item) }}
          </button>
        </td>
      </ng-container>

      <!-- Expanded Row für zusätzliche Details -->
      <ng-container matColumnDef="expandedDetail">
        <td mat-cell *matCellDef="let item" [attr.colspan]="columnCount">
          <div 
            class="expanded-row-container"
            [@detailExpand]="isExpanded(item.id) ? 'expanded' : 'collapsed'"
            (click)="$event.stopPropagation()">
            <div class="details-wrapper">
              <!-- Expanded Content (z.B. MaterialTableComponent) -->
            </div>
          </div>
        </td>
      </ng-container>

      <!-- Header Row Definition -->
      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      
      <!-- Data Row Definition (klickbar) -->
      <tr 
        mat-row 
        *matRowDef="let row; columns: displayedColumns"
        (click)="navigateToDetail(row.id)"
        class="clickable-row">
      </tr>
      
      <!-- Expanded Detail Row -->
      <tr 
        mat-row 
        *matRowDef="let row; columns: ['expandedDetail']"
        class="expanded-detail-row">
      </tr>
    </table>
  </div>
</div>
```

### SCSS-Struktur

```scss
// Container für maximale Breite und Zentrierung
.page-container {
  max-width: 1400px; // Breitere Darstellung für Tabellen
  margin: 0 auto;
  padding: 20px;
}

// Table Wrapper
.[entity]-table-wrapper {
  padding: 2rem;

  // Header mit Titel und Aktionen
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 16px;
    border-bottom: 2px solid #e0e0e0;

    h2 {
      font-size: 28px;
      font-weight: 500;
      color: #333;
      margin: 0;
    }

    button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }

  // Full Width Table
  .full-width-table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;

    th, td {
      padding: 0.75rem 1rem;
      vertical-align: middle;
      text-align: left;
    }

    th {
      background-color: #f5f5f5;
      font-weight: 600;
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e0e0e0;
    }

    td {
      font-size: 14px;
      color: #333;
      border-bottom: 1px solid #f0f0f0;
    }

    // Zebra-Striping für bessere Lesbarkeit
    tr:nth-child(4n+1) {
      background-color: #fafafa;
    }
  }

  // Klickbare Zeilen
  .clickable-row {
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #e3f2fd !important;
      box-shadow: 0 1px 4px rgba(25, 118, 210, 0.1);
    }
  }

  // Expanded Detail Row
  .expanded-detail-row {
    height: 0 !important;

    td {
      border-bottom-width: 0 !important;
      padding: 0 !important;
    }
  }

  .expanded-row-container {
    overflow: hidden;
  }

  .details-wrapper {
    padding: 1.5rem 2rem;
    background-color: #fafafa;
    border-top: 2px solid #e0e0e0;
    border-bottom: 2px solid #e0e0e0;
  }

  // Toggle Button für Expandable Rows
  .details-toggle-btn {
    padding: 4px 8px;
    min-width: auto;
    font-size: 0.9rem;
    color: #1976d2;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba(25, 118, 210, 0.08);
    }

    mat-icon {
      font-size: 1.2rem;
      width: 1.2rem;
      height: 1.2rem;
    }
  }

  // Icon-Styling (z.B. Status-Icons)
  .status-icon {
    &.active {
      color: #2e7d32; // Grün
    }

    &.inactive {
      color: #c62828; // Rot
    }

    &.warning {
      color: #ff9800; // Orange
    }
  }
}

// Responsive Anpassungen
@media (max-width: 968px) {
  .page-container {
    padding: 12px;
  }

  .[entity]-table-wrapper {
    padding: 1rem;

    .header-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;

      button {
        width: 100%;
        justify-content: center;
      }
    }

    .full-width-table {
      th, td {
        padding: 0.5rem;
        font-size: 12px;
      }

      // Verstecke weniger wichtige Spalten auf mobil
      .hide-on-mobile {
        display: none;
      }
    }
  }
}
```

## 📦 TypeScript Patterns

### Hauptkomponente Struktur

```typescript
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { trigger, state, style, transition, animate } from '@angular/animations';

// Services
import { [Entity]Service, [Entity] } from './[entity].service';
import { RelatedService } from '../related/related.service';

// Components
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { MaterialTableComponent } from '../../shared/components/material-table/material-table.component';

@Component({
  selector: 'app-[entity]-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    BreadcrumbComponent,
    MaterialTableComponent
  ],
  templateUrl: './[entity]-list.component.html',
  styleUrls: ['./[entity]-list.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', overflow: 'hidden' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class [Entity]ListComponent {
  // Dependency Injection
  private router = inject(Router);
  private [entity]Service = inject([Entity]Service);
  private relatedService = inject(RelatedService);

  // State
  [entities]: [Entity][] = [];
  relatedDataMap = new Map<number, RelatedData>();
  expandedItems = new Set<number>();

  // Table Configuration
  displayedColumns: string[] = [
    'id',
    'name',
    'date',
    'status',
    'details'
  ];

  ngOnInit() {
    this.load[Entities]();
    this.loadRelatedData();
  }

  load[Entities]() {
    this.[entity]Service.getAll().subscribe([entities] => {
      this.[entities] = [entities];
    });
  }

  loadRelatedData() {
    this.relatedService.getAll().subscribe(data => {
      data.forEach(item => {
        this.relatedDataMap.set(item.id, item);
      });
    });
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/[entities]', id]);
  }

  delete(id: number): void {
    if (confirm('[Entity] wirklich löschen?')) {
      this.[entity]Service.delete(id).subscribe({
        next: () => {
          this.[entities] = this.[entities].filter(e => e.id !== id);
        },
        error: (err) => {
          console.error('Fehler beim Löschen:', err);
        }
      });
    }
  }

  // Expansion Management
  toggleExpansion(id: number, event: Event): void {
    event.stopPropagation(); // Verhindert Navigation zur Detailseite
    if (this.expandedItems.has(id)) {
      this.expandedItems.delete(id);
    } else {
      this.expandedItems.add(id);
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedItems.has(id);
  }

  // Summary für Expandable Column
  getDetailsSummary(item: [Entity]): string {
    // Beispiel: Anzahl verwandter Items
    if (item.relatedItems?.length === 0) return '—';
    if (item.relatedItems?.length > 3) {
      return `${item.relatedItems.length} Items`;
    }
    return item.relatedItems?.map(i => i.name).join(', ') || '—';
  }

  // Utility Methods
  formatCurrency(value: any): string {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '—';
    return num.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' €';
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('de-DE');
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatNumber(value: number, decimals: number = 2): string {
    return value.toLocaleString('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
}
```

## 🎨 Design Tokens & Farben

### Primärfarben
- **Primary Blue**: `#1976d2` - Aktionsbuttons, Links
- **Primary Blue Light**: `#e3f2fd` - Hover-Hintergrund für Zeilen
- **Primary Blue Dark**: `#1565c0` - Button Hover-Zustände

### Textfarben
- **Header**: `#333` - Tabellen-Überschriften, wichtige Texte
- **Body**: `#666` - Standard-Text in Tabellen-Headern
- **Cell Text**: `#333` - Zelleninhalte
- **Muted**: `#999` - Unwichtige Informationen

### Hintergrundfarben
- **Table Background**: `#ffffff` - Standard Tabellen-Hintergrund
- **Header Background**: `#f5f5f5` - Tabellen-Header
- **Zebra Striping**: `#fafafa` - Jede zweite Zeile
- **Expanded Detail**: `#fafafa` - Hintergrund für erweiterte Inhalte
- **Hover**: `#e3f2fd` - Hover-Zustand für klickbare Zeilen
- **Border**: `#e0e0e0` - Standard-Rahmen
- **Light Border**: `#f0f0f0` - Zellentrennlinien

### Status-Farben
- **Active/Success**: `#2e7d32` - Aktiv, erfolgreich
- **Inactive/Error**: `#c62828` - Inaktiv, Fehler
- **Warning**: `#ff9800` - Warnungen, besondere Hinweise
- **Info**: `#1976d2` - Informationen

### Abstände (Padding/Margin)
- **Container Padding**: `20px` - Äußerer Container
- **Table Wrapper**: `2rem` - Wrapper um Tabelle
- **Cell Padding**: `0.75rem 1rem` - Zellen-Innenabstand
- **Header Margin**: `1.5rem` - Abstand unter Header
- **Expanded Padding**: `1.5rem 2rem` - Erweiterte Details

### Schriftgrößen
- **Page Title**: `28px` - Seitentitel im Header
- **Table Header**: `14px` - Tabellen-Überschriften (uppercase)
- **Table Cell**: `14px` - Zelleninhalte
- **Small Text**: `12px` - Kleinere Details, Mobile

### Schatten & Effekte
- **Table Elevation**: `mat-elevation-z1` - Leichte Erhöhung
- **Hover Shadow**: `0 1px 4px rgba(25, 118, 210, 0.1)` - Zeilen-Hover

## 🔧 Tabellen-Features

### 1. Klickbare Zeilen
```typescript
// Template
<tr 
  mat-row 
  *matRowDef="let row; columns: displayedColumns"
  (click)="navigateToDetail(row.id)"
  class="clickable-row">
</tr>

// Component
navigateToDetail(id: number): void {
  this.router.navigate(['/[entities]', id]);
}

// Styles
.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #e3f2fd !important;
  }
}
```

### 2. Expandable Rows mit Animation
```typescript
// Animations
animations: [
  trigger('detailExpand', [
    state('collapsed', style({ height: '0px', minHeight: '0', overflow: 'hidden' })),
    state('expanded', style({ height: '*' })),
    transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
  ]),
]

// State Management
expandedItems = new Set<number>();

toggleExpansion(id: number, event: Event): void {
  event.stopPropagation(); // Wichtig: verhindert Zeilen-Click
  if (this.expandedItems.has(id)) {
    this.expandedItems.delete(id);
  } else {
    this.expandedItems.add(id);
  }
}

isExpanded(id: number): boolean {
  return this.expandedItems.has(id);
}
```

### 3. Multi-Template Data Rows
```html
<!-- Wichtig: multiTemplateDataRows aktivieren -->
<table mat-table [dataSource]="items" multiTemplateDataRows>
  
  <!-- Standard Columns -->
  <ng-container matColumnDef="name">...</ng-container>
  
  <!-- Expanded Detail Column -->
  <ng-container matColumnDef="expandedDetail">
    <td mat-cell *matCellDef="let item" [attr.colspan]="displayedColumns.length">
      <div [@detailExpand]="isExpanded(item.id) ? 'expanded' : 'collapsed'">
        <!-- Expanded Content -->
      </div>
    </td>
  </ng-container>

  <!-- Zwei Row Definitionen -->
  <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
  <tr mat-row *matRowDef="let row; columns: ['expandedDetail']" class="expanded-detail-row"></tr>
</table>
```

### 4. Embedded MaterialTableComponent
```html
<!-- In Expanded Row -->
<div class="details-wrapper">
  <app-material-table
    [rows]="getDetailRows(item)"
    [columns]="detailColumns"
    [showImage]="true"
    [showCategory]="true">
    <ng-template #customColumn let-row let-column="column">
      @switch (column.key) {
        @case ('quantity') {
          {{ row.data.quantity | number:'1.0-2' }}
        }
        @case ('price') {
          {{ formatCurrency(row.data.price) }}
        }
      }
    </ng-template>
  </app-material-table>
</div>
```

## 🎯 Best Practices

### 1. Performance
- Lazy Loading für große Listen implementieren
- Virtual Scrolling bei sehr vielen Zeilen
- TrackBy Funktion für *ngFor verwenden
- OnPush Change Detection wo möglich

### 2. User Experience
- Klare visuelle Hierarchie in Tabellen
- Konsistente Spaltenbreiten
- Zebra-Striping für bessere Lesbarkeit
- Smooth Transitions für Expand/Collapse
- Hover-Feedback für interaktive Elemente
- Loading States während Datenabfrage

### 3. Accessibility
- Semantisches HTML mit mat-table
- Klare Beschriftungen für Header
- Keyboard-Navigation unterstützen
- ARIA-Labels für Icons

### 4. Responsive Design
- Spalten auf Mobile reduzieren/verstecken
- Header-Actions vertikal stapeln
- Touch-freundliche Button-Größen
- Horizontales Scrollen bei Bedarf

### 5. Code Organization
- Service-basiertes Datenmanagement
- Klare Trennung von Darstellung und Logik
- Wiederverwendbare Utility-Methoden
- Konsistente Namenskonventionen

## 📋 Checkliste für Refactoring

- [ ] Hauptkomponente vorbereiten (imports, services)
- [ ] Page Container & Breadcrumb hinzufügen
- [ ] Header Row mit Titel und "Neu erstellen"-Button
- [ ] Angular Material Table implementieren
- [ ] Standard-Spalten definieren (ID, Name, Datum, etc.)
- [ ] Klickbare Zeilen zur Detailseite
- [ ] Optional: Expandable Rows für Details
- [ ] Optional: MaterialTableComponent einbetten
- [ ] Hover-Effekte für Zeilen
- [ ] Zebra-Striping für bessere Lesbarkeit
- [ ] Loading State während Datenabfrage
- [ ] Error Handling implementieren
- [ ] Delete-Funktionalität mit Bestätigung
- [ ] Formatierung (Datum, Währung, Zahlen)
- [ ] Responsive Breakpoints testen
- [ ] Icons konsistent verwenden
- [ ] Farben gemäß Design Tokens

## 🎯 Beispiel-Spalten nach Entity-Typ

### Bestellungen (Orders)
- ID
- Lieferant
- Bestellt am
- Angekommen am
- Historisch (Icon)
- Materialien (expandable)
- Gesamtkosten
- Notiz

### Lieferungen (Deliveries)
- ID
- Lieferant
- Eingegangen am
- Zugehörige Bestellung (Link)
- Materialien (expandable)
- Versandkosten
- Notiz

### Materialien (Materials)
- ID
- Bild
- Bezeichnung
- Hersteller-Bezeichnung
- Kategorie
- Aktueller Bestand
- Einheit
- Alternativen (expandable)

### Lieferanten (Suppliers)
- ID
- Name
- Kontakt
- Email
- Telefon
- Anzahl Bestellungen
- Anzahl Materialien
- Letzte Bestellung

### Produkte (Products)
- ID
- Bild
- Name
- Version
- Varianten (expandable)
- BOM (Bill of Materials, expandable)
- Bestand
- Status

## 🔄 Integration mit Detail-Seiten

### Navigation
- Klickbare Zeilen: `(click)="navigateToDetail(row.id)"`
- RouterLink in Zellen: `[routerLink]="['/[entities]', item.id]"`
- Breadcrumb: Konsistent mit Detail-Seite

### Daten-Synchronisation
- Shared Service für State Management
- Observable Streams für Echtzeitaktualisierung
- Reload nach Create/Update/Delete

### Konsistente Formatierung
- Gleiche Utility-Methoden (formatCurrency, formatDate)
- Identische Design Tokens
- Übereinstimmende Icon-Verwendung

## 📄 Dateistruktur Beispiel

```
features/
└── [entity]/
    ├── [entity]-list.component.ts
    ├── [entity]-list.component.html
    ├── [entity]-list.component.scss
    ├── [entity]-detail.component.ts
    ├── [entity]-detail.component.html
    ├── [entity]-detail.component.scss
    ├── [entity].service.ts
    └── [entity]-card-components/
        └── ...
```

## 🚀 Verwendung

1. Kopieren Sie die relevanten Template-Abschnitte
2. Ersetzen Sie `[entity]`, `[Entity]`, `[entities]` mit Ihrem Entity-Namen
3. Definieren Sie die benötigten Tabellenspalten
4. Implementieren Sie Service-Aufrufe
5. Fügen Sie Expandable Rows hinzu wenn nötig
6. Folgen Sie den Design Tokens für konsistentes Styling
7. Testen Sie Responsive Breakpoints
8. Implementieren Sie Error Handling und Loading States

---

**Version**: 1.0  
**Letzte Aktualisierung**: 27. November 2025  
**Basis**: Orders-List Page  
**Verwandt mit**: [DETAIL_PAGE_DESIGN_TEMPLATE.md](DETAIL_PAGE_DESIGN_TEMPLATE.md)
