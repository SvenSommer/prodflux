# Export/Import Dokumentation

## Überblick

Das System bietet Export/Import-Funktionalität für **Lieferanten** und **Bestellungen** im JSON-Format. Dies ermöglicht den einfachen Transfer von Testdaten in die Produktionsumgebung.

## Features

### ✅ Deduplizierung
- **Lieferanten**: Prüfung auf `name` - bestehende werden aktualisiert, neue erstellt
- **Bestellungen**: Prüfung auf `order_number` - Duplikate werden übersprungen

### ✅ JSON-Format
- Menschenlesbar und einfach editierbar
- Strukturiert mit allen notwendigen Feldern
- Referenzfelder (z.B. `material_bezeichnung`) zur besseren Lesbarkeit

### ✅ Fehlerbehandlung
- Validierung von Supplier-IDs und Material-IDs
- Detaillierte Fehlermeldungen
- Transaction-basiert (alles oder nichts pro Import)
- Übersichtliche Status-Meldungen für jeden Import

## API Endpoints

### Lieferanten

#### Export
```http
GET /api/suppliers/export/
```
**Optional Query Parameter:**
- `is_active=true/false` - Nur aktive/inaktive Lieferanten

**Response:**
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

#### Import
```http
POST /api/suppliers/import/
Content-Type: application/json

{
  "suppliers": [...]
}
```

**Response:**
```json
{
  "success": true,
  "created_count": 2,
  "messages": [
    "✓ Created: Lieferant GmbH",
    "✓ Updated: Existing Supplier"
  ]
}
```

### Bestellungen

#### Export
```http
GET /api/orders/export/
```
**Optional Query Parameter:**
- `supplier_id=<id>` - Nur Bestellungen eines Lieferanten
- `is_historical=true/false` - Nur historische/aktuelle Bestellungen

**Response:**
```json
{
  "count": 1,
  "orders": [
    {
      "order_number": "ORD-2025-001",
      "supplier_id": 1,
      "supplier_name": "Lieferant GmbH",
      "bestellt_am": "2025-01-15",
      "versandkosten": "9.99",
      "versandkosten_mwst_satz": "19.00",
      "notiz": "Bestellnotiz",
      "is_historical": false,
      "items": [
        {
          "material_id": 5,
          "material_bezeichnung": "Material Name",
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

#### Import
```http
POST /api/orders/import/
Content-Type: application/json

{
  "orders": [...]
}
```

**Response:**
```json
{
  "success": true,
  "created_count": 1,
  "messages": [
    "✓ Created: Order ORD-2025-001 with 2 items",
    "⚠️  Skipped: Order ORD-2025-002 already exists"
  ]
}
```

## Workflow: Test → Produktion

### Schritt 1: Export aus Testumgebung

```bash
# 1. Lieferanten exportieren
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://test.example.com/api/suppliers/export/ > suppliers.json

# 2. Bestellungen exportieren
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://test.example.com/api/orders/export/ > orders.json
```

### Schritt 2: JSON-Dateien bearbeiten (optional)

Du kannst die JSON-Dateien mit jedem Editor öffnen und:
- Material-IDs anpassen (falls unterschiedlich in Prod)
- Supplier-IDs anpassen (falls unterschiedlich in Prod)
- Unwichtige Bestellungen entfernen
- Daten korrigieren

**Wichtig:** Die Felder `material_bezeichnung` und `supplier_name` sind nur zur Information - sie werden beim Import ignoriert. Entscheidend sind die IDs!

### Schritt 3: Import in Produktivumgebung

```bash
# 1. ZUERST Lieferanten importieren
curl -X POST \
  -H "Authorization: Bearer YOUR_PROD_TOKEN" \
  -H "Content-Type: application/json" \
  -d @suppliers.json \
  http://prod.example.com/api/suppliers/import/

# 2. DANN Bestellungen importieren
curl -X POST \
  -H "Authorization: Bearer YOUR_PROD_TOKEN" \
  -H "Content-Type: application/json" \
  -d @orders.json \
  http://prod.example.com/api/orders/import/
```

## Wichtige Hinweise

### ⚠️ Reihenfolge beachten!
1. **Zuerst Lieferanten importieren** - Bestellungen benötigen gültige Supplier-IDs
2. **Dann Bestellungen importieren** - Benötigt gültige Material-IDs

### ⚠️ Material-IDs prüfen!
- Material-IDs müssen in der Zielumgebung existieren
- Falls unterschiedlich: JSON manuell anpassen
- Tipp: Exportiere vorher eine Material-Liste aus Prod zur Referenz

### ⚠️ Deduplizierung
- **Lieferanten** mit gleichem Namen werden **aktualisiert** (nicht doppelt angelegt)
- **Bestellungen** mit gleicher `order_number` werden **übersprungen**
- Bei Suppliers ohne Namen: Zeile wird übersprungen

### ⚠️ Fehlerbehandlung
- Ungültige Supplier-IDs → Bestellung wird übersprungen
- Ungültige Material-IDs → OrderItem wird übersprungen (Bestellung wird trotzdem angelegt)
- Ungültige Datumsformate → Bestellung wird übersprungen
- Jeder Fehler wird in den Messages ausgegeben

## Datenformat Details

### Lieferanten
```json
{
  "name": "Pflichtfeld - wird für Deduplizierung verwendet",
  "url": "Optional - URL des Lieferanten",
  "kundenkonto": "Optional - Kundennummer",
  "notes": "Optional - Notizen",
  "is_active": true
}
```

### Bestellungen
```json
{
  "order_number": "Eindeutig! Wird für Deduplizierung verwendet",
  "supplier_id": "Pflichtfeld - Muss in Zielumgebung existieren!",
  "supplier_name": "Nur Info - wird nicht importiert",
  "bestellt_am": "YYYY-MM-DD Format (ISO 8601)",
  "versandkosten": "Dezimalzahl als String oder null",
  "versandkosten_mwst_satz": "Dezimalzahl als String, default 19.00",
  "notiz": "Optional",
  "is_historical": false,
  "items": [
    {
      "material_id": "Pflichtfeld - Muss existieren!",
      "material_bezeichnung": "Nur Info - wird nicht importiert",
      "quantity": "Dezimalzahl als String",
      "preis_pro_stueck": "Dezimalzahl als String",
      "mwst_satz": "Dezimalzahl als String, default 19.00",
      "artikelnummer": "Optional - Artikelnummer des Lieferanten"
    }
  ]
}
```

## Beispiel-Workflow mit VS Code REST Client

Siehe `api-test-import-export.http` für vollständige Beispiele.

## Tipps & Tricks

### 1. Teilweise Imports
Du kannst die JSON-Dateien aufteilen und mehrfach importieren. Bereits existierende Einträge werden übersprungen.

### 2. Testlauf
Importiere zuerst in eine Test-Prod-Umgebung, um sicherzustellen, dass alle IDs korrekt sind.

### 3. Backup
Erstelle vor dem Import ein Backup der Produktions-Datenbank:
```bash
cd /Users/Shared/dev/prodflux/scripts
./pull_prod_db.sh
```

### 4. Material-ID Mapping
Falls Material-IDs unterschiedlich sind:
```bash
# Exportiere Material-Liste aus beiden Umgebungen
# Test
curl -H "Authorization: Bearer TEST_TOKEN" \
  http://test/api/materials/ > materials_test.json

# Prod  
curl -H "Authorization: Bearer PROD_TOKEN" \
  http://prod/api/materials/ > materials_prod.json

# Vergleiche und erstelle ein Mapping
# Ersetze IDs in orders.json manuell oder per Script
```

### 5. Bulk-Editing mit jq
```bash
# Beispiel: Alle Bestellungen als historical markieren
jq '.orders[].is_historical = true' orders.json > orders_historical.json

# Beispiel: Nur Bestellungen eines bestimmten Lieferanten
jq '.orders |= map(select(.supplier_id == 1))' orders.json > orders_supplier1.json
```

## Fehlersuche

### "Supplier ID X not found"
→ Lieferanten noch nicht importiert oder ID falsch
→ Lösung: Zuerst Suppliers importieren oder ID anpassen

### "Material ID X not found"  
→ Material existiert nicht in Zielumgebung
→ Lösung: Material anlegen oder ID in JSON anpassen

### "Order XXX already exists"
→ Bestellung mit dieser order_number existiert bereits
→ Lösung: Duplikat aus JSON entfernen oder order_number ändern

### "Invalid date format"
→ Datum nicht im Format YYYY-MM-DD
→ Lösung: Datumsformat korrigieren (ISO 8601)
