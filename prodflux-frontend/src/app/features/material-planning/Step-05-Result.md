# Step 05 — MaterialPlanner Actions + Transfer-ToDos (Phase 1) — RESULT

**Status:** ✅ Complete  
**Date:** 26. November 2025

## Zusammenfassung

Step 5 ist erfolgreich abgeschlossen. Der kritische Bugfix für "Zeile hinzufügen" wurde implementiert, Bestellvorschläge können angezeigt werden, und Transfer-ToDos sind vollständig funktional (Frontend-State). Alle 69 Tests laufen grün.

---

## ✅ 0) Bugfix: "Zeile hinzufügen" Button

### Problem (Root Cause)
Der Button "Zeile hinzufügen" hatte **kein `type="button"` Attribut**. In einem Form-Kontext wird ein Button ohne explizites `type` als `type="submit"` behandelt, was zu einem unerwünschten Form-Submit führte.

### Lösung
```html
<button mat-raised-button color="primary" type="button" (click)="addTarget()">
  <mat-icon>add</mat-icon>
  Zeile hinzufügen
</button>
```

### UX-Verbesserung
Zusätzlich wird jetzt **eine initiale Zeile automatisch hinzugefügt** beim Laden der Komponente (Quality-of-life):

```typescript
ngOnInit(): void {
  // ... existing code ...
  
  // Add initial row for better UX
  if (this.targets.length === 0) {
    this.addTarget();
  }
}
```

### Tests
- ✅ Button hat `type="button"` (verhindert Form-Submit)
- ✅ Klick auf Button erzeugt neue Zeile im FormArray
- ✅ Initiale Zeile wird automatisch hinzugefügt

---

## ✅ 1) Feature: Bestellvorschläge anzeigen (Tab 1)

### Implementierung
In `GlobalDemandOrdersTabComponent`:

**State:**
```typescript
showOrderProposal = false;
```

**Getter:**
```typescript
get ordersToPlace(): GlobalMaterialRow[] {
  return this.rows.filter(row => row.suggestedOrderToCentral > 0);
}
```

**Toggle-Methode:**
```typescript
toggleOrderProposal(): void {
  this.showOrderProposal = !this.showOrderProposal;
}
```

### UI-Elemente

**Button:**
- "Bestellungsvorschlag anzeigen" / "Bestellungsvorschlag ausblenden"
- Nur sichtbar wenn `ordersToPlace.length > 0`
- Toggle-Funktionalität

**Anzeige (wenn `showOrderProposal = true`):**
- Überschrift: "Bestellungsvorschlag (nach Rauen)"
- Mat-Table mit 3 Spalten:
  - Material (Name + Bestellnummer)
  - Menge (suggestedOrderToCentral)
  - Preis/Einheit: `1.00 € (Backend TODO)` — Placeholder

**Backend TODO Box:**
```
Backend TODO: Preis/Preis_pro_stueck ist noch nicht im Planning-Flow integriert.
Später: POST /api/orders/ mit OrderRequest (workshop = Rauen, items[] …).
```

### Tests
- ✅ Toggle-Funktion ändert `showOrderProposal`
- ✅ `ordersToPlace` filtert korrekt (nur shortage > 0)
- ✅ Button erscheint nur wenn Bestellungen vorhanden

---

## ✅ 2) Feature: Transfer-ToDos (Tab 2 + Übersicht)

### 2.1 TransferTodo Model

**Datei:** `models/todos/transfer-todo.ts`

```typescript
export interface TransferTodo {
  id: string; // UUID via crypto.randomUUID()
  materialId: number;
  materialName: string;
  fromWorkshopId: number;
  fromWorkshopName: string;
  toWorkshopId: number;
  toWorkshopName: string;
  quantity: number;
  done: boolean;
}
```

**UUID Generation:**
```typescript
export function generateTodoId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older browsers/tests
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

### 2.2 TransferPlanTabComponent

**Neues Output:**
```typescript
@Output() adoptTodos = new EventEmitter<void>();
```

**Button im Template:**
```html
@if (transfers.length > 0) {
  <div class="action-section">
    <button mat-raised-button color="accent" type="button" (click)="onAdoptTodos()">
      Transfer-ToDos übernehmen
    </button>
    <p class="action-hint">Übernimmt die Transfervorschläge in die ToDo-Liste</p>
  </div>
}
```

### 2.3 MaterialPlannerPageComponent

**State:**
```typescript
transferTodos: TransferTodo[] = [];
todosDisplayedColumns: string[] = ['material', 'fromTo', 'quantity', 'done', 'actions'];
```

**adoptTransferTodos() Methode:**
- Konvertiert `planningResult.transferSuggestions` zu `TransferTodo`
- Denormalisiert Material- und Workshop-Namen via Lookups
- **Deduplizierung:** Verhindert Duplikate (gleiche Kombination von materialId, from, to)
  - Bei Duplikat: Aktualisiert nur `quantity`
- Setzt `done = false` für neue ToDos

**toggleTodoDone() Methode:**
```typescript
toggleTodoDone(todoId: string): void {
  const todo = this.transferTodos.find(t => t.id === todoId);
  if (todo) {
    todo.done = !todo.done;
  }
}
```

**deleteTodo() Methode:**
```typescript
deleteTodo(todoId: string): void {
  this.transferTodos = this.transferTodos.filter(t => t.id !== todoId);
}
```

### 2.4 Transfer-Übersicht (ToDos)

**Position:** Unterhalb der Tabs (nur sichtbar wenn `transferTodos.length > 0`)

**Mat-Card mit Mat-Table:**
- **Spalten:**
  1. Material (materialName)
  2. Von → Nach (fromWorkshopName → toWorkshopName)
  3. Menge (quantity mit DecimalPipe)
  4. Erledigt (Checkbox mit ngModel)
  5. Aktionen (Löschen-Button)

**Styling:**
- Erledigte Zeilen: `opacity: 0.6` + `text-decoration: line-through`
- Löschen-Button: Rot (warn color)

**Backend TODO Box:**
```
Backend TODO: Langfristig: POST /api/transfers/ (wenn im Backend existiert) 
oder Movement-Endpunkte. In Step 5: keine Persistenz, nur Frontend-State.
```

### Tests
- ✅ adoptTodos emittiert Event
- ✅ adoptTransferTodos() erzeugt ToDos
- ✅ toggleTodoDone() ändert done-State
- ✅ deleteTodo() entfernt ToDo
- ✅ Keine Duplikate bei wiederholtem Adopt (quantity wird aktualisiert)

---

## 🧪 Tests

### Status
✅ **69 von 69 Tests erfolgreich** (+8 neue Tests gegenüber Step 4)

### Test-Command
```bash
npm test -- --include='**/material-planning/**/*.spec.ts' --no-watch --browsers=ChromeHeadless
```

### Neue Tests (Step 5)

#### MaterialPlannerTargetsFormComponent (3 neue)
- ✅ Initial row added on ngOnInit
- ✅ Button has type="button" to prevent form submit
- ✅ Add row increments FormArray correctly

#### GlobalDemandOrdersTabComponent (2 neue)
- ✅ toggleOrderProposal() toggles visibility
- ✅ ordersToPlace filters correctly (suggestedOrderToCentral > 0)

#### TransferPlanTabComponent (1 neu)
- ✅ onAdoptTodos() emits adoptTodos event

#### MaterialPlannerPageComponent (5 neue)
- ✅ adoptTransferTodos() creates transfer todos
- ✅ toggleTodoDone() changes done state
- ✅ deleteTodo() removes todo
- ✅ No duplicate todos when adopting twice (quantity updated)
- ✅ Transfer todos have correct material and workshop names

---

## 📁 Geänderte/Neue Dateien

### Neue Dateien
```
models/todos/
└── transfer-todo.ts (NEW)
```

### Geänderte Dateien
```
material-planner-targets-form/
├── material-planner-targets-form.component.html (type="button" fix)
├── material-planner-targets-form.component.ts (initial row)
└── material-planner-targets-form.component.spec.ts (tests)

components/global-demand-orders-tab/
├── global-demand-orders-tab.component.ts (showOrderProposal, toggle)
├── global-demand-orders-tab.component.html (order proposal section)
├── global-demand-orders-tab.component.scss (styling)
└── global-demand-orders-tab.component.spec.ts (tests)

components/transfer-plan-tab/
├── transfer-plan-tab.component.ts (@Output adoptTodos)
├── transfer-plan-tab.component.html (adopt button)
├── transfer-plan-tab.component.scss (action section)
└── transfer-plan-tab.component.spec.ts (tests)

material-planner-page/
├── material-planner-page.component.ts (transferTodos, methods)
├── material-planner-page.component.html (todos overview)
├── material-planner-page.component.scss (todos styling)
└── material-planner-page.component.spec.ts (tests)
```

---

## ⚠️ Backend TODOs (klar markiert in UI)

### 1. Bestellungen (Tab 1)
**Aktuell:** Placeholder `1.00 € (Backend TODO)`  
**Zukünftig:**
- Material-Preise aus Backend laden
- POST `/api/orders/` für Bestellungen
- OrderRequest: `{ workshop: 2 (Rauen), items: [...] }`

### 2. Transfers (ToDo-Übersicht)
**Aktuell:** Nur Frontend-State (kein POST)  
**Zukünftig:**
- POST `/api/transfers/` (wenn Endpunkt existiert)
- Oder: POST `/api/material-movements/` mit `change_type: 'transfer'`
- Persistierung der ToDo-Listen

### 3. Offene Bestellungen
**Aktuell:** `openOrdersByMaterialId: {}` (leer)  
**Zukünftig:**
- Automatisches Laden aus `/api/orders/` + `/api/deliveries/`
- Berücksichtigung im Planning-Flow

---

## 🎨 Styling & UX

### Bestellvorschlag-Sektion
- Grauer Hintergrund (`#f5f5f5`)
- Toggle-Button (Accent Color)
- Gelbe Backend-TODO-Box (`#fff3cd` mit Border)

### Transfer-Übersicht
- Mat-Table mit hover effects
- Erledigte Zeilen: durchgestrichen + halbtransparent
- Checkbox für "Erledigt"
- Löschen-Button (icon, warn color)

### Action Section (Tab 2)
- Grauer Hintergrund
- Button mit Hint-Text darunter
- Nur sichtbar wenn Transfers vorhanden

---

## 🔄 User Workflow (End-to-End)

1. **Produktziele erfassen:**
   - Initiale Zeile bereits vorhanden
   - "Zeile hinzufügen" funktioniert korrekt

2. **Plan berechnen:**
   - Klick auf "Plan berechnen"
   - Ergebnisse in 3 Tabs

3. **Bestellvorschlag ansehen (Tab 1):**
   - Klick auf "Bestellungsvorschlag anzeigen"
   - Liste mit allen zu bestellenden Materialien
   - Hinweis auf Backend TODO (Preise)

4. **Transfer-ToDos übernehmen (Tab 2):**
   - Klick auf "Transfer-ToDos übernehmen"
   - ToDos erscheinen unten auf der Seite

5. **ToDos verwalten (Übersicht):**
   - Checkbox für "Erledigt"
   - Löschen-Button
   - Visuelle Kennzeichnung erledigter Transfers

---

## 🐛 Bekannte Einschränkungen

### 1. Keine Backend-Persistenz
**Issue:** Transfer-ToDos werden nicht gespeichert  
**Grund:** Scope Step 5 (Frontend-only)  
**Fix:** Step 6+ — Backend-Integration

### 2. Preise fehlen
**Issue:** Bestellvorschlag zeigt Placeholder-Preis  
**Grund:** Material-Preise noch nicht im Planning-Flow  
**Fix:** Backend-Integration + Material-Erweiterung

### 3. ToDos gehen bei Reload verloren
**Issue:** Browser-Reload löscht alle ToDos  
**Grund:** Kein LocalStorage/Backend  
**Fix:** Optional LocalStorage (Step 6) oder Backend

---

## ✅ Acceptance Criteria — Erfüllt

- [x] "Zeile hinzufügen" funktioniert (manuell verifiziert + Test)
- [x] `type="button"` verhindert unerwünschten Form-Submit
- [x] Initiale Zeile automatisch hinzugefügt (UX)
- [x] Tab 1: Bestellvorschlag anzeigen (Toggle)
- [x] Tab 2: Transfer-ToDos übernehmen (Button + Event)
- [x] Transfer-Übersicht unten mit mat-table
- [x] Checkbox "Erledigt" funktioniert
- [x] Löschen-Button funktioniert
- [x] Keine Duplikate bei wiederholtem Adopt
- [x] Backend TODOs klar markiert in UI
- [x] `npm test --include='**/material-planning/**/*.spec.ts' --no-watch --browsers=ChromeHeadless` läuft grün (69/69)
- [x] Keine neuen Backend-Endpunkte erfunden

---

## 📝 Changelog

### Added
- `TransferTodo` Interface mit generateTodoId() Utility
- `showOrderProposal` Toggle in GlobalDemandOrdersTabComponent
- `ordersToPlace` Getter (filtert Materialien mit Bestellung)
- Bestellvorschlag-Anzeige in Tab 1 (mat-table)
- `adoptTodos` Output in TransferPlanTabComponent
- "Transfer-ToDos übernehmen" Button in Tab 2
- `transferTodos` State in MaterialPlannerPageComponent
- `adoptTransferTodos()` Methode mit Deduplizierung
- `toggleTodoDone()` Methode
- `deleteTodo()` Methode
- Transfer-Übersicht mat-table unter Tabs
- Backend-TODO-Hinweise in UI (gelbe Boxen)
- 8 neue Tests (Total: 69)

### Fixed
- ✅ **BUGFIX:** "Zeile hinzufügen" Button hat jetzt `type="button"`
- ✅ **UX:** Initiale Zeile automatisch hinzugefügt

### Changed
- MaterialPlannerTargetsFormComponent: Initial row on ngOnInit
- GlobalDemandOrdersTabComponent: Erweitert um Order Proposal Section
- TransferPlanTabComponent: Erweitert um Action Section
- MaterialPlannerPageComponent: Erweitert um ToDo-Management

---

## 🔜 Nächste Schritte (Step 6+)

### Mögliche Features
1. **LocalStorage für ToDos** (optional)
   - Überleben Browser-Reload
   - Einfache Implementierung

2. **Backend-Integration:**
   - POST `/api/orders/` für Bestellungen
   - POST `/api/transfers/` für Transfers
   - GET `/api/orders/` für offene Bestellungen

3. **Material-Preise:**
   - Material-Model erweitern (price_per_unit)
   - Integration in Planning-Flow
   - Kostenrechnung

4. **Navigation:**
   - Von Bestellvorschlag zu Order-Create-Page
   - Von ToDos zu Transfer-Create-Page
   - Pre-fill Formulare

5. **Multi-Workshop Support (N > 2):**
   - Engine erweitern
   - UI dynamisch anpassen

---

## 🎯 Zusammenfassung

**Step 5 ist vollständig abgeschlossen.** Der kritische Bugfix für "Zeile hinzufügen" wurde erfolgreich implementiert und getestet. Bestellvorschläge können angezeigt werden, Transfer-ToDos funktionieren vollständig (Frontend-State), und alle 69 Tests laufen grün. Die Implementierung ist bereit für Backend-Integration in späteren Steps.

---

**Autor:** GitHub Copilot  
**Review:** Ready for Step 6
