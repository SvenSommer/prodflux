# Material-Lieferanten-Preise Feature

## Übersicht

Dieses Feature ermöglicht die Verwaltung von Materialpreisen pro Lieferant. Es kombiniert automatisch erfasste Preise aus Bestellungen mit manuell gepflegten Preisen.

## Backend-Komponenten

### Neues Model: `MaterialSupplierPrice`

**Datei:** `materials/models.py`

```python
class MaterialSupplierPrice(models.Model):
    material = ForeignKey(Material)
    supplier = ForeignKey(Supplier)
    price = DecimalField  # Netto-Preis pro Einheit
    valid_from = DateField  # Gültigkeitsdatum
    note = TextField  # Optionale Notizen
```

**Features:**
- Eindeutige Kombination aus Material, Supplier und valid_from
- Sortierung nach Gültigkeitsdatum (neueste zuerst)
- Admin-Interface zur Verwaltung

### API-Endpoints

#### 1. Preisübersicht für ein Material
```
GET /api/materials/{material_id}/supplier-prices/
```

**Response:**
```json
[
  {
    "supplier_id": 1,
    "supplier_name": "Lieferant A",
    "manual_price": 12.50,
    "manual_price_valid_from": "2025-11-27",
    "manual_price_note": "Mindestbestellmenge: 10 Stück",
    "last_order_price": 12.00,
    "last_order_price_with_shipping": 12.30,
    "last_order_date": "2025-11-15",
    "last_order_number": "ORD-2025-001"
  }
]
```

**Funktionalität:**
- Kombiniert manuelle Preise und Bestellpreise
- Zeigt für jeden Lieferanten:
  - Letzten manuell gepflegten Preis (wenn vorhanden)
  - Letzten Preis aus einer Bestellung (wenn vorhanden)
  - Versandkosten-berechneten Preis

#### 2. Manuelle Preispflege
```
POST /api/material-supplier-prices/
GET /api/material-supplier-prices/
PATCH /api/material-supplier-prices/{id}/
DELETE /api/material-supplier-prices/{id}/
```

**Verwendung:**
- Preise manuell erfassen, bevor eine Bestellung getätigt wurde
- Aktuelle Listenpreise pflegen
- Preishistorie aufbauen

### Serializers

1. **MaterialSupplierPriceSerializer:** CRUD-Operationen für manuelle Preise
2. **MaterialSupplierPriceOverviewSerializer:** Kombinierte Ansicht aus manuellen und Bestellpreisen

## Frontend-Komponenten

### Material-Detail-Seite Erweiterung

**Datei:** `material-detail.component.ts/html/scss`

**Neue Features:**
1. **Preisübersicht-Sektion:**
   - Zeigt alle Lieferanten mit ihren Preisen
   - Unterscheidet zwischen manuellen und Bestellpreisen
   - Farbcodierung: Grün für manuelle, Blau für Bestellpreise

2. **Preispflege-Dialog:**
   - Lieferant auswählen
   - Preis eingeben (netto)
   - Gültigkeitsdatum festlegen
   - Optionale Notizen (z.B. Mindestbestellmenge)

### Service-Erweiterungen

**Datei:** `materials.service.ts`

**Neue Methoden:**
```typescript
getMaterialSupplierPricesOverview(materialId: number)
createMaterialSupplierPrice(data: CreateMaterialSupplierPrice)
updateMaterialSupplierPrice(id: number, data: Partial<CreateMaterialSupplierPrice>)
deleteMaterialSupplierPrice(id: number)
```

## Verwendung

### Szenario 1: Material ohne Bestellung
1. Material-Detailseite öffnen
2. "Preis hinzufügen" klicken
3. Lieferant, Preis und Gültigkeitsdatum eingeben
4. Optional: Notiz hinzufügen (z.B. "Ab 100 Stück: 10% Rabatt")

### Szenario 2: Material mit Bestellungen
- System zeigt automatisch den letzten Bestellpreis an
- Zusätzlich kann ein manueller Preis gepflegt werden
- Beide Preise werden nebeneinander angezeigt

### Szenario 3: Mehrere Lieferanten
- Jeder Lieferant wird separat aufgelistet
- Für jeden Lieferanten werden manuelle und Bestellpreise angezeigt
- Schneller Preisvergleich möglich

## Datenfluss

1. **Automatische Erfassung:**
   - Bei Bestellung → OrderItem speichert Preis
   - Material wird automatisch mit Supplier verknüpft
   - Letzter Bestellpreis wird über API abgerufen

2. **Manuelle Pflege:**
   - Über Dialog → MaterialSupplierPrice erstellen
   - Preishistorie durch mehrere Einträge mit unterschiedlichen valid_from-Daten
   - Neuester Preis wird in Übersicht angezeigt

## Vorteile

1. **Preistransparenz:**
   - Alle Preise auf einen Blick
   - Vergleich zwischen verschiedenen Lieferanten
   - Nachvollziehbare Preisentwicklung

2. **Flexibilität:**
   - Manuelle Pflege für neue Lieferanten
   - Automatische Erfassung aus Bestellungen
   - Kombination beider Ansätze

3. **Planung:**
   - Aktuelle Listenpreise verfügbar
   - Historische Preise nachvollziehbar
   - Basis für Kostenkalkulation

## Migration

Die Migration `0022_materialsupplierprice.py` erstellt:
- Neue Tabelle `materials_materialsupplierprice`
- Unique Constraint auf (material, supplier, valid_from)
- Indizes für schnelle Abfragen

## Testing

Verwenden Sie `api-test-material-supplier-prices.http` für API-Tests:
- Preisübersicht abrufen
- Manuelle Preise erstellen/bearbeiten/löschen
- Filter nach Material oder Supplier

## Zukünftige Erweiterungen

Mögliche Verbesserungen:
1. Preiswarnungen bei starken Abweichungen
2. Automatische Preisvorschläge basierend auf Historie
3. Staffelpreise (Mengenrabatte)
4. Import von Lieferanten-Preislisten
5. Preisvergleichs-Dashboard
