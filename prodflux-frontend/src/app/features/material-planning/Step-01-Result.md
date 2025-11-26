# Step 01 - Material Planning Feature: UI Grundgerüst

## ✅ Was wurde erstellt/geändert

### 1. Model Interface
- **Datei**: `src/app/features/material-planning/models/global-product-target.ts`
- **Inhalt**: Definition des `GlobalProductTarget` Interface mit `productId` und `quantity`

### 2. Form Component: MaterialPlannerTargetsFormComponent
- **Pfad**: `src/app/features/material-planning/material-planner-targets-form/`
- **Dateien**:
  - `material-planner-targets-form.component.ts`
  - `material-planner-targets-form.component.html`
  - `material-planner-targets-form.component.scss`
  - `material-planner-targets-form.component.spec.ts`

**Features**:
- Standalone Component mit ReactiveFormsModule
- FormArray für dynamische Produktziel-Zeilen
- Material Table mit Spalten: Produkt (Dropdown), Gesamtmenge (Number Input), Aktionen (Löschen)
- "Zeile hinzufügen" Button
- Dummy-Produktoptionen (Produkt A, B, C) als Fallback
- `@Input() products` für spätere Integration echter Produktdaten
- `@Output() globalTargetsChange` Event mit debounce (300ms)
- Validation: productId und quantity required, quantity min 0
- Empty State wenn keine Zeilen vorhanden

### 3. Page Component: MaterialPlannerPageComponent
- **Pfad**: `src/app/features/material-planning/material-planner-page/`
- **Dateien**:
  - `material-planner-page.component.ts`
  - `material-planner-page.component.html`
  - `material-planner-page.component.scss`
  - `material-planner-page.component.spec.ts`

**Features**:
- Standalone Component mit Angular Material
- Responsive Grid Layout (2 Spalten auf Desktop, 1 Spalte auf Mobile)
- Header mit Titel "Materialplanung" und Use-Case Beschreibung
- Links/oben: MaterialPlannerTargetsFormComponent in MatCard
- Rechts/unten: MatTabGroup mit 3 Tabs (Platzhaltertext):
  - "Globaler Bedarf & Bestellungen"
  - "Transfers nach Lieferung"
  - "Deckung pro Werkstatt"
- State: `targets: GlobalProductTarget[] = []`
- Event Handler: `onTargetsChange(targets)` für Form Output

### 4. Routing
- **Datei**: `src/app/features/material-planning/material-planning.routes.ts`
  - Feature-Routes exportiert als `materialPlanningRoutes`
  - Lazy-loaded MaterialPlannerPageComponent auf Root-Path
  
- **Geändert**: `src/app/app.routes.ts`
  - Neue Lazy Route `/material-planner` unter geschützten Routen
  - Nutzt `loadChildren` für Feature-Routen

### 5. Unit Tests
**MaterialPlannerTargetsFormComponent Tests**:
- ✅ Component rendert
- ✅ "Zeile hinzufügen" Button erzeugt neue Zeile
- ✅ Löschen-Button entfernt Zeile
- ✅ `globalTargetsChange` Event wird mit korrekter Struktur emittiert
- ✅ Nur valide Targets werden emittiert
- ✅ Dummy-Produkte werden verwendet wenn keine Products Input gesetzt
- ✅ Provided Products werden verwendet wenn gesetzt

**MaterialPlannerPageComponent Tests**:
- ✅ Component rendert
- ✅ Titel "Materialplanung" wird angezeigt
- ✅ 3 Tabs mit korrekten Labels vorhanden
- ✅ `onTargetsChange` Handler setzt targets korrekt
- ✅ Targets Array wird leer initialisiert
- ✅ MaterialPlannerTargetsFormComponent ist im Template enthalten

## 🚀 Wie aufrufbar

### Development Server
```bash
cd prodflux-frontend
ng serve
```

### Route
Nach dem Login navigieren zu:
```
http://localhost:4200/material-planner
```

Oder nach Deployment:
```
https://your-domain.com/material-planner
```

Die Route ist durch `authGuard` geschützt - Authentifizierung erforderlich.

## 📝 Hinweise

### Verwendete Angular Material Module
- MatCardModule
- MatTabsModule
- MatButtonModule
- MatIconModule
- MatFormFieldModule
- MatInputModule
- MatSelectModule
- MatTableModule

### Styling
- Responsive Grid Layout mit CSS Grid
- Mobile-first Approach (stacked layout auf Mobile)
- Material Design Theming
- Proper spacing und padding

### Architektur
- Standalone Components (Angular 19)
- Reactive Forms für Form-Handling
- Event-driven Kommunikation (Output Events)
- Lazy Loading für bessere Performance

## 🔜 Nächste Schritte (Step 2/3)

### Backend TODO
In den nächsten Steps werden folgende Backend-Features benötigt:

1. **Datenladung**:
   - Products API Integration
   - Workshops API Integration
   - Materials API Integration
   - Current Stock Levels

2. **Planungs-Engine** (wird in Step 2/3 implementiert):
   - Bedarfsberechnung basierend auf ProductMaterials (BOM)
   - Werkstatt-spezifische Bestandsprüfung
   - Bestellungsberechnung für Rauen
   - Transfer-Planung zwischen Werkstätten
   - Deckungsanalyse pro Werkstatt

3. **Neue Backend Endpoints** (optional):
   - `POST /api/material-planning/calculate/` für Planungsberechnung
   - Oder: Frontend-seitige Berechnung mit vorhandenen APIs

### Frontend TODO (Step 2/3)
1. **Data Service erstellen**:
   - MaterialPlanningDataService für API-Calls
   - Product, Workshop, Material Services nutzen

2. **Planning Engine implementieren**:
   - MaterialPlanningEngine Service
   - Bedarfsberechnung-Logik
   - Transfer-Planungs-Algorithmus

3. **Tab-Content Components**:
   - GlobalRequirementsComponent (Tab 1)
   - TransferPlanComponent (Tab 2)
   - WorkshopCoverageComponent (Tab 3)

4. **Daten-Integration**:
   - Echte Products laden und in Form übergeben
   - Planning Engine Results in Tabs anzeigen

## ✅ Akzeptanzkriterien erfüllt

- [x] Route `/material-planner` funktioniert
- [x] Formular links/oben mit dynamischen Zeilen
- [x] Tabs rechts/unten mit Platzhaltern
- [x] Unit Tests vorhanden und lauffähig
- [x] Step-01-Result.md existiert
- [x] Keine Backend-Calls in Step 1
- [x] Standalone Components
- [x] Angular Material verwendet
- [x] Responsive Layout

## 🧪 Tests ausführen

```bash
cd prodflux-frontend
ng test --include='**/material-planning/**/*.spec.ts'
```

Oder alle Tests:
```bash
ng test
```

---

**Status**: Step 1 abgeschlossen ✅  
**Nächster Step**: Step 2 - Data Services und Planning Engine  
**Geschätzte Komplexität Step 2**: Mittel-Hoch (Engine-Logik)
