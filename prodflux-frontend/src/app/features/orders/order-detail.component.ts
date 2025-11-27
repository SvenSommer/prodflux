import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrdersService, Order } from './orders.service';
import { MaterialCategoryGroup, MaterialsService, Material } from '../materials/materials.service';
import { DeliveriesService, Delivery, CreateOrUpdateDelivery } from '../deliveries/deliveries.service';
import { SuppliersService } from '../settings/suppliers.service';
import { Supplier } from '../settings/models/supplier.model';
import { MatCardModule } from '@angular/material/card';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LinkDeliveryDialogComponent, LinkDeliveryDialogData, LinkDeliveryDialogResult } from './link-delivery-dialog/link-delivery-dialog.component';
import { OrderInfoCardComponent } from './order-info-card/order-info-card.component';
import { OrderCostsCardComponent } from './order-shipping-card/order-shipping-card.component';
import { OrderDeliveriesCardComponent } from './order-deliveries-card/order-deliveries-card.component';
import { OrderMaterialsTableComponent } from './order-materials-table/order-materials-table.component';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    BreadcrumbComponent,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    OrderInfoCardComponent,
    OrderCostsCardComponent,
    OrderDeliveriesCardComponent,
    OrderMaterialsTableComponent
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
  materialsList: Material[] = [];
  materialGroups: MaterialCategoryGroup[] = [];
  suppliersMap = new Map<number, Supplier>();

  ngOnInit() {
    this.materialsService.getMaterialsGrouped().subscribe(groups => {
      this.materialGroups = groups;
      this.materialsList = groups.flatMap(g => g.materials);
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

  deleteOrder() {
    if (confirm('Bestellung wirklich löschen?')) {
      this.ordersService.delete(this.orderId).subscribe(() => {
        this.router.navigate(['/orders']);
      });
    }
  }

  openLinkDeliveryDialog() {
    if (!this.order) return;

    const dialogData: LinkDeliveryDialogData = {
      orderId: this.order.id,
      orderNumber: this.order.order_number,
      orderMaterialIds: this.order.items.map(item => item.material)
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

  getOrderDisplayName(): string {
    if (!this.order) return '';
    const supplier = this.getSupplier(this.order.supplier);
    return this.ordersService.getOrderDisplayName(this.order, supplier?.name);
  }
}
