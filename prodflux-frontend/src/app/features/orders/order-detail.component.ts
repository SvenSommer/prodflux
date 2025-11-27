import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrdersService, Order } from './orders.service';
import { MaterialCategoryGroup, MaterialsService, Material } from '../materials/materials.service';
import { DeliveriesService, Delivery, CreateOrUpdateDelivery } from '../deliveries/deliveries.service';
import { SuppliersService } from '../settings/suppliers.service';
import { Supplier } from '../settings/models/supplier.model';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MaterialTableComponent, MaterialTableRow, MaterialTableColumn } from '../../shared/components/material-table/material-table.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LinkDeliveryDialogComponent, LinkDeliveryDialogData, LinkDeliveryDialogResult } from './link-delivery-dialog/link-delivery-dialog.component';
import { OrderInfoCardComponent } from './order-info-card/order-info-card.component';
import { OrderCostsCardComponent } from './order-shipping-card/order-shipping-card.component';
import { OrderDeliveriesCardComponent } from './order-deliveries-card/order-deliveries-card.component';
import { OrderMaterialsCardComponent } from './order-materials-card/order-materials-card.component';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    BreadcrumbComponent,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MaterialTableComponent,
    MatDialogModule,
    MatSnackBarModule,
    OrderInfoCardComponent,
    OrderCostsCardComponent,
    OrderDeliveriesCardComponent,
    OrderMaterialsCardComponent
  ],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
})
export class OrderDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersService = inject(OrdersService);
  private materialsService = inject(MaterialsService);
  private deliveriesService = inject(DeliveriesService);
  private suppliersService = inject(SuppliersService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  orderId = Number(this.route.snapshot.paramMap.get('id'));
  order: Order | undefined;
  deliveries: Delivery[] = [];  // NEW: deliveries linked to this order
  materialsMap = new Map<number, string>();
  materialsById = new Map<number, Material>();
  materialGroups: MaterialCategoryGroup[] = [];
  suppliersMap = new Map<number, Supplier>();

  materialTableColumns: MaterialTableColumn[] = [
    { key: 'quantity', header: 'Menge', width: '100px' },
    { key: 'preis', header: 'Preis/Stk. (netto)', width: '140px' },
    { key: 'mwst', header: 'MwSt.', width: '80px' },
    { key: 'gesamt_netto', header: 'Gesamt (netto)', width: '130px' },
    { key: 'brutto', header: 'Preis/Stk. (brutto)', width: '140px' },
    { key: 'gesamt_brutto', header: 'Gesamt (brutto)', width: '140px' },
    { key: 'artikelnummer', header: 'Artikelnr.', width: '150px' }
  ];

  ngOnInit() {
    this.materialsService.getMaterialsGrouped().subscribe(groups => {
      this.materialGroups = groups;
      groups.forEach(group => {
        group.materials.forEach(m => {
          this.materialsMap.set(m.id, m.bezeichnung);
          this.materialsById.set(m.id, m);
        });
      });
    });

    this.suppliersService.getAll().subscribe(suppliers => {
      suppliers.forEach(s => {
        this.suppliersMap.set(s.id, s);
      });
    });

    this.ordersService.get(this.orderId).subscribe((o: Order) => {
      this.order = o;
    });

    // Load deliveries for this order (server-side filtered)
    this.loadDeliveries();
  }

  getMaterialName(id: number): string {
    return this.materialsMap.get(id) || `#${id}`;
  }

  getSupplier(id: number): Supplier | undefined {
    return this.suppliersMap.get(id);
  }

  formatCurrency(value: any): string {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '—';
    return num.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' €';
  }

  calculateBrutto(netto: number, mwstSatz?: number): number {
    const satz = mwstSatz ?? 19;
    return netto * (1 + satz / 100);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  }

  getItemsByCategory(items: Order['items'], categoryId: number | null) {
    const group = this.materialGroups.find(g => g.category_id === categoryId);
    if (!group) {
      return [];
    }
    const materialIdsInGroup = group.materials.map(m => m.id);
    return items.filter(i => materialIdsInGroup.includes(i.material));
  }

  deleteOrder() {
    if (confirm('Bestellung wirklich löschen?')) {
      this.ordersService.delete(this.orderId).subscribe(() => {
        this.router.navigate(['/orders']);
      });
    }
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getMaterialTableRows(): MaterialTableRow[] {
    if (!this.order) return [];

    return this.order.items.map(item => {
      const material = this.materialsById.get(item.material);
      const categoryGroup = this.materialGroups.find(g =>
        g.materials.some(m => m.id === item.material)
      );
      const categoryOrder = categoryGroup?.materials.find(m => m.id === item.material)?.category?.order ?? 9999;
      const preisProStueckBrutto = this.calculateBrutto(item.preis_pro_stueck, item.mwst_satz);
      const gesamtNetto = item.preis_pro_stueck * item.quantity;
      const gesamtBrutto = preisProStueckBrutto * item.quantity;

      return {
        materialId: item.material,
        materialName: material?.bezeichnung || `Material #${item.material}`,
        materialManufacturerName: material?.hersteller_bezeichnung || undefined,
        materialImageUrl: material?.bild_url || null,
        categoryName: categoryGroup?.category_name || 'Ohne Kategorie',
        categoryOrder: categoryOrder,
        data: {
          quantity: item.quantity,
          preis: item.preis_pro_stueck,
          mwst: item.mwst_satz ?? 19,
          gesamt_netto: gesamtNetto,
          brutto: preisProStueckBrutto,
          gesamt_brutto: gesamtBrutto,
          artikelnummer: item.artikelnummer || '—'
        }
      };
    });
  }

  openLinkDeliveryDialog() {
    if (!this.order) return;

    const dialogData: LinkDeliveryDialogData = {
      orderId: this.order.id,
      orderNumber: this.order.order_number
    };

    const dialogRef = this.dialog.open(LinkDeliveryDialogComponent, {
      width: '600px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((result: LinkDeliveryDialogResult) => {
      if (result) {
        if (result.action === 'create') {
          // Navigate to create new delivery with order pre-filled
          this.router.navigate(['/deliveries/new'], {
            queryParams: { orderId: this.order!.id }
          });
        } else if (result.action === 'link' && result.deliveryId) {
          // Update existing delivery to link with this order
          this.deliveriesService.getOne(result.deliveryId).subscribe(delivery => {
            const updateData: CreateOrUpdateDelivery = {
              workshop: typeof delivery.workshop === 'number' ? delivery.workshop : parseInt(delivery.workshop),
              delivered_at: delivery.delivered_at,
              note: delivery.note,
              order: this.order!.id,
              is_historical: delivery.is_historical,
              items: delivery.items
            };
            this.deliveriesService.update(result.deliveryId!, updateData).subscribe({
              next: () => {
                this.snackBar.open('Lieferung erfolgreich verknüpft', 'Schließen', {
                  duration: 3000
                });
                // Reload deliveries
                this.loadDeliveries();
              },
              error: (err) => {
                console.error('Fehler beim Verknüpfen der Lieferung:', err);
                this.snackBar.open('Fehler beim Verknüpfen der Lieferung', 'Schließen', {
                  duration: 5000
                });
              }
            });
          });
        }
      }
    });
  }

  loadDeliveries() {
    this.deliveriesService.getByOrder(this.orderId).subscribe(deliveries => {
      this.deliveries = deliveries;
    });
  }
}
