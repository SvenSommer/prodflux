# Material Supplier Prices Import/Export

## Übersicht

Die Import/Export-Funktionalität für Material-Lieferanten-Preise ermöglicht den Massen-Export und -Import von manuell gepflegten Preisen im JSON-Format.

## Features

- **Export** von Preisen mit optionaler Filterung nach Material oder Lieferant
- **Import** mit automatischer Deduplizierung (basierend auf Material + Lieferant + Gültig-ab-Datum)
- **Update-Logik**: Existierende Preise werden aktualisiert, neue werden erstellt
- **Validierung**: Prüfung auf existierende Materialien und Lieferanten
- **Detaillierte Meldungen**: Jede Import-Aktion wird protokolliert

## API Endpoints

### Export

```http
GET /api/material-supplier-prices/export/
```

**Query Parameter (optional):**
- `material_id`: Filter nach Material-ID
- `supplier_id`: Filter nach Lieferanten-ID

**Response Format:**
```json
{
  "count": 2,
  "prices": [
    {
      "material_id": 1,
      "material_bezeichnung": "Holz Buche 20x20mm",
      "supplier_id": 3,
      "supplier_name": "Holz-Meier GmbH",
      "price": "15.99",
      "valid_from": "2024-01-01",
      "note": "Großhandel Preis 2024"
    },
    {
      "material_id": 2,
      "material_bezeichnung": "Lack matt transparent",
      "supplier_id": 3,
      "supplier_name": "Holz-Meier GmbH",
      "price": "8.50",
      "valid_from": "2024-01-15",
      "note": "Aktionspreis"
    }
  ]
}
```

### Import

```http
POST /api/material-supplier-prices/import/
Content-Type: application/json
```

**Request Body:**
```json
{
  "prices": [
    {
      "material_id": 1,
      "supplier_id": 3,
      "price": "15.99",
      "valid_from": "2024-01-01",
      "note": "Großhandel Preis 2024"
    }
  ]
}
```

**Response Format:**
```json
{
  "success": true,
  "created_count": 1,
  "messages": [
    "✓ Created: Holz Buche 20x20mm - Holz-Meier GmbH (2024-01-01)"
  ]
}
```

## Workflow-Beispiel

### 1. Preise exportieren
```bash
curl -X GET "http://localhost:8000/api/material-supplier-prices/export/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. JSON-Datei bearbeiten
- Preise anpassen
- Neue Einträge hinzufügen
- Notizen ergänzen

### 3. Preise importieren
```bash
curl -X POST "http://localhost:8000/api/material-supplier-prices/import/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @modified_prices.json
```

## Deduplizierungs-Logik

Ein Preis ist **eindeutig** durch die Kombination:
- `material_id`
- `supplier_id`
- `valid_from`

Beim Import:
- Wenn die Kombination **existiert** → Preis und Notiz werden **aktualisiert**
- Wenn die Kombination **nicht existiert** → Neuer Preis wird **erstellt**

## Validierung

### Beim Import werden geprüft:

1. **Material existiert** (`material_id`)
   - ⚠️ Skipped: Material ID {id} not found

2. **Lieferant existiert** (`supplier_id`)
   - ⚠️ Skipped: Supplier ID {id} not found

3. **Datum-Format** (`valid_from`)
   - Format: ISO 8601 Date (YYYY-MM-DD)
   - ⚠️ Skipped: Invalid date format

4. **Preis-Format** (`price`)
   - Decimal-Wert, z.B. "15.99"
   - ⚠️ Skipped: Invalid price format

## Fehlermeldungen

### Erfolgreiche Operationen:
- `✓ Created: {material} - {supplier} ({date})`
- `✓ Updated: {material} - {supplier} ({date})`

### Übersprungene Einträge:
- `⚠️ Skipped: Price without material_id`
- `⚠️ Skipped: Material ID {id} not found`
- `⚠️ Skipped: Price for {material} without supplier_id`
- `⚠️ Skipped: Price for {material} - Supplier ID {id} not found`
- `⚠️ Skipped: Price for {material} from {supplier} - Invalid date format`
- `⚠️ Skipped: Price for {material} from {supplier} - Invalid price format`

## Unterschied zu Bestellpreisen

**Manuelle Preise** (MaterialSupplierPrice):
- Werden händisch gepflegt
- Import/Export möglich
- Frei definierbar

**Bestellpreise** (OrderItem):
- Entstehen automatisch aus Bestellungen
- Nicht direkt importierbar
- Importierbar über Order-Import

## Best Practices

### Vor dem Import
1. **Backup erstellen**: Exportiere aktuelle Preise als Backup
2. **IDs prüfen**: Stelle sicher, dass `material_id` und `supplier_id` existieren
3. **Datum-Format**: Verwende immer ISO 8601 (YYYY-MM-DD)

### Beim Export
1. **Filtern**: Nutze Query-Parameter für gezielte Exports
2. **Referenzfelder**: `material_bezeichnung` und `supplier_name` dienen nur zur Orientierung
3. **Nur IDs importieren**: Beim Re-Import werden nur die `_id` Felder verwendet

### Bei der Bearbeitung
1. **Versionierung**: Neue Preise mit neuem `valid_from` Datum erstellen
2. **Notizen**: Dokumentiere Preisänderungen im `note` Feld
3. **Historische Preise**: Alte Preise nicht löschen, neue mit späterem Datum hinzufügen

## Beispiel-Workflow: Preiserhöhung

```bash
# 1. Aktuelle Preise für Material ID 5 exportieren
GET /api/material-supplier-prices/export/?material_id=5

# 2. JSON lokal speichern und bearbeiten
# - Neues valid_from Datum setzen (z.B. 2024-06-01)
# - Preis anpassen
# - Notiz hinzufügen: "Preiserhöhung Juni 2024"

# 3. Angepasste Preise importieren
POST /api/material-supplier-prices/import/
{
  "prices": [
    {
      "material_id": 5,
      "supplier_id": 3,
      "price": "18.99",
      "valid_from": "2024-06-01",
      "note": "Preiserhöhung Juni 2024"
    }
  ]
}
```

## Integration mit anderen Features

### Zusammenspiel mit Material Supplier Prices Übersicht
Die Übersicht (`/api/materials/{id}/supplier-prices/`) zeigt:
- Manuelle Preise (importiert über diese API)
- Letzte Bestellpreise (aus OrderItems)

### Zusammenspiel mit Order Import
1. **Lieferanten importieren** (via Supplier Import)
2. **Bestellungen importieren** (via Order Import) → Bestellpreise entstehen automatisch
3. **Manuelle Preise importieren** (via Material Supplier Price Import)

## Technische Details

### Implementierung
- **Backend**: `materials/import_export.py` - `MaterialSupplierPriceImportExport` Klasse
- **Views**: `materials/views.py` - `export_material_supplier_prices`, `import_material_supplier_prices`
- **URLs**: `/api/material-supplier-prices/export/`, `/api/material-supplier-prices/import/`

### Datenbank-Constraint
```python
class Meta:
    unique_together = [['material', 'supplier', 'valid_from']]
```

Dies garantiert die Deduplizierung auf Datenbankebene.

## API Test Datei

Siehe: `api-test-material-supplier-prices-import-export.http`
