# Detail-Seiten Design Template für Prodflux

Diese Dokumentation beschreibt das Design-Pattern und die Architektur für Detail-Seiten in Prodflux, basierend auf der überarbeiteten Order-Detail-Seite. Verwenden Sie dieses Template als Vorlage für das Refactoring und Redesign anderer Detail-Seiten.

## 📐 Architektur-Prinzipien

### 1. Komponentenbasierte Struktur
- **Hauptkomponente** (`*-detail.component.ts`): Orchestriert die Seite, lädt Daten, verwaltet State
- **Card-Subkomponenten**: Eigenständige, wiederverwendbare UI-Komponenten für spezifische Informationsbereiche
- **Standalone Components**: Alle Komponenten sind standalone (Angular 18+)
- **Smart vs. Presentational**: Hauptkomponente = Smart, Card-Komponenten = Presentational

### 2. Modularisierung durch Cards
Jeder logische Informationsbereich wird in eine eigene Card-Komponente ausgelagert:
- **Info Card**: Basis-Informationen (ID, Datum, Beziehungen)
- **Related Items Card**: Verknüpfte Entities (z.B. Lieferungen, Materialien)
- **Financial Card**: Kosten, Preise, Versandkosten
- **Details Card**: Zusätzliche Details, Notizen, Status

## 🎨 Layout & Styling

### HTML-Struktur

```html
<div class="page-container">
  <!-- 1. Breadcrumb Navigation -->
  <app-breadcrumb [links]="breadcrumbLinks"></app-breadcrumb>

  <div *ngIf="entity" class="[entity]-detail-content">
    
    <!-- 2. Page Header -->
    <div class="page-header">
      <h1>
        <mat-icon>[entity-icon]</mat-icon>
        [Entity Name] #{{ entity.id }}
      </h1>
      <div class="header-actions">
        <button mat-stroked-button color="primary" [routerLink]="[..., 'edit']">
          <mat-icon>edit</mat-icon>
          Bearbeiten
        </button>
        <button mat-stroked-button color="warn" (click)="delete()">
          <mat-icon>delete</mat-icon>
          Löschen
        </button>
        <!-- Weitere kontextspezifische Aktionen -->
      </div>
    </div>

    <!-- 3. Content Grid -->
    <div class="content-grid">
      <!-- Linke Spalte: Haupt-Informationen -->
      <div class="left-column">
        <app-[entity]-info-card [entity]="entity" [relatedData]="data"></app-[entity]-info-card>
        <app-[entity]-related-card [items]="items"></app-[entity]-related-card>
      </div>

      <!-- Rechte Spalte: Sekundäre Informationen -->
      <div class="right-column">
        <app-[entity]-financial-card [entity]="entity"></app-[entity]-financial-card>
      </div>
    </div>

    <!-- 4. Full-Width Sections -->
    <app-[entity]-details-card [data]="detailData"></app-[entity]-details-card>
  </div>

  <!-- 5. Loading State -->
  <div *ngIf="!entity" class="loading-state">
    <mat-icon>hourglass_empty</mat-icon>
    <p>Laden...</p>
  </div>
</div>
```

### SCSS-Struktur

```scss
// Container für maximale Breite und Zentrierung
.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

// Hauptinhalt mit vertikaler Anordnung
.[entity]-detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px; // Konsistenter Abstand zwischen Hauptsektionen
}

// Header mit Titel und Aktionen
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 2px solid #e0e0e0;

  h1 {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0;
    font-size: 28px;
    font-weight: 500;
    color: #333;

    mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2; // Primary blue
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;

    button {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }
}

// 2-Spalten Grid Layout
.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr; // Links breiter, rechts schmaler
  gap: 24px;

  @media (max-width: 968px) {
    grid-template-columns: 1fr; // Single column auf mobilen Geräten
  }
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 24px; // Abstand zwischen Cards in einer Spalte
}

// Loading State mit Animation
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  color: #666;

  mat-icon {
    font-size: 64px;
    width: 64px;
    height: 64px;
    color: #ccc;
    margin-bottom: 16px;
    animation: pulse 1.5s ease-in-out infinite;
  }

  p {
    margin: 0;
    font-size: 18px;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## 🃏 Card-Komponenten Design Pattern

### Basis Card-Komponente Template

```typescript
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-[entity]-[purpose]-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, RouterLink],
  template: `
    <mat-card class="[purpose]-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>[icon-name]</mat-icon>
          [Card Title]
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <!-- Content hier -->
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .[purpose]-card {
      mat-card-header {
        margin-bottom: 16px;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 500;

          mat-icon {
            color: #1976d2;
          }
        }
      }
    }
  `]
})
export class [Entity][Purpose]CardComponent {
  @Input() [entity]!: [EntityType];
  @Input() [additionalData]?: [DataType];
}
```

### Info Card Pattern

**Zweck**: Grundlegende Entity-Informationen anzeigen

**Komponenten**:
- Grid-Layout für Info-Items
- Label-Value Paare
- Links zu verwandten Entities
- Optionale Badges/Notices

```typescript
template: `
  <mat-card class="info-card">
    <mat-card-header>
      <mat-card-title>
        <mat-icon>info</mat-icon>
        [Entity] Informationen
      </mat-card-title>
    </mat-card-header>
    <mat-card-content>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">[Label]:</span>
          <span class="value">{{ entity.[property] }}</span>
        </div>
        <!-- Mehr Info-Items -->
      </div>
      
      <!-- Optionale Badges -->
      <div class="[badge-type]-badge" *ngIf="condition">
        <mat-icon>[icon]</mat-icon>
        <span>[Badge Text]</span>
      </div>
    </mat-card-content>
  </mat-card>
`

styles: `
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .label {
      font-size: 12px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .value {
      font-size: 14px;
      color: #333;
    }
  }
`
```

### Related Items Card Pattern

**Zweck**: Liste verwandter Entities (Lieferungen, Materialien, etc.)

**Features**:
- Klickbare Item-Cards
- Hover-Effekte
- Empty State
- Add/Link Actions

```typescript
template: `
  <mat-card class="related-items-card">
    <mat-card-header>
      <mat-card-title>
        <mat-icon>[icon]</mat-icon>
        [Related Items Title]
      </mat-card-title>
    </mat-card-header>
    <mat-card-content>
      <div *ngIf="items.length > 0; else noItems">
        <div class="items-list">
          <a 
            *ngFor="let item of items" 
            [routerLink]="['/[route]', item.id]" 
            class="item-card">
            <div class="item-icon-wrapper">
              <mat-icon>[icon]</mat-icon>
            </div>
            <div class="item-info">
              <div class="item-header">
                <span class="item-id">[Item] #{{ item.id }}</span>
                <mat-icon class="arrow-icon">chevron_right</mat-icon>
              </div>
              <div class="item-details">
                <!-- Item Details -->
              </div>
            </div>
          </a>
        </div>
        <button mat-stroked-button (click)="addItem.emit()">
          <mat-icon>add</mat-icon>
          Weitere [Item] hinzufügen
        </button>
      </div>
      
      <ng-template #noItems>
        <div class="no-items">
          <mat-icon>inbox</mat-icon>
          <h4>Keine [Items] vorhanden</h4>
          <p>[Beschreibung]</p>
          <button mat-raised-button color="accent" (click)="addItem.emit()">
            <mat-icon>[icon]</mat-icon>
            [Item] hinzufügen
          </button>
        </div>
      </ng-template>
    </mat-card-content>
  </mat-card>
`

styles: `
  .items-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .item-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s ease;

    &:hover {
      background-color: #e3f2fd;
      border-color: #1976d2;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.15);

      .arrow-icon {
        transform: translateX(4px);
      }
    }

    .item-icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background-color: #1976d2;
      border-radius: 8px;
      flex-shrink: 0;

      mat-icon {
        color: white;
        font-size: 28px;
      }
    }

    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .item-id {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .arrow-icon {
          color: #1976d2;
          transition: transform 0.2s ease;
        }
      }

      .item-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
        color: #666;
      }
    }
  }

  .no-items {
    text-align: center;
    padding: 40px 20px;

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
      margin: 0 0 24px 0;
      font-size: 14px;
      color: #666;
    }
  }
`
```

### Financial Card Pattern

**Zweck**: Finanzielle Informationen (Preise, Kosten, Steuern)

```typescript
template: `
  <mat-card class="financial-card">
    <mat-card-header>
      <mat-card-title>
        <mat-icon>attach_money</mat-icon>
        [Financial Title]
      </mat-card-title>
    </mat-card-header>
    <mat-card-content>
      <div class="financial-grid">
        <div class="financial-item">
          <span class="label">[Label]:</span>
          <span class="value">{{ formatCurrency(amount) }}</span>
        </div>
        <div class="financial-item total">
          <span class="label">Total:</span>
          <span class="value">{{ formatCurrency(total) }}</span>
        </div>
      </div>
    </mat-card-content>
  </mat-card>
`

styles: `
  .financial-grid {
    display: flex;
    gap: 24px;
    align-items: center;
  }

  .financial-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .label {
      font-size: 12px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .value {
      font-size: 16px;
      color: #333;
    }

    &.total {
      margin-left: auto;
      
      .value {
        font-size: 18px;
        font-weight: 600;
        color: #1976d2;
      }
    }
  }
`
```

## 🎨 Design Tokens & Farben

### Primärfarben
- **Primary Blue**: `#1976d2` - Icons, Links, Hervorhebungen
- **Primary Blue Dark**: `#1565c0` - Hover-Zustände
- **Primary Blue Light**: `#e3f2fd` - Hover-Hintergründe

### Textfarben
- **Heading**: `#333` - Überschriften, wichtige Texte
- **Body**: `#666` - Standard-Text, Labels
- **Muted**: `#999` - Sekundäre Informationen
- **Link**: `#1976d2` - Links, interaktive Elemente

### Hintergrundfarben
- **Card Background**: `#ffffff` - Standard Card-Hintergrund
- **Subtle Background**: `#f8f9fa` - Subtile Hintergründe für Items
- **Border**: `#e0e0e0` - Standard-Rahmen
- **Shadow**: `rgba(0, 0, 0, 0.1)` - Leichte Schatten

### Status-Farben
- **Warning**: `#ff9800` - Warnungen, historische Marker
- **Warning Light**: `#fff3e0` - Warning-Hintergründe
- **Warning Dark**: `#e65100` - Warning-Texte
- **Error**: `#c62828` - Fehler, Löschen-Aktionen
- **Success**: `#2e7d32` - Erfolgs-Status

### Abstände (Gap/Padding)
- **XS**: `4px` - Minimaler Abstand
- **S**: `8px` - Kleiner Abstand
- **M**: `12px` - Standard-Abstand
- **L**: `16px` - Großer Abstand
- **XL**: `24px` - Sehr großer Abstand (zwischen Hauptsektionen)
- **XXL**: `32px` - Extra großer Abstand

### Schriftgrößen
- **Title**: `28px` - Seitentitel
- **Card Title**: `18px` - Card-Überschriften
- **Subtitle**: `16px` - Untertitel, wichtige Items
- **Body**: `14px` - Standard-Text
- **Small**: `13px` - Kleinere Details
- **Label**: `12px` - Labels, Beschriftungen

## 📦 TypeScript Patterns

### Hauptkomponente Struktur

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// Services
import { [Entity]Service, [Entity] } from './[entity].service';
import { RelatedService } from '../related/related.service';

// Components
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { [Entity]InfoCardComponent } from './[entity]-info-card/[entity]-info-card.component';
import { [Entity]RelatedCardComponent } from './[entity]-related-card/[entity]-related-card.component';

@Component({
  selector: 'app-[entity]-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    BreadcrumbComponent,
    [Entity]InfoCardComponent,
    [Entity]RelatedCardComponent
  ],
  templateUrl: './[entity]-detail.component.html',
  styleUrls: ['./[entity]-detail.component.scss']
})
export class [Entity]DetailComponent {
  // Dependency Injection
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private [entity]Service = inject([Entity]Service);
  private relatedService = inject(RelatedService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // State
  [entity]Id = Number(this.route.snapshot.paramMap.get('id'));
  [entity]: [Entity] | undefined;
  relatedItems: RelatedItem[] = [];
  
  // Data Maps für Lookups
  relatedDataMap = new Map<number, RelatedData>();

  ngOnInit() {
    this.load[Entity]();
    this.loadRelatedData();
  }

  load[Entity]() {
    this.[entity]Service.get(this.[entity]Id).subscribe([entity] => {
      this.[entity] = [entity];
    });
  }

  loadRelatedData() {
    this.relatedService.getBy[Entity](this.[entity]Id).subscribe(items => {
      this.relatedItems = items;
    });
  }

  delete[Entity]() {
    if (confirm('[Entity] wirklich löschen?')) {
      this.[entity]Service.delete(this.[entity]Id).subscribe({
        next: () => {
          this.router.navigate(['/[entities]']);
        },
        error: (err) => {
          console.error('Fehler beim Löschen:', err);
          this.snackBar.open('Fehler beim Löschen', 'Schließen', {
            duration: 5000
          });
        }
      });
    }
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
}
```

## 🔧 Best Practices

### 1. Responsive Design
- Desktop: 2-Spalten Grid (2fr 1fr)
- Tablet/Mobile: 1 Spalte
- Breakpoint: `968px`

### 2. Accessibility
- Semantisches HTML verwenden
- Icons mit aussagekräftigen Namen
- Hover-Zustände für interaktive Elemente
- Fokus-Zustände für Keyboard-Navigation

### 3. Performance
- Lazy Loading für große Listen
- Change Detection Optimierung in Card-Komponenten
- Verwendung von OnPush Strategy wo möglich

### 4. User Experience
- Klare visuelle Hierarchie
- Konsistente Abstände
- Smooth Transitions (0.2s ease)
- Empty States für leere Listen
- Loading States während Datenabfrage
- Feedback bei Aktionen (SnackBar)

### 5. Code Organization
- Ein Ordner pro Card-Komponente
- Inline Templates und Styles für kleine Komponenten
- Externe Files für komplexe Komponenten
- Klare Namenskonventionen

## 📋 Checkliste für Refactoring

- [ ] Hauptkomponente vorbereiten (imports, services)
- [ ] Page Container & Header erstellen
- [ ] Breadcrumb Navigation hinzufügen
- [ ] 2-Spalten Grid Layout implementieren
- [ ] Info Card erstellen und integrieren
- [ ] Related Items Card erstellen
- [ ] Financial/Detail Cards hinzufügen
- [ ] Full-Width Sections implementieren
- [ ] Loading State hinzufügen
- [ ] Empty States für alle Listen
- [ ] Responsive Breakpoints testen
- [ ] Icons konsistent verwenden
- [ ] Farben gemäß Design Tokens
- [ ] Hover-Effekte implementieren
- [ ] Delete/Edit Funktionen testen
- [ ] Error Handling implementieren
- [ ] User Feedback (SnackBars) hinzufügen

## 🎯 Beispiel-Icons

### Nach Kontext
- **Info**: `info`
- **Bestellung**: `receipt`
- **Lieferung**: `local_shipping`
- **Material**: `inventory_2`
- **Finanzen**: `attach_money`, `payments`
- **Lieferant**: `business`
- **Werkstatt**: `factory`
- **Bearbeiten**: `edit`
- **Löschen**: `delete`
- **Hinzufügen**: `add`
- **Verlinkung**: `link`, `open_in_new`
- **Datum**: `event`, `schedule`
- **Notiz**: `note`
- **Historisch**: `history`
- **Leer**: `inbox`
- **Laden**: `hourglass_empty`
- **Navigation**: `chevron_right`

## 📄 Dateistruktur Beispiel

```
features/
└── [entity]/
    ├── [entity]-detail.component.ts
    ├── [entity]-detail.component.html
    ├── [entity]-detail.component.scss
    ├── [entity].service.ts
    ├── [entity]-info-card/
    │   └── [entity]-info-card.component.ts
    ├── [entity]-related-card/
    │   └── [entity]-related-card.component.ts
    ├── [entity]-financial-card/
    │   └── [entity]-financial-card.component.ts
    └── [entity]-details-card/
        └── [entity]-details-card.component.ts
```

## 🚀 Verwendung

1. Kopieren Sie die relevanten Template-Abschnitte
2. Ersetzen Sie `[entity]`, `[Entity]`, etc. mit Ihrem tatsächlichen Entity-Namen
3. Passen Sie die Card-Komponenten an Ihre spezifischen Daten an
4. Folgen Sie den Design Tokens für konsistentes Styling
5. Testen Sie Responsive Breakpoints
6. Implementieren Sie Error Handling und Loading States

---

**Version**: 1.0  
**Letzte Aktualisierung**: 27. November 2025  
**Basis**: Order-Detail Page Refactoring
