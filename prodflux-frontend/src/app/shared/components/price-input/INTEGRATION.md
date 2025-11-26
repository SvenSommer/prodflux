# Integration der PriceInputComponent in Order Form

## Beispiel-Integration

### Option 1: Einfache Verwendung (aktuell in Order Form)

Die bestehende Order Form verwendet einzelne Input-Felder. Hier ein Beispiel, wie die PriceInputComponent integriert werden kann:

```typescript
// order-form.component.ts
import { PriceInputComponent, PriceData } from '../../shared/components/price-input/price-input.component';

@Component({
  // ...
  imports: [
    // ... existing imports
    PriceInputComponent
  ]
})
export class OrderFormComponent {
  // Statt einzelner Werte:
  materialAssignments: Record<number, { 
    quantity: number; 
    price: PriceData;  // Statt preis: number
    quelle: string;
  }> = {};

  save(): void {
    const items: OrderItem[] = Object.entries(this.materialAssignments)
      .filter(([_, v]) => v.quantity > 0)
      .map(([materialId, v]) => ({
        material: +materialId,
        quantity: v.quantity,
        preis_pro_stueck: v.price.netto,
        mwst_satz: v.price.mwst_satz,
        quelle: v.quelle || ''
      }));
    
    // ... rest of save logic
  }
}
```

```html
<!-- order-form.component.html -->
<ng-template #customColumn let-row let-column="column">
  @if (column.key === 'quantity') {
    <input
      matInput
      type="number"
      step="1"
      min="0"
      [(ngModel)]="materialAssignments[row.materialId].quantity"
      [name]="'qty_' + row.materialId"
      class="table-input"
    />
  } @else if (column.key === 'preis') {
    <!-- Neue PriceInputComponent verwenden -->
    <app-price-input
      [(ngModel)]="materialAssignments[row.materialId].price"
      [name]="'price_' + row.materialId"
      [label]="''"
      class="compact-price-input">
    </app-price-input>
  } @else if (column.key === 'quelle') {
    <input
      matInput
      type="text"
      [(ngModel)]="materialAssignments[row.materialId].quelle"
      [name]="'quelle_' + row.materialId"
      class="table-input"
    />
  }
</ng-template>
```

### Option 2: Kompakte Inline-Version für Tabellen

Für Tabellen kann eine vereinfachte Version erstellt werden:

```scss
.compact-price-input {
  app-price-input {
    .price-input-row {
      gap: 8px;
    }
    
    .netto-field,
    .mwst-field {
      margin-bottom: 0;
    }
    
    .price-summary {
      display: none; // Verstecke Zusammenfassung in Tabellen
    }
  }
}
```

## Vorteile der Integration

✅ **Bessere UX**: Benutzer sieht sofort Brutto-Preis  
✅ **Weniger Fehler**: MwSt. wird automatisch berechnet  
✅ **Flexibilität**: Verschiedene MwSt.-Sätze möglich  
✅ **Historische Daten**: MwSt.-Satz wird gespeichert  
✅ **Buchhaltungskonform**: Netto + MwSt. = Brutto

## Nächste Schritte

1. ✅ Backend erweitert (OrderItem.mwst_satz)
2. ✅ PriceInputComponent erstellt
3. ⏳ Order Form anpassen (optional)
4. ⏳ Delivery Form anpassen (optional)
5. ⏳ Reports/Exports erweitern um MwSt.-Auswertung
