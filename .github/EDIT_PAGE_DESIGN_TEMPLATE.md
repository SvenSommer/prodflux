# Edit/Input-Seiten Design Template für Prodflux

Diese Dokumentation beschreibt das Design-Pattern und die Architektur für Edit/Input-Seiten in Prodflux, abgeleitet vom Detail-Seiten Design Template. Edit-Seiten folgen dem gleichen visuellen Stil, jedoch mit Formular-spezifischen Anpassungen.

## 📐 Architektur-Prinzipien

### 1. Konsistenz mit Detail-Seiten
- **Gleicher Page Container**: max-width: 1400px, zentriert
- **Gleicher Header-Stil**: Titel mit Icon, Actions rechts
- **Gleiche Breadcrumb-Navigation**: Konsistente Navigation
- **Card-basiertes Layout**: Formularbereiche in Cards gruppiert

### 2. Formular-spezifische Anpassungen
- **Form-Cards statt Info-Cards**: Eingabefelder statt Label-Value-Paare
- **Inline Actions**: Speichern/Abbrechen im Header statt am Ende
- **Feldgruppierung**: Zusammengehörige Felder in Form-Rows
- **Responsive Feldbreiten**: Angepasst an erwarteten Inhalt

## 🎨 Layout & Styling

### HTML-Struktur

```html
<div class="page-container">
  <!-- 1. Breadcrumb Navigation -->
  <app-breadcrumb [links]="breadcrumbLinks"></app-breadcrumb>

  <div class="edit-page-content">
    <!-- 2. Page Header mit Actions -->
    <div class="page-header">
      <h1>
        <mat-icon>[entity-icon]</mat-icon>
        {{ isEdit ? '[Entity] bearbeiten' : 'Neue/r [Entity]' }}
      </h1>
      <div class="header-actions">
        <button mat-stroked-button type="button" [routerLink]="cancelRoute">
          <mat-icon>close</mat-icon>
          Abbrechen
        </button>
        <button mat-raised-button color="primary" type="submit" form="entityForm">
          <mat-icon>save</mat-icon>
          Speichern
        </button>
      </div>
    </div>

    <!-- 3. Form Content -->
    <form id="entityForm" (ngSubmit)="save()">
      
      <!-- 2-Spalten Grid: Linke Spalte (Eingaben) + Rechte Spalte (Übersicht) -->
      <div class="content-grid">
        <!-- Linke Spalte: Haupteingaben -->
        <div class="left-column">
          <!-- Hauptinformationen Card -->
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>info</mat-icon>
                Grundinformationen
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="form-row">
                <mat-form-field appearance="fill" class="field-[size]">
                  <mat-label>[Label]</mat-label>
                  <input matInput [(ngModel)]="field" name="field" />
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Optionen Card -->
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>settings</mat-icon>
                Optionen & Notizen
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <!-- Optionale Felder, Checkboxen, etc. -->
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Rechte Spalte: Übersicht/Zusammenfassung (read-only) -->
        <div class="right-column">
          <!-- Wiederverwendbare Detail-Komponente -->
          <app-[entity]-summary-card [entity]="buildPreviewEntity()"></app-[entity]-summary-card>
        </div>
      </div>

      <!-- Full-Width Components (z.B. Tables) -->
      <app-[entity]-items-table
        [mode]="'edit'"
        [items]="items"
        (itemsChange)="onItemsChange($event)">
      </app-[entity]-items-table>

    </form>
  </div>
</div>
```

### SCSS-Struktur

```scss
// Container - identisch mit Detail-Seiten
.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

// Hauptinhalt mit konsistentem Gap (24px zwischen Header und Form)
.edit-page-content {
  display: flex;
  flex-direction: column;
  gap: 24px;

  // WICHTIG: Form Container braucht den gleichen Gap für Cards
  form {
    display: flex;
    flex-direction: column;
    gap: 24px; // Gleicher Abstand wie zwischen Cards auf Detail-Seiten
  }
}

// Header - identisch mit Detail-Seiten
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
      color: #1976d2;
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

// 2-Spalten Grid Layout (identisch mit Detail-Seiten)
.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr; // Links breiter (Eingaben), rechts schmaler (Übersicht)
  gap: 24px;

  @media (max-width: 968px) {
    grid-template-columns: 1fr; // Single column auf mobilen Geräten
  }
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 24px; // Gleicher Abstand zwischen Cards wie auf Detail-Seiten
}

// Form Cards
.form-card {
  mat-card-header {
    margin-bottom: 20px;

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

  mat-card-content {
    padding: 0 8px;
  }
}

// Form Rows - flexible Zeilen für Feldgruppierung
.form-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

// Feldgrößen - angepasst an erwarteten Inhalt
.field-xs { width: 100px; flex-shrink: 0; }  // Sehr kurz: Mengen, Kürzel
.field-sm { width: 150px; flex-shrink: 0; }  // Kurz: Datum, Nummer
.field-md { width: 250px; }                   // Mittel: Namen, Referenzen
.field-lg { width: 400px; }                   // Lang: Beschreibungen
.field-xl { width: 100%; max-width: 600px; } // Sehr lang: URLs
.field-full { width: 100%; }                  // Volle Breite: Textareas

// Flex-basierte Felder
.field-flex-1 { flex: 1; min-width: 250px; }
.field-flex-2 { flex: 2; min-width: 300px; }

// Spezielle Feldtypen
.field-with-action {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
  min-width: 250px;
  max-width: 400px;
  
  .field-main {
    flex: 1;
  }
  
  .field-action {
    margin-top: 8px; // Alignment mit Form-Field
  }
}

// Preis-Feld Container
.price-field {
  min-width: 280px;
  max-width: 350px;
  
  .price-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.6);
    margin-bottom: 8px;
  }
}

// Checkbox-Bereich mit dynamischem Zustand
.checkbox-section {
  margin-top: 16px;
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #9e9e9e;
  transition: all 0.2s ease;

  mat-checkbox {
    .checkbox-content {
      display: flex;
      align-items: center;
      gap: 8px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #9e9e9e;
        transition: color 0.2s ease;
      }
    }
  }

  .checkbox-hint {
    margin: 8px 0 0 28px;
    font-size: 13px;
    color: #666;
    transition: color 0.2s ease;
  }

  // Aktiver Zustand - oranges Banner wie auf Detail-Seite
  &.is-active {
    background-color: #fff3e0;
    border-left: 4px solid #ff9800;

    mat-checkbox .checkbox-content mat-icon {
      color: #ff9800;
    }

    .checkbox-hint {
      color: #e65100;
      font-weight: 500;
    }
  }
}

// Responsive Anpassungen
@media (max-width: 968px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;

    h1 {
      font-size: 24px;
    }

    .header-actions {
      justify-content: flex-end;
    }
  }

  .form-row {
    flex-direction: column;
  }

  .field-xs, .field-sm, .field-md, 
  .field-lg, .field-xl,
  .field-with-action,
  .price-field,
  .field-flex-1 {
    width: 100%;
    max-width: 100%;
    min-width: 100%;
  }
}
```

## 📐 Layout-Abstände (Wichtig!)

### Konsistenz mit Detail-Seiten

Die Edit-Seite muss die **gleichen Abstände** wie die Detail-Seite haben:

| Element | Abstand | CSS Property |
|---------|---------|--------------|
| Page Container Padding | `20px` | `padding: 20px` |
| Zwischen Breadcrumb und Content | `24px` | (automatisch durch `.edit-page-content` gap) |
| Zwischen Header und Form | `24px` | `.edit-page-content { gap: 24px }` |
| Zwischen Form-Cards | `24px` | `form { gap: 24px }` |
| Innerhalb Form-Rows | `16px` | `.form-row { gap: 16px }` |

### Kritischer Punkt: Form-Container

Das `<form>` Element ist ein Child von `.edit-page-content`. Damit die Cards **innerhalb** des Forms den gleichen Abstand haben, muss das Form selbst `display: flex; flex-direction: column; gap: 24px;` haben:

```scss
.edit-page-content {
  display: flex;
  flex-direction: column;
  gap: 24px;

  // Das Form braucht den gleichen Gap!
  form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
}
```

Ohne diese Regel haben die Form-Cards keinen Abstand zueinander.

## 📦 Feld-Größen Empfehlungen

| Feld-Typ | CSS-Klasse | Breite | Beispiele |
|----------|------------|--------|-----------|
| Kürzel, Anzahl | `field-xs` | 100px | Menge, Code |
| Datum, Nummer | `field-sm` | 150px | Bestellnummer, Datum |
| Namen, IDs | `field-md` | 250px | Lieferant, Kategorie |
| Beschreibungen | `field-lg` | 400px | Kurze Beschreibungen |
| URLs | `field-xl` | 600px | Weblinks |
| Notizen | `field-full` | 100% | Mehrzeilige Texte |

## 🃏 Form-Card Patterns

### Grundinformationen Card

```html
<mat-card class="form-card">
  <mat-card-header>
    <mat-card-title>
      <mat-icon>info</mat-icon>
      Grundinformationen
    </mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <!-- Zeile 1: Hauptfelder -->
    <div class="form-row">
      <div class="field-with-action">
        <mat-form-field appearance="fill" class="field-main">
          <mat-label>Lieferant</mat-label>
          <input matInput [formControl]="supplierControl" [matAutocomplete]="auto" required />
          <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayFn">
            <mat-option *ngFor="let item of filtered | async" [value]="item">
              {{ item.name }}
            </mat-option>
          </mat-autocomplete>
        </mat-form-field>
        <button type="button" mat-mini-fab color="primary" class="field-action" 
                (click)="openNewDialog()" matTooltip="Neu anlegen">
          <mat-icon>add</mat-icon>
        </button>
      </div>

      <mat-form-field appearance="fill" class="field-sm">
        <mat-label>Nummer</mat-label>
        <input matInput [(ngModel)]="number" name="number" placeholder="Auto" />
      </mat-form-field>

      <mat-form-field appearance="fill" class="field-sm">
        <mat-label>Datum</mat-label>
        <input matInput type="date" [(ngModel)]="date" name="date" required />
      </mat-form-field>
    </div>

    <!-- Zeile 2: URL -->
    <div class="form-row">
      <mat-form-field appearance="fill" class="field-xl">
        <mat-label>URL</mat-label>
        <input matInput type="url" [(ngModel)]="url" name="url" />
        <mat-icon matSuffix>link</mat-icon>
      </mat-form-field>
    </div>
  </mat-card-content>
</mat-card>
```

### Kosten/Preis Card

```html
<mat-card class="form-card">
  <mat-card-header>
    <mat-card-title>
      <mat-icon>payments</mat-icon>
      Kosten
    </mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <div class="form-row">
      <div class="price-field">
        <app-price-input
          [(ngModel)]="costs"
          name="costs"
          label="Kosten">
        </app-price-input>
      </div>
    </div>
  </mat-card-content>
</mat-card>
```

### Details/Notizen Card

```html
<mat-card class="form-card">
  <mat-card-header>
    <mat-card-title>
      <mat-icon>notes</mat-icon>
      Details
    </mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <div class="form-row">
      <mat-form-field appearance="fill" class="field-full">
        <mat-label>Notizen</mat-label>
        <textarea matInput [(ngModel)]="notes" name="notes" rows="3"></textarea>
      </mat-form-field>
    </div>

    <div class="checkbox-section">
      <mat-checkbox [(ngModel)]="specialFlag" name="specialFlag">
        <mat-icon>info</mat-icon>
        Besondere Option aktivieren
      </mat-checkbox>
      <p class="checkbox-hint">Beschreibung der Option</p>
    </div>
  </mat-card-content>
</mat-card>
```

## 🎨 Design Tokens

### Farben (identisch mit Detail-Seiten)
- **Primary Blue**: `#1976d2`
- **Primary Blue Light**: `#e3f2fd`
- **Heading**: `#333`
- **Body**: `#666`
- **Border**: `#e0e0e0`
- **Background Subtle**: `#f8f9fa`

### Abstände (identisch mit Detail-Seiten)
- **Page Padding**: `20px`
- **Content Gap**: `24px` (zwischen Header, Form-Cards, Full-Width Components)
- **Form Gap**: `24px` (zwischen Cards innerhalb des Forms)
- **Form Row Gap**: `16px` (zwischen Feldern in einer Zeile)
- **Card Header Margin**: `20px` (unter Card-Titel)
- **Card Content Padding**: `0 8px`

### Schriftgrößen
- **Page Title**: `28px`
- **Card Title**: `18px`
- **Form Labels**: Angular Material Default
- **Hint Text**: `12px`

## 📦 TypeScript Pattern

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { [Entity]Service } from './[entity].service';

@Component({
  selector: 'app-[entity]-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatTooltipModule,
    BreadcrumbComponent
  ],
  templateUrl: './[entity]-form.component.html',
  styleUrls: ['./[entity]-form.component.scss']
})
export class [Entity]FormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private [entity]Service = inject([Entity]Service);

  // State
  entityId: number | null = null;
  isEdit = false;

  // Form Fields
  field1: string = '';
  field2: string = '';
  // ... weitere Felder

  // Breadcrumb
  get breadcrumbLinks() {
    if (this.isEdit) {
      return [
        { label: '[Entities]', url: '/[entities]' },
        { label: '[Entity] #' + this.entityId, url: '/[entities]/' + this.entityId },
        { label: 'Bearbeiten', url: '' }
      ];
    }
    return [
      { label: '[Entities]', url: '/[entities]' },
      { label: 'Neu', url: '' }
    ];
  }

  ngOnInit() {
    this.entityId = Number(this.route.snapshot.paramMap.get('id')) || null;
    this.isEdit = !!this.entityId;

    if (this.isEdit) {
      this.loadEntity();
    }
  }

  loadEntity() {
    this.[entity]Service.get(this.entityId!).subscribe(entity => {
      this.field1 = entity.field1;
      this.field2 = entity.field2;
      // ... weitere Felder
    });
  }

  save() {
    const payload = {
      field1: this.field1,
      field2: this.field2,
      // ... weitere Felder
    };

    const request = this.isEdit
      ? this.[entity]Service.update(this.entityId!, payload)
      : this.[entity]Service.create(payload);

    request.subscribe({
      next: (result) => {
        this.snackBar.open('[Entity] gespeichert', 'OK', { duration: 3000 });
        this.router.navigate(['/[entities]', result.id]);
      },
      error: (error) => {
        console.error('Save error:', error);
        this.snackBar.open('Fehler beim Speichern', 'Schließen', { duration: 5000 });
      }
    });
  }

  get cancelRoute(): string[] {
    return this.isEdit ? ['/[entities]', String(this.entityId)] : ['/[entities]'];
  }
}
```

## 🔧 Best Practices

### 1. Header Actions
- **Abbrechen**: Zurück zur Detail-Seite (bei Edit) oder Liste (bei Neu)
- **Speichern**: Im Header rechts, als Primary Button
- Keine doppelten Actions am Seitenende

### 2. Formular-Validierung
- Required-Felder mit `required` markieren
- Mat-Error für Validierungsfehler
- Snackbar für Erfolg/Fehler-Feedback

### 3. Feldanordnung
- Zusammengehörige Felder in einer Zeile
- Wichtigste Felder zuerst
- Optionale Felder am Ende
- URLs und lange Texte in eigenen Zeilen

### 4. Responsive Verhalten
- Felder umbrechen auf kleineren Screens
- Touch-freundliche Button-Größen
- Keine horizontalen Scrollbars

### 5. Navigation
- Breadcrumbs zeigen aktuellen Kontext
- Abbrechen führt zurück ohne Datenverlust-Warnung (optional)
- Nach Speichern zur Detail-Seite navigieren

## 📋 Checkliste für Edit-Seiten

- [ ] Page Container mit max-width
- [ ] Breadcrumb mit korrektem Pfad
- [ ] Page Header mit Titel und Icon
- [ ] Abbrechen-Button links, Speichern rechts
- [ ] Form-Cards für logische Gruppierung
- [ ] Passende Feldbreiten
- [ ] Responsive Form-Rows
- [ ] Required-Markierungen
- [ ] Autocomplete für Referenzen
- [ ] Add-Buttons für neue verknüpfte Entities
- [ ] Checkbox-Sections für Optionen
- [ ] Loading State beim Laden
- [ ] Error Handling mit Snackbar
- [ ] Navigation nach Speichern

---

**Version**: 1.0  
**Letzte Aktualisierung**: 27. November 2025  
**Basis**: Order-Form Page, abgeleitet von Detail-Page Design Template
