# Import/Export UI - Benutzeranleitung

## Zugriff

1. Öffne die Anwendung im Browser
2. Navigiere zu **Settings** (Einstellungen)
3. Wähle den Tab **Import/Export**

## Lieferanten exportieren

1. Klicke auf **"Exportieren"** im Lieferanten-Bereich
2. Eine JSON-Datei wird automatisch heruntergeladen (z.B. `suppliers_export_2025-11-27.json`)
3. Die Datei enthält alle Lieferanten mit allen Feldern

## Lieferanten importieren

1. Klicke auf **"Importieren"** im Lieferanten-Bereich
2. Wähle eine JSON-Datei aus (muss dem Export-Format entsprechen)
3. Die Datei wird hochgeladen und verarbeitet
4. Eine Erfolgsmeldung zeigt die Anzahl der importierten Lieferanten
5. Die Import-Ergebnisse werden unten angezeigt mit Details zu jedem Eintrag:
   - ✓ Created: Neuer Lieferant wurde angelegt
   - ✓ Updated: Bestehender Lieferant wurde aktualisiert
   - ⚠️ Skipped: Eintrag wurde übersprungen (z.B. fehlende Daten)

## Bestellungen exportieren

1. Klicke auf **"Exportieren"** im Bestellungen-Bereich
2. Eine JSON-Datei wird automatisch heruntergeladen (z.B. `orders_export_2025-11-27.json`)
3. Die Datei enthält alle Bestellungen mit allen Positionen

## Bestellungen importieren

1. **WICHTIG:** Stelle sicher, dass alle Lieferanten bereits importiert sind!
2. **WICHTIG:** Prüfe, dass alle Material-IDs in der Zielumgebung existieren
3. Klicke auf **"Importieren"** im Bestellungen-Bereich
4. Wähle eine JSON-Datei aus
5. Die Datei wird hochgeladen und verarbeitet
6. Eine Erfolgsmeldung zeigt die Anzahl der importierten Bestellungen
7. Die Import-Ergebnisse zeigen Details zu jeder Bestellung:
   - ✓ Created: Neue Bestellung wurde angelegt mit X Items
   - ⚠️ Skipped: Bestellung wurde übersprungen (z.B. Duplikat, fehlende Supplier-ID)

## Workflow: Test → Produktion

### Schritt 1: Export aus Test
1. Melde dich in der **Testumgebung** an
2. Gehe zu Settings → Import/Export
3. Exportiere **zuerst Lieferanten**, dann **Bestellungen**
4. Speichere beide JSON-Dateien auf deinem Computer

### Schritt 2: Optional - Dateien bearbeiten
- Öffne die JSON-Dateien mit einem Text-Editor (z.B. VS Code, Notepad++)
- Passe Material-IDs an, falls unterschiedlich in Produktion
- Passe Supplier-IDs an, falls unterschiedlich in Produktion
- Entferne Bestellungen, die du nicht importieren möchtest
- **Hinweis:** `material_bezeichnung` und `supplier_name` sind nur zur Info!

### Schritt 3: Import in Produktion
1. **BACKUP ERSTELLEN!** (siehe unten)
2. Melde dich in der **Produktionsumgebung** an
3. Gehe zu Settings → Import/Export
4. Importiere **zuerst Lieferanten**
5. Warte auf Erfolgsmeldung und prüfe die Import-Ergebnisse
6. Importiere **dann Bestellungen**
7. Prüfe die Import-Ergebnisse auf Warnungen

## Backup vor Import

**WICHTIG:** Erstelle immer ein Backup vor dem Import in Produktion!

```bash
cd /Users/Shared/dev/prodflux/scripts
./pull_prod_db.sh
```

## Fehlerbehandlung

### "Supplier ID X not found"
- **Problem:** Lieferant mit dieser ID existiert nicht
- **Lösung:** Lieferanten zuerst importieren oder ID in JSON anpassen

### "Material ID X not found"
- **Problem:** Material mit dieser ID existiert nicht in der Zielumgebung
- **Lösung:** 
  1. Material in Zielumgebung anlegen ODER
  2. ID in JSON-Datei anpassen

### "Order XXX already exists"
- **Problem:** Bestellung mit dieser order_number existiert bereits
- **Lösung:** 
  1. Duplikat aus JSON entfernen ODER
  2. order_number in JSON ändern ODER
  3. Warnung ignorieren (Bestellung wird übersprungen)

### "Ungültige JSON-Datei"
- **Problem:** Datei ist kein gültiges JSON
- **Lösung:** Datei mit JSON-Validator prüfen (z.B. jsonlint.com)

## Dateiformat

### Lieferanten (suppliers_export.json)
```json
{
  "count": 2,
  "suppliers": [
    {
      "name": "Lieferant GmbH",
      "url": "https://example.com",
      "kundenkonto": "K-12345",
      "notes": "Notizen",
      "is_active": true
    }
  ]
}
```

### Bestellungen (orders_export.json)
```json
{
  "count": 1,
  "orders": [
    {
      "order_number": "ORD-2025-001",
      "supplier_id": 1,
      "supplier_name": "Nur zur Info",
      "bestellt_am": "2025-01-15",
      "versandkosten": "9.99",
      "versandkosten_mwst_satz": "19.00",
      "notiz": "Bestellnotiz",
      "is_historical": false,
      "items": [
        {
          "material_id": 5,
          "material_bezeichnung": "Nur zur Info",
          "quantity": "10",
          "preis_pro_stueck": "2.50",
          "mwst_satz": "19.00",
          "artikelnummer": "ART-123"
        }
      ]
    }
  ]
}
```

## Tipps

### 1. Schrittweise importieren
- Importiere nicht alle Daten auf einmal
- Teste mit wenigen Einträgen zuerst
- Prüfe die Import-Ergebnisse genau

### 2. Material-IDs abgleichen
Erstelle eine Mapping-Tabelle:
```
Test-ID → Prod-ID
5       → 3
12      → 8
...
```
Und ersetze die IDs in der JSON-Datei vor dem Import.

### 3. Progress verfolgen
- Die UI zeigt einen Progress-Bar während des Imports
- Detaillierte Meldungen erscheinen nach dem Import
- Grüne Häkchen = Erfolg
- Oranges Warnsymbol = Übersprungen

### 4. Browser-Console nutzen
Bei Problemen öffne die Browser-Entwicklertools (F12) und schaue in die Console für detaillierte Fehlermeldungen.

## Weitere Dokumentation

Für technische Details siehe:
- `IMPORT_EXPORT.md` - Backend API Dokumentation
- `api-test-import-export.http` - API Test-Beispiele
