import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrdersService, OrderItem } from './orders.service';
import { MaterialsService, Material, MaterialCategoryGroup } from '../materials/materials.service';
import { SuppliersService } from '../settings/suppliers.service';
import { Supplier } from '../../shared/models/supplier.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MaterialTableComponent, MaterialTableColumn, MaterialTableRow } from '../../shared/components/material-table/material-table.component';
import { PriceInputComponent, PriceData } from '../../shared/components/price-input/price-input.component';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-order-form',
  standalone: true,
  templateUrl: './order-form.component.html',
  styleUrls: ['./order-form.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatTooltipModule,
    MaterialTableComponent,
    PriceInputComponent
  ]
})
export class OrderFormComponent {
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersService = inject(OrdersService);
  private materialsService = inject(MaterialsService);
  private suppliersService = inject(SuppliersService);

  orderId: number | null = null;
  supplier: number | null = null;
  order_number: string = '';
  bestellt_am: string = '';
  versandkosten: PriceData = { netto: 0, mwst_satz: 19 };
  notiz: string = '';
  is_historical: boolean = false;

  suppliers: Supplier[] = [];
  supplierControl = new FormControl<string | Supplier>('');
  filteredSuppliers!: Observable<Supplier[]>;
  materialGroups: MaterialCategoryGroup[] = [];

  materialsList: Material[] = [];
  materialAssignments: {
    [materialId: number]: { quantity: number; price: PriceData; quelle: string };
  } = {};

  // For MaterialTableComponent
  materialTableRows: MaterialTableRow[] = [];
  tableColumns: MaterialTableColumn[] = [
    { key: 'quantity', header: 'Menge', width: '120px' },
    { key: 'price', header: 'Preis/Stk. (Netto/MwSt.)', width: '350px' },
    { key: 'quelle', header: 'Quelle', width: '200px' }
  ];

  ngOnInit() {
    console.log('[OrderForm] Init');
    this.orderId = Number(this.route.snapshot.paramMap.get('id')) || null;

    // Setup autocomplete filtering
    this.filteredSuppliers = this.supplierControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterSuppliers(name as string) : this.suppliers.slice();
      })
    );

    // Load suppliers first
    this.suppliersService.getAll().subscribe(suppliers => {
      this.suppliers = suppliers.filter(s => s.is_active);
      console.log('[OrderForm] Active suppliers loaded:', this.suppliers.length);

      // Then load materials and potentially the order
      this.loadMaterialsAndOrder();
    });
  }

  loadMaterialsAndOrder() {
    this.materialsService.getMaterialsGrouped().subscribe(groups => {
      this.materialGroups = groups;

      const allMaterials = groups.flatMap(g => g.materials);
      this.materialsList = allMaterials;

      console.log('[OrderForm] materialsList:', allMaterials);

      // Prepare material assignments and table rows
      this.materialTableRows = [];
      for (const mat of allMaterials) {
        this.materialAssignments[mat.id] = {
          quantity: 0,
          price: { netto: 0, mwst_satz: 19 },
          quelle: ''
        };

        // Find category for this material
        const group = groups.find(g => g.materials.some(m => m.id === mat.id));

        this.materialTableRows.push({
          materialId: mat.id,
          materialName: mat.bezeichnung,
          materialImageUrl: mat.bild_url,
          categoryName: group?.category_name || 'Ohne Kategorie',
          categoryOrder: mat.category?.order ?? 9999,
          data: mat
        });
      }

      if (this.orderId) {
        this.ordersService.get(this.orderId).subscribe(order => {
          console.log('[OrderForm] fetched order:', order);

          this.supplier = order.supplier;

          // Set supplier in autocomplete
          const selectedSupplier = this.suppliers.find(s => s.id === order.supplier);
          if (selectedSupplier) {
            this.supplierControl.setValue(selectedSupplier);
          }

          this.order_number = order.order_number || '';
          this.bestellt_am = order.bestellt_am;
          this.versandkosten = {
            netto: order.versandkosten ?? 0,
            mwst_satz: order.versandkosten_mwst_satz ?? 19
          };
          this.notiz = order.notiz || '';
          this.is_historical = order.is_historical || false;

          order.items.forEach(item => {
            if (!this.materialAssignments[item.material]) {
              console.warn('[OrderForm] WARN: material id not found in materialAssignments:', item.material);
              this.materialAssignments[item.material] = {
                quantity: item.quantity,
                price: {
                  netto: item.preis_pro_stueck,
                  mwst_satz: item.mwst_satz || 19
                },
                quelle: item.quelle || ''
              };
            } else {
              this.materialAssignments[item.material].quantity = item.quantity;
              this.materialAssignments[item.material].price = {
                netto: item.preis_pro_stueck,
                mwst_satz: item.mwst_satz || 19
              };
              this.materialAssignments[item.material].quelle = item.quelle || '';
            }
          });

          console.log('[OrderForm] materialAssignments after load:', this.materialAssignments);
        });
      }
    });
  }

  save() {
    if (!this.supplier) {
      console.error('[OrderForm] Supplier is required');
      return;
    }

    const items: OrderItem[] = Object.entries(this.materialAssignments)
      .filter(([_, v]) => v.quantity > 0)
      .map(([materialId, v]) => ({
        material: +materialId,
        quantity: v.quantity,
        preis_pro_stueck: v.price.netto,
        mwst_satz: v.price.mwst_satz,
        quelle: v.quelle || ''
      }));

    const payload = {
      supplier: this.supplier,
      order_number: this.order_number || undefined,
      bestellt_am: this.bestellt_am,
      versandkosten: this.versandkosten.netto,
      versandkosten_mwst_satz: this.versandkosten.mwst_satz,
      notiz: this.notiz,
      is_historical: this.is_historical,
      items
      // Note: angekommen_am is NOT sent (read-only in backend)
    };

    console.log('[OrderForm] Saving payload:', payload);

    const request = this.orderId
      ? this.ordersService.update(this.orderId, payload)
      : this.ordersService.create(payload);

    request.subscribe(result => {
      console.log('[OrderForm] Save successful, result:', result);
      this.router.navigate(['/orders']);
    });
  }

  loadSuppliers() {
    this.suppliersService.getAll().subscribe(suppliers => {
      this.suppliers = suppliers.filter(s => s.is_active);
      console.log('[OrderForm] Active suppliers loaded:', this.suppliers.length);
    });
  }

  private _filterSuppliers(value: string): Supplier[] {
    const filterValue = value.toLowerCase();
    return this.suppliers.filter(s => s.name.toLowerCase().includes(filterValue));
  }

  displaySupplierFn(supplier: Supplier): string {
    return supplier && supplier.name ? supplier.name : '';
  }

  onSupplierSelected(supplier: Supplier) {
    this.supplier = supplier.id;
  }

  openNewSupplierDialog() {
    const dialogRef = this.dialog.open(NewSupplierDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Reload suppliers and select the new one
        this.suppliersService.getAll().subscribe(suppliers => {
          this.suppliers = suppliers.filter(s => s.is_active);
          const newSupplier = suppliers.find(s => s.id === result.id);
          if (newSupplier) {
            this.supplier = newSupplier.id;
            this.supplierControl.setValue(newSupplier);
          }
        });
      }
    });
  }
}

// Dialog Component for creating new supplier
@Component({
  selector: 'app-new-supplier-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Neuer Lieferant</h2>
    <mat-dialog-content>
      <mat-form-field appearance="fill" class="full-width">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="supplierName" name="name" required autofocus />
      </mat-form-field>

      <mat-form-field appearance="fill" class="full-width">
        <mat-label>URL (optional)</mat-label>
        <input matInput [(ngModel)]="supplierUrl" name="url" type="url" />
      </mat-form-field>

      <mat-form-field appearance="fill" class="full-width">
        <mat-label>Kundenkonto (optional)</mat-label>
        <input matInput [(ngModel)]="kundenkonto" name="kundenkonto" />
      </mat-form-field>

      <mat-form-field appearance="fill" class="full-width">
        <mat-label>Notizen (optional)</mat-label>
        <textarea matInput [(ngModel)]="notes" name="notes" rows="3"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Abbrechen</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="!supplierName">Speichern</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
  `]
})
export class NewSupplierDialogComponent {
  private dialogRef = inject(MatDialogRef<NewSupplierDialogComponent>);
  private suppliersService = inject(SuppliersService);

  supplierName: string = '';
  supplierUrl: string = '';
  kundenkonto: string = '';
  notes: string = '';

  cancel() {
    this.dialogRef.close();
  }

  save() {
    if (!this.supplierName) return;

    const newSupplier = {
      name: this.supplierName,
      url: this.supplierUrl,
      kundenkonto: this.kundenkonto,
      notes: this.notes,
      is_active: true
    };

    this.suppliersService.create(newSupplier).subscribe(result => {
      this.dialogRef.close(result);
    });
  }
}

