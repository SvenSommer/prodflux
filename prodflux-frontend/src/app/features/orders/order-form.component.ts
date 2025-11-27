import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrdersService, Order, OrderItem } from './orders.service';
import { MaterialsService, Material, MaterialCategoryGroup } from '../materials/materials.service';
import { SuppliersService } from '../settings/suppliers.service';
import { Supplier } from '../../shared/models/supplier.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PriceData } from '../../shared/components/price-input/price-input.component';
import { OrderMaterialsTableComponent, MaterialAssignment } from './order-materials-table/order-materials-table.component';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { OrderCostsCardComponent, ShippingCostChange } from './order-shipping-card/order-shipping-card.component';
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
    MatCardModule,
    MatIconModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatTooltipModule,
    OrderMaterialsTableComponent,
    BreadcrumbComponent,
    OrderCostsCardComponent
  ]
})
export class OrderFormComponent {
  @ViewChild(OrderMaterialsTableComponent) materialsTable!: OrderMaterialsTableComponent;

  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersService = inject(OrdersService);
  private materialsService = inject(MaterialsService);
  private suppliersService = inject(SuppliersService);

  orderId: number | null = null;
  supplier: number | null = null;

  // Breadcrumb Navigation
  get breadcrumbLinks() {
    if (this.orderId) {
      return [
        { label: 'Bestellungen', url: '/orders' },
        { label: 'Bestellung #' + this.orderId, url: '/orders/' + this.orderId },
        { label: 'Bearbeiten', url: '' }
      ];
    }
    return [
      { label: 'Bestellungen', url: '/orders' },
      { label: 'Neu', url: '' }
    ];
  }

  // Cancel Route
  get cancelRoute(): string[] {
    return this.orderId ? ['/orders', String(this.orderId)] : ['/orders'];
  }
  order_number: string = '';
  bestellt_am: string = '';
  supplier_url: string = '';
  versandkosten: PriceData = { netto: 0, mwst_satz: 19 };
  notiz: string = '';
  is_historical: boolean = false;

  suppliers: Supplier[] = [];
  supplierControl = new FormControl<string | Supplier>('');
  filteredSuppliers!: Observable<Supplier[]>;
  materialGroups: MaterialCategoryGroup[] = [];
  materialsList: Material[] = [];

  // Items for the materials table component
  orderItems: OrderItem[] = [];
  materialAssignments: { [materialId: number]: MaterialAssignment } = {};

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
      this.materialsList = groups.flatMap(g => g.materials);
      console.log('[OrderForm] materialsList loaded:', this.materialsList.length, 'materials');

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
          this.supplier_url = order.supplier_url || '';
          this.versandkosten = {
            netto: order.versandkosten ?? 0,
            mwst_satz: order.versandkosten_mwst_satz ?? 19
          };
          this.notiz = order.notiz || '';
          this.is_historical = order.is_historical || false;

          // Store order items for the materials table component
          this.orderItems = order.items;

          // Also store assignments for save() method
          order.items.forEach(item => {
            // Ensure mwst_satz is a number, defaulting to 19
            const mwstSatz = item.mwst_satz != null ? Number(item.mwst_satz) : 19;
            this.materialAssignments[item.material] = {
              quantity: item.quantity,
              price: {
                netto: item.preis_pro_stueck,
                mwst_satz: mwstSatz
              },
              artikelnummer: item.artikelnummer || '',
              material_url: item.material_url || ''
            };
          });

          console.log('[OrderForm] Order loaded with', order.items.length, 'items');
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
        quantity: Number(v.quantity),
        preis_pro_stueck: Number(v.price.netto),
        mwst_satz: Number(v.price.mwst_satz),
        artikelnummer: v.artikelnummer || '',
        material_url: v.material_url || undefined
      }));

    const payload = {
      supplier: this.supplier,
      order_number: this.order_number || undefined,
      bestellt_am: this.bestellt_am,
      supplier_url: this.supplier_url || undefined,
      versandkosten: this.versandkosten.netto ? Number(this.versandkosten.netto) : null,
      versandkosten_mwst_satz: Number(this.versandkosten.mwst_satz),
      notiz: this.notiz,
      is_historical: this.is_historical,
      items
      // Note: angekommen_am is NOT sent (read-only in backend)
    };

    console.log('[OrderForm] Saving payload:', payload);

    const request = this.orderId
      ? this.ordersService.update(this.orderId, payload)
      : this.ordersService.create(payload);

    request.subscribe({
      next: (result) => {
        console.log('[OrderForm] Save successful, result:', result);
        this.router.navigate(['/orders']);
      },
      error: (error) => {
        console.error('[OrderForm] Save failed:', error);

        let errorMessage = 'Beim Speichern ist ein Fehler aufgetreten.';

        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.items && Array.isArray(error.error.items)) {
            // Items validation errors
            const itemErrors = error.error.items
              .map((itemError: any, index: number) => {
                if (itemError && Object.keys(itemError).length > 0) {
                  const errors = Object.entries(itemError)
                    .map(([field, msg]) => `${field}: ${msg}`)
                    .join(', ');
                  return `Item ${index + 1}: ${errors}`;
                }
                return null;
              })
              .filter((e: any) => e !== null);

            if (itemErrors.length > 0) {
              errorMessage = 'Validierungsfehler:\n' + itemErrors.join('\n');
            }
          } else if (error.error.detail) {
            errorMessage = error.error.detail;
          } else {
            // Other field errors
            const fieldErrors = Object.entries(error.error)
              .map(([field, msg]) => `${field}: ${Array.isArray(msg) ? msg.join(', ') : msg}`)
              .join('\n');
            if (fieldErrors) {
              errorMessage = 'Validierungsfehler:\n' + fieldErrors;
            }
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        alert(errorMessage);
      }
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
    console.log('[OrderForm] Supplier selected:', supplier.id, supplier.name);
    this.supplier = supplier.id;
  }

  // Handler for when materials table emits assignment changes
  onAssignmentsChange(assignments: { [materialId: number]: MaterialAssignment }) {
    this.materialAssignments = assignments;
    console.log('[OrderForm] Assignments updated:', Object.keys(assignments).length, 'materials');
  }

  // Handler for when shipping costs change in the costs card
  onShippingCostChange(change: ShippingCostChange) {
    this.versandkosten = {
      netto: change.netto,
      mwst_satz: change.mwst_satz
    };
    console.log('[OrderForm] Shipping costs updated:', this.versandkosten);
  }

  // Build a preview Order object for the costs card (live calculation)
  buildPreviewOrder(): Order {
    const items: OrderItem[] = Object.entries(this.materialAssignments)
      .filter(([_, v]) => v.quantity > 0)
      .map(([materialId, v]) => ({
        material: +materialId,
        quantity: Number(v.quantity),
        preis_pro_stueck: Number(v.price.netto),
        mwst_satz: Number(v.price.mwst_satz),
        artikelnummer: v.artikelnummer || '',
        material_url: v.material_url || undefined
      }));

    return {
      id: this.orderId || 0,
      supplier: this.supplier || 0,
      order_number: this.order_number || '',
      bestellt_am: this.bestellt_am || '',
      angekommen_am: null,
      supplier_url: this.supplier_url || undefined,
      versandkosten: this.versandkosten.netto,
      versandkosten_mwst_satz: this.versandkosten.mwst_satz,
      notiz: this.notiz || '',
      is_historical: this.is_historical,
      items
    };
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
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Neuer Lieferant</h2>
    <mat-dialog-content>
      <div *ngIf="errorMessage" class="error-message">
        <mat-icon>error</mat-icon>
        <span>{{ errorMessage }}</span>
      </div>

      <mat-form-field appearance="fill" class="full-width">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="supplierName" name="name" required autofocus />
        <mat-error *ngIf="!supplierName">Name ist erforderlich</mat-error>
      </mat-form-field>

      <mat-form-field appearance="fill" class="full-width">
        <mat-label>URL (optional)</mat-label>
        <input matInput [(ngModel)]="supplierUrl" name="url" placeholder="z.B. www.reichelt.de oder https://www.reichelt.de" />
        <mat-hint>https:// wird automatisch hinzugefügt, falls nicht vorhanden</mat-hint>
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
      <button mat-button (click)="cancel()" [disabled]="isSaving">Abbrechen</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="!supplierName || isSaving">
        {{ isSaving ? 'Speichert...' : 'Speichern' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      margin-bottom: 16px;
      background-color: #ffebee;
      border-left: 4px solid #f44336;
      border-radius: 4px;
      color: #c62828;
    }
    .error-message mat-icon {
      color: #f44336;
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
  errorMessage: string = '';
  isSaving: boolean = false;

  cancel() {
    this.dialogRef.close();
  }

  private normalizeUrl(url: string): string {
    if (!url || url.trim() === '') return '';

    const trimmed = url.trim();

    // Wenn URL bereits mit http:// oder https:// beginnt, unverändert zurückgeben
    if (trimmed.match(/^https?:\/\//i)) {
      return trimmed;
    }

    // Andernfalls https:// voranstellen
    return `https://${trimmed}`;
  }

  save() {
    if (!this.supplierName) return;

    this.errorMessage = '';
    this.isSaving = true;

    const normalizedUrl = this.normalizeUrl(this.supplierUrl);

    const newSupplier = {
      name: this.supplierName,
      url: normalizedUrl,
      kundenkonto: this.kundenkonto,
      notes: this.notes,
      is_active: true
    };

    this.suppliersService.create(newSupplier).subscribe({
      next: (result) => {
        this.isSaving = false;
        this.dialogRef.close(result);
      },
      error: (error) => {
        this.isSaving = false;
        console.error('[NewSupplierDialog] Error creating supplier:', error);

        // Extrahiere Fehlermeldung
        if (error.error) {
          if (typeof error.error === 'string') {
            this.errorMessage = error.error;
          } else if (error.error.detail) {
            this.errorMessage = error.error.detail;
          } else if (error.error.name) {
            this.errorMessage = `Name: ${error.error.name.join(', ')}`;
          } else if (error.error.url) {
            this.errorMessage = `URL: ${error.error.url.join(', ')}`;
          } else {
            this.errorMessage = 'Beim Speichern ist ein Fehler aufgetreten.';
          }
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Beim Speichern ist ein Fehler aufgetreten.';
        }
      }
    });
  }
}

