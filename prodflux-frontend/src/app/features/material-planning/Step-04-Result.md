# Step 04 — MaterialPlanner UI + Engine Integration — RESULT

**Status:** ✅ Complete  
**Date:** 26. November 2025

## Zusammenfassung

Step 4 ist erfolgreich abgeschlossen. Die drei Tab-Komponenten wurden erstellt, die Planning Engine wurde in die UI integriert, und alle 61 Tests laufen grün durch.

---

## ✅ Implementierte Komponenten

### 1. GlobalDemandOrdersTabComponent (Tab 1)
**Pfad:** `components/global-demand-orders-tab/`

**Funktion:**
- Zeigt globalen Materialbedarf und vorgeschlagene Bestellungen
- mat-table mit 7 Spalten:
  - Material (Name + Bestellnummer)
  - Gesamtbedarf
  - Gesamtbestand
  - Offene Bestellungen
  - Verfügbar gesamt
  - Fehlmenge (rot markiert wenn > 0)
  - Vorgeschlagene Bestellung (blau markiert wenn > 0)

**Inputs:**
- `rows: GlobalMaterialRow[]` — Material-Übersicht aus Engine
- `materialById: Record<number, Material>` — Material-Lookup

**Empty State:** „Noch kein Plan berechnet."

---

### 2. TransferPlanTabComponent (Tab 2)
**Pfad:** `components/transfer-plan-tab/`

**Funktion:**
- Zeigt Transferplan nach Lieferung
- Dynamische Werkstatt-Spalten (basierend auf `workshopIds`)
- Pro Werkstatt: Bedarf, Verfügbar, Delta
- Lösungsvorschlag-Spalte:
  - Bestellung (wenn > 0)
  - Transfers (wenn vorhanden)

**Inputs:**
- `materials: GlobalMaterialRow[]`
- `transfers: MaterialTransferSuggestion[]`
- `coverage: WorkshopCoverage[]`
- `workshopById: Record<number, Workshop>`
- `materialById: Record<number, Material>`
- `workshopIds: number[]`
- `centralWorkshopId?: number`

**ViewModel:** `TransferPlanRowVm` — gruppiert Coverage und Transfers pro Material

**Empty State:** „Noch kein Plan berechnet."

---

### 3. WorkshopCoverageTabComponent (Tab 3)
**Pfad:** `components/workshop-coverage-tab/`

**Funktion:**
- Zeigt Deckung pro Werkstatt (Kontrollblick)
- Dynamische Werkstatt-Spalten mit 4 Sub-Spalten:
  - Bedarf
  - Lokal
  - Transfer
  - Fehlmenge (rot wenn > 0)

**Inputs:**
- `coverage: WorkshopCoverage[]`
- `workshopById: Record<number, Workshop>`
- `materialById: Record<number, Material>`
- `workshopIds: number[]`

**ViewModel:** `CoverageRowVm` — gruppiert Coverage pro Material

**Empty State:** „Noch kein Plan berechnet."

---

## ✅ MaterialPlannerPageComponent Updates

### Neue Features

1. **State Management:**
   - `planningResult: GlobalPlanningResult | null`
   - `error: string | null`

2. **Calculate Plan Button:**
   - Disabled wenn `targets.length === 0`
   - Ruft `calculatePlan(planningData)` auf

3. **Engine Integration (`calculatePlan` Methode):**
   ```typescript
   calculatePlan(planningData: MaterialPlanningData): void {
     // Workshop-Bestimmung
     let workshopIds: number[];
     if (workshops include 1 and 2) {
       workshopIds = [1, 2];
     } else {
       workshopIds = [first two sorted by id];
     }

     // Zentrale Werkstatt
     const centralWorkshopId = workshopIds.includes(2) ? 2 : workshopIds[1];

     // Engine-Aufruf
     this.planningResult = planGlobalMaterials(
       this.targets,
       planningData.bom,
       planningData.stockByWorkshopAndMaterial,
       { centralWorkshopId, workshopIds, allocation: 'equalSplit', openOrdersByMaterialId: {} }
     );
   }
   ```

4. **Error Handling:**
   - Try-Catch um Engine-Aufruf
   - Error-Display in mat-card (rot) bei Fehlern
   - Mindestens 2 Werkstätten erforderlich — sonst Error

5. **Conditional Rendering:**
   - No-Result-Hint wenn `planningResult == null`
   - Tab-Group nur sichtbar wenn `planningResult` vorhanden

### Template Updates
- Calculate-Button mit disabled state
- Error-Message-Card (rot) für Fehler
- Tabs nutzen neue Components mit korrekten Inputs
- Lookups aus `planningData.lookups.*`

---

## ⚠️ Annahmen & Einschränkungen (Step 4)

### 1. Genau 2 Werkstätten
- Engine-Logik (Step 3) unterstützt nur 2 Werkstätten
- Bevorzugt: [1, 2] (Potsdam, Rauen)
- Fallback: erste zwei sortiert nach ID
- Error wenn < 2 Werkstätten

### 2. Zentrale Werkstatt
- Bevorzugt: ID 2 (Rauen)
- Fallback: zweite Workshop-ID

### 3. Allocation Strategy
- Fest: `equalSplit` (50/50)
- Keine anderen Strategien implementiert

### 4. Offene Bestellungen
- Aktuell: `openOrdersByMaterialId: {}`
- **Backend TODO:** Später aus `/api/orders/` + `/api/deliveries/` ableiten

---

## 🧪 Tests

### Status
✅ **61 von 61 Tests erfolgreich**

### Test-Command
```bash
npm test -- --include='**/material-planning/**/*.spec.ts' --no-watch --browsers=ChromeHeadless
```

### Test-Coverage

#### GlobalDemandOrdersTabComponent (5 Tests)
- Component creation
- Empty state rendering
- Table rendering mit Materialien
- Material order number display
- Dash für fehlende order number

#### TransferPlanTabComponent (6 Tests)
- Component creation
- Empty state rendering
- Table rendering mit Materialien
- Transfer suggestion display
- Empty transfers (dash)
- Row building on changes

#### WorkshopCoverageTabComponent (7 Tests)
- Component creation
- Empty state rendering
- Table rendering mit Coverage
- Grouping by material
- Workshop data extraction
- Missing workshop data (null)
- Multiple materials grouping

#### MaterialPlannerPageComponent (14 Tests inkl. neue)
- Component creation
- Title rendering
- Tab labels (nach Berechnung)
- Targets change handling
- Planning data loading
- Products for form
- Calculate plan execution
- Error display für ungültige Workshop-Anzahl
- Material name in results
- No result hint display
- Hide hint when result exists

---

## 📁 Dateistruktur

```
prodflux-frontend/src/app/features/material-planning/
├── components/
│   ├── global-demand-orders-tab/
│   │   ├── global-demand-orders-tab.component.ts
│   │   ├── global-demand-orders-tab.component.html
│   │   ├── global-demand-orders-tab.component.scss
│   │   └── global-demand-orders-tab.component.spec.ts
│   ├── transfer-plan-tab/
│   │   ├── transfer-plan-tab.component.ts
│   │   ├── transfer-plan-tab.component.html
│   │   ├── transfer-plan-tab.component.scss
│   │   └── transfer-plan-tab.component.spec.ts
│   └── workshop-coverage-tab/
│       ├── workshop-coverage-tab.component.ts
│       ├── workshop-coverage-tab.component.html
│       ├── workshop-coverage-tab.component.scss
│       └── workshop-coverage-tab.component.spec.ts
├── material-planner-page/
│   ├── material-planner-page.component.ts (updated)
│   ├── material-planner-page.component.html (updated)
│   ├── material-planner-page.component.scss (updated)
│   └── material-planner-page.component.spec.ts (updated)
└── Step-04-Result.md (this file)
```

---

## 🎨 Styling & UX

### Tabellen
- Horizontal scrollbar bei vielen Spalten (`overflow: auto`)
- Min-width für lesbare Darstellung
- Zahlen mit `DecimalPipe` formatiert (1.0-2)
- Empty values: „–"

### Farben
- Fehlmenge: `#d32f2f` (rot)
- Vorgeschlagene Bestellung: `#1976d2` (blau)
- Transfer: `#f57c00` (orange)
- Delta positiv: `#2e7d32` (grün)
- Delta negativ: `#d32f2f` (rot)

### Empty States
- Zentriert, dezent (grau)
- Hint-Text: "Bitte Produktziele erfassen und Plan berechnen."

### Error Display
- Rote mat-card mit Rahmen
- Klare Fehlermeldung

---

## 🔄 Workflow

1. User öffnet `/material-planner`
2. Daten laden automatisch (`planningData$`)
3. User wählt Produkte und gibt Mengen ein (Step 2 Formular)
4. User klickt "Plan berechnen"
5. Engine berechnet:
   - Globalen Bedarf
   - Vorgeschlagene Bestellungen
   - Transfers
   - Workshop-Coverage
6. Ergebnisse erscheinen in 3 Tabs (vorher: No-Result-Hint)
7. User kann zwischen Tabs wechseln und Ergebnisse ansehen

---

## 🔜 Next Steps (Step 5)

**Ziel:** Aktionen für Bestellungen und Transfers

### Geplante Features

1. **Tab 1 — Bestellvorschläge:**
   - Zeige Bestellvorschläge als ActionItems
   - Button: "Bestellung erstellen" → leitet zu Order-Create Seite
   - Pre-fill Material + Menge

2. **Tab 2 — Transfer-ToDos:**
   - Transfer-Vorschläge als ActionItems
   - Button: "Transfer anlegen" → leitet zu Transfer-Create Seite
   - Pre-fill: From/To Workshop, Material, Menge

3. **Backend Integration (später):**
   - `openOrdersByMaterialId` aus `/api/orders/` + `/api/deliveries/`
   - Echte Bestell- und Transfer-Workflows

---

## 📊 Technische Details

### Pure TypeScript Engine
- Keine Angular Dependencies
- Deterministisch (gleiche Inputs → gleiche Outputs)
- Testbar isoliert
- Import: `import { planGlobalMaterials } from '../engine/material-planning.engine'`

### ViewModels
- Tab-Components nutzen ViewModels für optimale Darstellung
- Gruppierung nach Material
- Denormalisierung für Template-Performance

### Change Detection
- `OnChanges` lifecycle hook für Tabs
- Automatisches Neuberechnen bei Input-Änderungen

### Material Design
- mat-table für alle Tabellen
- mat-button für Actions
- mat-card für Layout
- mat-tabs für Navigation

---

## 🐛 Known Issues & Limitations

### 1. Workshop-Limit (2)
**Issue:** Nur 2 Werkstätten unterstützt  
**Grund:** Step 3 Engine-Logik  
**Fix:** Step 6+ (erweiterbar auf N Workshops)

### 2. Offene Bestellungen fehlen
**Issue:** `openOrdersByMaterialId` ist leer  
**Grund:** Backend-Integration fehlt noch  
**Fix:** Später — Fetch aus `/api/orders/` + `/api/deliveries/`

### 3. Keine Backend-Actions
**Issue:** Bestellung/Transfer nur anzeigen, nicht anlegen  
**Grund:** Scope Step 4 (nur Rendern)  
**Fix:** Step 5 — Action-Buttons mit Navigation

---

## ✅ Acceptance Criteria — Erfüllt

- [x] `ng test --include='**/material-planning/**/*.spec.ts'` läuft grün (61/61)
- [x] `/material-planner` Route funktioniert
- [x] Produkte auswählbar (Step 2)
- [x] Targets eingeben möglich
- [x] Button "Plan berechnen" vorhanden und funktional
- [x] Tab 1: Globaler Bedarf & Bestellungen (kein Platzhalter)
- [x] Tab 2: Transferplan (kein Platzhalter)
- [x] Tab 3: Deckung pro Werkstatt (kein Platzhalter)
- [x] Keine neuen Backend-Endpunkte erfunden
- [x] Error-Handling bei ungültiger Workshop-Anzahl
- [x] No-Result-Hint wenn kein Plan berechnet

---

## 📝 Changelog

### Added
- `GlobalDemandOrdersTabComponent` mit mat-table
- `TransferPlanTabComponent` mit dynamischen Workshop-Spalten
- `WorkshopCoverageTabComponent` mit Material-Gruppierung
- `calculatePlan()` Methode in `MaterialPlannerPageComponent`
- Error-Handling und Error-Display
- Calculate-Button mit disabled state
- No-Result-Hint für leere Ergebnisse
- ViewModels für Tab-Components
- 20+ neue Tests

### Changed
- `MaterialPlannerPageComponent` Template: Tabs nutzen neue Components
- `MaterialPlannerPageComponent` SCSS: Styling für Button und Error
- Tab placeholders entfernt

---

## 🎯 Zusammenfassung

**Step 4 ist vollständig abgeschlossen.** Die drei Tab-Komponenten rendern die Engine-Ergebnisse korrekt, alle Tests laufen grün, und die UX ist sauber. Die nächsten Schritte (Step 5) werden Action-Buttons für Bestellungen und Transfers hinzufügen.

---

**Autor:** GitHub Copilot  
**Review:** Ready for Step 5
