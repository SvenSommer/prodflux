# Step 06 — Produktion je Werkstatt (Workshop-Specific Targets) — RESULT

**Status:** ✅ Complete  
**Date:** 26. November 2025

## Zusammenfassung

Step 6 ist erfolgreich abgeschlossen. Die wesentliche fachliche Korrektur wurde implementiert: **Produktionsziele enthalten jetzt die Fertigungswerkstatt** (workshopId). Die Engine berechnet den Materialbedarf korrekt **pro Werkstatt** basierend auf den Targets, statt equalSplit zu verwenden. Alle 72 Tests laufen grün.

---

## ⚠️ Warum diese Änderung notwendig war

### Problem (Fachlich)
In Step 1–5 wurden Produktionsziele als "global" behandelt und der Materialbedarf gleichmäßig (50/50) auf beide Werkstätten verteilt (`allocation: 'equalSplit'`). Das war **fachlich inkorrekt**, weil:

- **Jedes Produkt wird in einer konkreten Werkstatt gefertigt**
- Der Materialbedarf entsteht dort, wo produziert wird
- Transfers müssen basierend auf dem tatsächlichen Bedarf pro Werkstatt berechnet werden

### Lösung
Targets enthalten jetzt `workshopId` → Engine berechnet required pro Werkstatt direkt aus den Targets + BOM.

---

## ✅ 1) Neues Model: WorkshopProductTarget

### Datei
`src/app/features/material-planning/models/workshop-product-target.ts`

### Interface
```typescript
export interface WorkshopProductTarget {
  /** The product to be manufactured */
  productId: number;
  /** Quantity to produce */
  quantity: number;
  /** The workshop where this product will be manufactured */
  workshopId: number;
}
```

### Migration
- `GlobalProductTarget` bleibt bestehen (für backward compatibility), wird aber nicht mehr genutzt
- Alle Komponenten migriert zu `WorkshopProductTarget[]`

---

## ✅ 2) UI: Targets-Form mit Workshop-Auswahl

### MaterialPlannerTargetsFormComponent

**Inputs (neu):**
```typescript
@Input() workshops: WorkshopOption[] = [];
```

**Output (umbenannt):**
```typescript
@Output() targetsChange = new EventEmitter<WorkshopProductTarget[]>();
// Vorher: globalTargetsChange (jetzt fachlich korrekt: targetsChange)
```

**FormArray (erweitert):**
```typescript
{
  workshopId: [defaultWorkshopId, Validators.required],
  productId: [null, Validators.required],
  quantity: [0, [Validators.required, Validators.min(0)]]
}
```

**Default-Wert:**
Wenn Workshops verfügbar sind, wird initial die **erste** Workshop-ID gesetzt.

### Template-Änderungen

**Neue Spaltenreihenfolge:**
`Werkstatt | Produkt | Menge | Aktionen`

**Workshop-Select:**
```html
<mat-form-field appearance="outline" class="full-width">
  <mat-label>Werkstatt wählen</mat-label>
  <mat-select formControlName="workshopId" required>
    <mat-option *ngFor="let workshop of workshops" [value]="workshop.id">
      {{ workshop.label }}
    </mat-option>
  </mat-select>
</mat-form-field>
```

**Titel geändert:**
- Vorher: "Globale Produktziele"
- Jetzt: "Produktziele (nach Werkstatt)"

---

## ✅ 3) Page: Workshops einspeisen + Target-Type migrieren

### MaterialPlannerPageComponent

**Neue Observable:**
```typescript
workshopsForForm$!: Observable<WorkshopOption[]>;
```

**Initialisierung (ngOnInit):**
```typescript
this.workshopsForForm$ = this.planningData$.pipe(
  map(data => data.workshops.map(w => ({
    id: w.id,
    label: w.name
  })))
);
```

**Template (erweitert):**
```html
<app-material-planner-targets-form
  [products]="(productsForForm$ | async) || []"
  [workshops]="(workshopsForForm$ | async) || []"
  (targetsChange)="onTargetsChange($event)">
</app-material-planner-targets-form>
```

**Type-Migration:**
- `targets: GlobalProductTarget[]` → `targets: WorkshopProductTarget[]`
- `onTargetsChange(targets: GlobalProductTarget[])` → `onTargetsChange(targets: WorkshopProductTarget[])`

**Engine-Aufruf (bereinigt):**
```typescript
this.planningResult = planGlobalMaterials(
  this.targets,
  planningData.bom,
  planningData.stockByWorkshopAndMaterial,
  {
    centralWorkshopId,
    workshopIds,
    openOrdersByMaterialId: {} // Backend TODO
  }
);
// allocation: 'equalSplit' entfernt!
```

---

## ✅ 4) Engine v2.1: Workshop-spezifischer Materialbedarf

### Header-Kommentar aktualisiert
```typescript
/**
 * Material Planning Engine v2.1 (Step 6)
 * - Required per workshop calculated from targets (workshopId in targets)
 * - Allocation: equalSplit removed (obsolete)
 */
```

### Signatur-Änderung
```typescript
export function planGlobalMaterials(
  targets: WorkshopProductTarget[], // Vorher: GlobalProductTarget[]
  bom: ProductMaterial[],
  stockByWorkshop: StockByWorkshopAndMaterial,
  options: PlanOptions
): GlobalPlanningResult
```

### PlanOptions (bereinigt)
```typescript
export interface PlanOptions {
  centralWorkshopId: number;
  workshopIds: number[];
  openOrdersByMaterialId?: Record<number, number>;
  // allocation entfernt!
}
```

### Kern-Änderung: Step A

**Vorher (Step 5):**
1. Berechne global required
2. **Verteile** required auf Workshops (equalSplit)

**Jetzt (Step 6):**
1. Berechne global required **UND** workshop-spezifisch required **parallel**

```typescript
// Step A: Global Required per Material AND Workshop-specific Required
const requiredByMaterialId: Record<number, number> = {};
const requiredByWorkshopAndMaterial: Record<number, Record<number, number>> = {};

targets.forEach(target => {
  const relevantBomEntries = bom.filter(b => b.product === target.productId);

  relevantBomEntries.forEach(bomEntry => {
    const qtyPerUnit = parseDecimal(bomEntry.quantity_per_unit);
    const required = target.quantity * qtyPerUnit;

    // Global required
    requiredByMaterialId[bomEntry.material] += required;

    // Workshop-specific required (NEU!)
    const wId = target.workshopId;
    requiredByWorkshopAndMaterial[wId][bomEntry.material] += required;
  });
});
```

### Steps bereinigt
- **Step E (alt):** "Allocation - Required per Workshop (equalSplit)" → **entfernt**
- **Step E (neu):** "Stock After Orders" (wie vorher Step F)
- **Step F (neu):** "Greedy Transfer Planning" (wie vorher Step G, unverändert)
- **Step G (neu):** "Workshop Coverage Output" (wie vorher Step H, unverändert)

### Transfer-Logik (unverändert)
Transfers basieren weiterhin auf Delta (stockAfterOrders - required), aber `required` ist jetzt **werkstattbezogen korrekt** statt equalSplit.

---

## ✅ 5) Tests aktualisiert (72/72 grün)

### Engine Tests (material-planning.engine.spec.ts)

**Alle Szenarien migriert:**
- Targets enthalten jetzt `workshopId`
- Assertions für `totalTargets` korrigiert (z.B. 2 statt 1, wenn 2 Targets)

**Beispiel-Szenario (800/800):**
```typescript
const targets: WorkshopProductTarget[] = [
  { productId: PRODUCT_WIDGET, quantity: 800, workshopId: WORKSHOP_POTSDAM },
  { productId: PRODUCT_WIDGET, quantity: 800, workshopId: WORKSHOP_RAUEN }
];

// Erwartung (unverändert):
// - Global shortage: 200 → order 200 to Rauen
// - Required per workshop: Potsdam 800, Rauen 800
// - After order: Rauen 1400
// - Deltas: P -600, R +600 → Transfer 600 R→P
// - Remaining shortage: 0
```

**Validierungen:**
- ✅ Potsdam Coverage: required 800, coveredLocal 200, coveredByTransfers 600, shortage 0
- ✅ Rauen Coverage: required 800, coveredLocal 800, coveredByTransfers 0, shortage 0
- ✅ Transfer: 600 von Rauen → Potsdam

### Form Tests (material-planner-targets-form.component.spec.ts)

**Neue Tests:**
- ✅ Workshop-Select existiert und kann gesetzt werden
- ✅ Default workshopId wird gesetzt (erste Workshop)
- ✅ Output emittiert `WorkshopProductTarget` (inkl. workshopId)
- ✅ Nur valide Zeilen (mit workshopId) werden emittiert

**Output-Umbenennung:**
- `globalTargetsChange` → `targetsChange`

### Page Tests (material-planner-page.component.spec.ts)

**Neue Tests:**
- ✅ `workshopsForForm$` liefert korrekte Workshop-Optionen

**Migrierte Tests:**
- Alle `GlobalProductTarget[]` → `WorkshopProductTarget[]` (mit workshopId)
- Assertions weiterhin korrekt (keine Breaking Changes in Logik)

---

## 🧪 Test-Ergebnis

### Command
```bash
npm test -- --include='**/material-planning/**/*.spec.ts' --no-watch --browsers=ChromeHeadless
```

### Ergebnis
✅ **72 von 72 Tests erfolgreich** (100%)

```
Chrome Headless 142.0.0.0 (Mac OS 10.15.7): Executed 72 of 72 SUCCESS (0.733 secs / 0.7 secs)
TOTAL: 72 SUCCESS
```

### Warnings (kein Fehler)
- Einige conditional Tests: "no expectations" (z.B. wenn keine TransferSuggestions vorhanden)
- HTTP-Fehler in Service-Tests (erwartet, Mock-Backend)
- Parsing-Warnungen für invalid `quantity_per_unit` (erwartet, Tests für parseDecimal)

---

## 📁 Geänderte/Neue Dateien

### Neue Dateien
```
models/
└── workshop-product-target.ts (NEW)
```

### Geänderte Dateien
```
engine/
├── material-planning.engine.ts (v2.1, workshop-specific required)
└── material-planning.engine.spec.ts (alle Szenarien migriert)

material-planner-targets-form/
├── material-planner-targets-form.component.ts (workshops input, workshopId field)
├── material-planner-targets-form.component.html (workshop select column)
└── material-planner-targets-form.component.spec.ts (neue Tests)

material-planner-page/
├── material-planner-page.component.ts (workshopsForForm$, WorkshopProductTarget)
├── material-planner-page.component.html (workshops input an Form)
└── material-planner-page.component.spec.ts (migrierte Tests)
```

---

## 🔄 User Workflow (aktualisiert)

1. **Produktziele erfassen:**
   - **Neu:** Werkstatt auswählen (Select-Feld)
   - Produkt auswählen
   - Menge eingeben
   - Weitere Zeilen hinzufügen (z.B. Potsdam baut 800, Rauen baut 800)

2. **Plan berechnen:**
   - Engine verwendet jetzt **workshopId** aus Targets
   - Materialbedarf pro Werkstatt korrekt berechnet

3. **Ergebnisse ansehen:**
   - Tab 1: Bestellvorschlag (unverändert)
   - Tab 2: **Transfers jetzt korrekt** (basierend auf echtem Bedarf pro Werkstatt)
   - Tab 3: Coverage pro Werkstatt (korrekte required-Werte)

4. **Transfer-ToDos übernehmen:**
   - Funktioniert weiterhin wie vorher

---

## ⚠️ Backend TODOs (unverändert)

### 1. Bestellungen (Tab 1)
**Aktuell:** Placeholder `1.00 € (Backend TODO)`  
**Zukünftig:** Material-Preise + POST `/api/orders/`

### 2. Transfers (ToDo-Übersicht)
**Aktuell:** Nur Frontend-State  
**Zukünftig:** POST `/api/transfers/` oder `/api/material-movements/`

### 3. Offene Bestellungen
**Aktuell:** `openOrdersByMaterialId: {}` (leer)  
**Zukünftig:** GET `/api/orders/` + `/api/deliveries/`

---

## 🎨 UI-Änderungen

### Visible Changes
- **Workshop-Spalte** in Targets-Tabelle (links)
- **Titel:** "Globale Produktziele" → "Produktziele (nach Werkstatt)"
- Workshop-Select (Material Design mat-select)

### Unchanged
- Tabs (3 wie vorher)
- Bestellvorschlag-Anzeige
- Transfer-ToDo-Übersicht
- Styling/Farben

---

## 🐛 Breaking Changes

### API (intern)
- ❌ `GlobalProductTarget` → ✅ `WorkshopProductTarget` (neue Property: workshopId)
- ❌ `globalTargetsChange` Output → ✅ `targetsChange` Output
- ❌ `allocation: 'equalSplit'` in PlanOptions → entfernt

### Backward Compatibility
- `GlobalProductTarget` Interface bleibt vorhanden (deprecated, nicht mehr genutzt)
- Keine Breaking Changes für Backend-API (keine neuen Endpunkte erfunden)

---

## 🔜 Nächste Schritte (Step 7+)

### Mögliche Features
1. **Persistenz (Backend Integration):**
   - POST `/api/orders/` für Bestellungen
   - POST `/api/transfers/` für Transfers
   - GET `/api/orders/` für offene Bestellungen

2. **Material-Preise:**
   - Backend: Material.price_per_unit
   - Frontend: Integration in Planning-Flow + Kostenrechnung

3. **N-Workshop Support (N > 2):**
   - Engine erweitern (Step 3/6 nur 2 Workshops)
   - Transfer-Algorithmus: Greedy → Optimierter Flow (z.B. min-cost-max-flow)

4. **Navigation:**
   - Von Bestellvorschlag zu Order-Create-Page (pre-filled)
   - Von ToDos zu Transfer-Create-Page (pre-filled)

5. **LocalStorage (optional):**
   - Transfer-ToDos überleben Browser-Reload

6. **Advanced Features:**
   - Multi-Product Support in einem Target (Varianten)
   - Zeitplanung (Liefertermine)
   - Priorisierung von Transfers

---

## ✅ Acceptance Criteria — Erfüllt

- [x] User kann im Formular je Zeile eine Werkstatt auswählen
- [x] Eingabe + „Plan berechnen" erzeugt plausible Transfers passend zur Werkstatt-Produktion
- [x] Beispiel-Fall (800/800, Stock 200/1200) führt zu:
  - [x] Bestellung 200 nach Rauen
  - [x] Transfer 600 Rauen → Potsdam
  - [x] Remaining shortage 0
- [x] Alle bestehenden Material-Planning Tests laufen grün (72/72)
- [x] Keine neuen Backend-Endpunkte erfunden
- [x] Minimal-invasive Migration (kein Redesign)
- [x] Tests aktualisiert (Engine, Form, Page)

---

## 📝 Changelog

### Added
- `WorkshopProductTarget` Interface (models/workshop-product-target.ts)
- Workshop-Select in MaterialPlannerTargetsFormComponent
- `workshops` Input in MaterialPlannerTargetsFormComponent
- `workshopsForForm$` Observable in MaterialPlannerPageComponent
- Workshop-spezifische Bedarfsberechnung in Engine (Step A erweitert)
- 3 neue Tests für Workshop-Funktionalität (Form)
- 1 neuer Test für workshopsForForm$ (Page)

### Changed
- Engine v2.0 → v2.1 (Header-Kommentar)
- `planGlobalMaterials()` akzeptiert `WorkshopProductTarget[]`
- `PlanOptions` entfernt `allocation` (obsolet)
- Engine Step A: required pro Werkstatt direkt aus Targets berechnet
- Engine Steps E/F/G umbenannt (ehemals F/G/H)
- MaterialPlannerTargetsFormComponent:
  - Output umbenannt: `globalTargetsChange` → `targetsChange`
  - FormArray erweitert: `workshopId` field
  - Spaltenreihenfolge: Workshop | Produkt | Menge | Aktionen
- MaterialPlannerPageComponent:
  - `targets: GlobalProductTarget[]` → `WorkshopProductTarget[]`
  - Engine-Aufruf ohne `allocation`
- Alle Tests migriert zu `WorkshopProductTarget`

### Removed
- `allocation: 'equalSplit'` aus PlanOptions
- Step E (Allocation - equalSplit) aus Engine (obsolet)

### Fixed
- ✅ **Fachliche Korrektur:** Materialbedarf pro Werkstatt jetzt korrekt (nicht mehr 50/50)
- ✅ **Transfers:** Basieren jetzt auf echtem Bedarf statt künstlicher Verteilung

---

## 🎯 Zusammenfassung

**Step 6 ist vollständig abgeschlossen.** Die wesentliche fachliche Korrektur wurde erfolgreich implementiert: Produktionsziele enthalten jetzt die Fertigungswerkstatt (workshopId), und die Engine berechnet den Materialbedarf korrekt pro Werkstatt. Die Migration war minimal-invasiv (keine UI-Redesigns), alle 72 Tests laufen grün, und die Implementierung ist bereit für Backend-Integration in späteren Steps.

**Key Achievement:**  
Materialbedarf wird jetzt **dort berechnet, wo produziert wird** — nicht mehr künstlich 50/50 verteilt.

---

**Autor:** GitHub Copilot  
**Review:** Ready for Step 7 (Backend Integration)
