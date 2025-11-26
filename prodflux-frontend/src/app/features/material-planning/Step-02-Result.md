# Step 02 - Material Planning Feature: Datenbeschaffung & Domain-Modelle

## ✅ Was wurde gebaut

### 1. Domain-Modelle (API Interfaces)
**Pfad**: `src/app/features/material-planning/models/api/`

Neue TypeScript Interfaces für die Material-Planung:

- **`workshop.model.ts`**: Workshop Interface (id, name)
- **`product.model.ts`**: Product Interface (id, bezeichnung, artikelnummer, deprecated)
- **`material.model.ts`**: Material Interface (id, bezeichnung, bestell_nr, deprecated)
- **`product-material.model.ts`**: ProductMaterial BOM Interface (id, product, material, quantity_per_unit)
- **`workshop-material-stock.model.ts`**: WorkshopMaterialStockItem Interface (material, quantity)

Alle Modelle sind schlanke Interfaces, die nur die für die Planung notwendigen Felder enthalten.

### 2. MaterialPlanningDataService
**Pfad**: `src/app/features/material-planning/services/material-planning-data.service.ts`

Zentraler Service für die Datenbeschaffung mit folgenden Features:

#### Public API
```typescript
interface MaterialPlanningData {
  workshops: Workshop[];
  products: Product[];
  materials: Material[];
  bom: ProductMaterial[];
  lookups: MaterialPlanningLookups;
  stockByWorkshopAndMaterial: StockByWorkshopAndMaterial;
}

loadAll(): Observable<MaterialPlanningData>
```

#### Implementierungsdetails
- **Parallele Datenladung**: Workshops, Products, Materials und BOM werden via `forkJoin` parallel geladen
- **Stock-Ladung**: Für jeden Workshop wird der Material-Stock separat geladen
- **Fehlertoleranz**: Bei Stock-Ladungsfehlern wird für den betroffenen Workshop ein leerer Bestand angenommen (kein kompletter Absturz)
- **Lookup-Maps**: Automatische Erstellung von `Record<number, T>` für schnellen Zugriff per ID
- **Stock-Struktur**: `stockByWorkshopAndMaterial[workshopId][materialId] = quantity`

#### Helper-Funktionen
- `toRecordById<T>()`: Konvertiert Arrays in ID-indizierte Records
- `loadWorkshopStock()`: Lädt und parst Stock-Daten für einen Workshop

### 3. UI-Anbindung (MaterialPlannerPageComponent)
**Änderungen**: `material-planner-page/material-planner-page.component.ts/html/scss`

#### Neue Features
- **Data Loading**: `planningData$` Observable lädt alle Daten via DataService
- **Product Integration**: `productsForForm$` transformiert Products in Form-kompatibles Format
- **Loading State**: Mat-Spinner während Daten geladen werden
- **Echte Produktdaten**: Form erhält echte Produkte statt Dummy-Daten

#### Template-Änderungen
```html
<div *ngIf="!(planningData$ | async)">
  <mat-spinner></mat-spinner>
  <p>Lade Daten...</p>
</div>

<div *ngIf="planningData$ | async as planningData">
  <app-material-planner-targets-form
    [products]="(productsForForm$ | async) || []"
    (globalTargetsChange)="onTargetsChange($event)">
  </app-material-planner-targets-form>
</div>
```

### 4. Unit Tests

#### MaterialPlanningDataService Tests
**Datei**: `services/material-planning-data.service.spec.ts`

6 Testfälle:
1. ✅ Service wird erstellt
2. ✅ `loadAll()` macht alle erwarteten API-Calls (Workshops, Products, Materials, BOM, Stock pro Workshop)
3. ✅ Lookups werden korrekt gebaut (`productById`, `materialById`, `workshopById`)
4. ✅ `stockByWorkshopAndMaterial` wird korrekt aus API-Response gebaut
5. ✅ Fehlerfall: Stock-Call schlägt fehl → Service setzt leeren Bestand für diesen Workshop
6. ✅ Leere Workshop-Liste wird korrekt behandelt

#### MaterialPlannerPageComponent Tests (aktualisiert)
**Datei**: `material-planner-page/material-planner-page.component.spec.ts`

10 Testfälle:
1. ✅ Component erstellt
2. ✅ Titel wird gerendert
3. ✅ 3 Tabs mit korrekten Labels
4. ✅ Output-Handler funktioniert
5. ✅ Targets-Array initial leer
6. ✅ Form-Component vorhanden
7. ✅ Planning Data wird beim Init geladen
8. ✅ Products werden an Form übergeben
9. ✅ Echte Produkte werden verwendet (keine Dummy-Daten)
10. ✅ Loading State wird angezeigt

## 🔌 Verwendete Backend-Endpunkte

Alle Endpunkte sind **bestehende APIs** (keine neuen Backend-Änderungen erforderlich):

### Stammdaten
- `GET /api/workshops/` → Workshop[]
- `GET /api/products/` → Product[]
- `GET /api/materials/` → Material[]
- `GET /api/product-materials/` → ProductMaterial[]

### Material-Stocks (pro Workshop)
- `GET /api/workshops/{workshop_id}/material-stock/` → MaterialStockGroup[]

**Format der Stock-Response** (basierend auf existierendem WorkshopService):
```typescript
[
  {
    category_id: number | null,
    category_name: string,
    materials: [
      { id: number, current_stock: number, ... }
    ]
  }
]
```

## ⚠️ Backend TODO

### OpenAPI-Dokumentation unvollständig
**Problem**: Die OpenAPI-Spec für `GET /api/workshops/{workshop_id}/material-stock/` zeigt "No response body".

**Aktuelle Lösung**: 
- Der Frontend-Service nutzt das tatsächliche Response-Format des WorkshopService
- Format ist `MaterialStockGroup[]` mit gruppierten Materialien nach Kategorien
- Der Service parst dieses Format korrekt und extrahiert `current_stock` pro Material

**TODO für Backend-Team**:
- OpenAPI-Schema für `/material-stock/` Endpoint aktualisieren
- Response-Body-Schema dokumentieren (MaterialStockGroup[])
- Sicherstellen, dass das Format stabil bleibt

### Alternative Backend-Implementierung (optional)
Für Step 3 könnte ein dedizierter Planungs-Endpoint sinnvoll sein:
```
POST /api/material-planning/calculate/
Request: { targets: GlobalProductTarget[] }
Response: { requirements, orders, transfers, coverage }
```

Dies ist aber **nicht erforderlich** - die Planung kann auch komplett frontend-seitig erfolgen.

## 🧪 Tests ausführen

### Nur Material-Planning Tests
```bash
cd prodflux-frontend
npm test -- --include='**/material-planning/**/*.spec.ts' --browsers=ChromeHeadless --watch=false
```

### Alle Tests
```bash
cd prodflux-frontend
npm test
```

### Erwartetes Ergebnis
- **MaterialPlanningDataService**: 6/6 Tests ✅
- **MaterialPlannerTargetsFormComponent**: 8/8 Tests ✅
- **MaterialPlannerPageComponent**: 10/10 Tests ✅
- **Gesamt**: 24/24 Tests ✅

## 📁 Dateistruktur nach Step 2

```
src/app/features/material-planning/
├── models/
│   ├── global-product-target.ts          (Step 1)
│   └── api/                               (Step 2 - NEU)
│       ├── workshop.model.ts
│       ├── product.model.ts
│       ├── material.model.ts
│       ├── product-material.model.ts
│       └── workshop-material-stock.model.ts
├── services/                              (Step 2 - NEU)
│   ├── material-planning-data.service.ts
│   └── material-planning-data.service.spec.ts
├── material-planner-page/                 (Step 1, aktualisiert in Step 2)
│   ├── material-planner-page.component.ts       (✏️ aktualisiert)
│   ├── material-planner-page.component.html     (✏️ aktualisiert)
│   ├── material-planner-page.component.scss     (✏️ aktualisiert)
│   └── material-planner-page.component.spec.ts  (✏️ aktualisiert)
├── material-planner-targets-form/         (Step 1, unverändert)
├── material-planning.routes.ts            (Step 1, unverändert)
├── Step-01-Result.md                      (Step 1)
└── Step-02-Result.md                      (Step 2 - dieses Dokument)
```

## 🚀 Verwendung

### Development Server starten
```bash
cd prodflux-frontend
ng serve
```

### Route aufrufen
Nach dem Login: `http://localhost:4200/material-planner`

### Was passiert jetzt
1. Service lädt automatisch alle Stammdaten (Workshops, Products, Materials, BOM)
2. Service lädt Material-Stocks für alle Workshops
3. Produkt-Dropdown zeigt **echte Produkte** aus der Datenbank
4. Loading-Spinner während Datenladung
5. Tabs zeigen weiterhin Platzhalter (Berechnungen kommen in Step 3)

## 🔜 Nächster Step: Step 3 - Planning Engine

### Was kommt in Step 3
1. **MaterialPlanningEngine Service**
   - Bedarfsberechnung basierend auf Targets + BOM
   - Bestellungsplanung (Order Calculation)
   - Transfer-Planung zwischen Workshops
   - Coverage-Analyse pro Workshop

2. **Tab-Content Components**
   - `GlobalRequirementsComponent` (Tab 1: Bedarf & Bestellungen)
   - `TransferPlanComponent` (Tab 2: Transfers)
   - `WorkshopCoverageComponent` (Tab 3: Deckung)

3. **Datenfluss**
   - Targets ändern → Engine berechnet → Tabs zeigen Ergebnisse
   - Reactive Updates bei Target-Änderungen

### Vorbereitung für Step 3
- `MaterialPlanningData` ist bereits vollständig verfügbar
- Alle Lookups sind aufgebaut (schneller Zugriff per ID)
- Stock-Daten sind strukturiert verfügbar
- BOM ist geladen für Bedarfsberechnung

## 📊 Code-Statistik Step 2

### Neue Dateien: 7
- 5 Model-Interfaces
- 1 Service + 1 Test

### Geänderte Dateien: 4
- MaterialPlannerPageComponent (TS + HTML + SCSS + Test)

### Zeilen Code (ca.): ~600
- Models: ~40 LOC
- DataService: ~150 LOC
- DataService Tests: ~250 LOC
- Page Component Updates: ~80 LOC
- Page Component Test Updates: ~80 LOC

## ✅ Akzeptanzkriterien erfüllt

- [x] `ng test --include='**/material-planning/**/*.spec.ts'` läuft grün (24/24)
- [x] Route `/material-planner` lädt echte Products aus Backend
- [x] Produkt-Dropdown zeigt echte Produkte (keine Dummy-Daten)
- [x] `MaterialPlanningDataService.loadAll()` liefert vollständiges `MaterialPlanningData`
- [x] `stockByWorkshopAndMaterial` + Lookups korrekt aufgebaut
- [x] `Step-02-Result.md` vorhanden und dokumentiert OpenAPI-Lücke
- [x] Fehlertoleranz: Stock-Ladefehler crashen nicht das ganze Feature
- [x] Keine neuen Backend-Endpunkte erforderlich

## 📝 Hinweise für Entwickler

### API-Pattern
Das Projekt nutzt `environment.apiUrl` + `/api/` für alle Backend-Calls:
```typescript
private baseUrl = `${environment.apiUrl}/api`;
```

### Fehlerbehandlung
Stock-Ladungsfehler werden graceful behandelt:
```typescript
catchError(error => {
  console.warn(`Failed to load stock for workshop ${workshop.id}:`, error);
  return of({ workshopId: workshop.id, stockByMaterial: {} });
})
```

### Performance
- `shareReplay(1)` verhindert mehrfache API-Calls
- Parallele Datenladung via `forkJoin`
- Lookup-Maps für O(1) Zugriff

### Typsicherheit
Alle API-Responses sind typisiert (keine `any` Types)

---

**Status**: Step 2 abgeschlossen ✅  
**Nächster Step**: Step 3 - Planning Engine & Result-Tabs  
**Geschätzte Komplexität Step 3**: Hoch (Berechnungslogik + 3 neue Components)
