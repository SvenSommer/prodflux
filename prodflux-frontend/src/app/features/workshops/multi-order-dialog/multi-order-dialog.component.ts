import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { WorkshopService, ProductLifecycleEntry, MaterialRequirement, Workshop } from '../workshop.service';

export interface MultiOrderDialogData {
  workshopId: number;
  workshopName: string;
  productLifecycle: ProductLifecycleEntry[];
}

@Component({
  selector: 'app-multi-order-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './multi-order-dialog.component.html',
  styleUrls: ['./multi-order-dialog.component.scss']
})
export class MultiOrderDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<MultiOrderDialogComponent>);
  private workshopService = inject(WorkshopService);
  public data = inject<MultiOrderDialogData>(MAT_DIALOG_DATA);

  multiOrderProducts: { product_id: number; product: string; quantity: number }[] = [];
  filteredMissingRequirements: MaterialRequirement[] = [];
  filteredCoveredRequirements: MaterialRequirement[] = [];

  ngOnInit() {
    this.multiOrderProducts = this.data.productLifecycle.map((p) => ({
      product_id: p.product_id,
      product: p.product,
      quantity: 0,
    }));
  }

  loadAggregatedRequirements() {
    const products = this.multiOrderProducts
      .filter((p) => p.quantity > 0)
      .map((p) => ({ product_id: p.product_id, quantity: p.quantity }));

    if (!products.length) {
      this.filteredMissingRequirements = [];
      this.filteredCoveredRequirements = [];
      return;
    }

    this.workshopService
      .getAggregatedRequirements(this.data.workshopId, products)
      .subscribe((data) => {
        this.filteredMissingRequirements = data.filter(m => m.missing_quantity > 0);
        this.filteredCoveredRequirements = data.filter(m => m.missing_quantity <= 0);
      });
  }

  confirmAggregatedOrder() {
    const bestellteProdukte = this.multiOrderProducts
      .filter(p => p.quantity > 0)
      .map(p => `- ${p.product}: ${p.quantity} Stück`)
      .join('\n');

    const formatTableRow = (m: MaterialRequirement) => {
      return `${m.bezeichnung.padEnd(75)} | ${String(m.required_quantity).padStart(8)} | ${String(m.ordered_quantity).padStart(8)} | ${String(m.available_quantity).padStart(9)} | ${String(m.missing_quantity).padStart(7)}`;
    };

    const fehlendeHeader = `Material                                                             | Benötigt | Bestellt | Vorhanden | Fehlend\n` +
                           `---------------------------------------------------------------------|----------|----------|-----------|--------`;

    const gedeckteHeader = `Material                                                            | Benötigt | Bestellt | Vorhanden | Fehlend\n` +
                           `--------------------------------------------------------------------|----------|----------|-----------|--------`;

    const fehlendeMaterialien = this.filteredMissingRequirements.map(formatTableRow).join('\n');
    const gedeckteMaterialien = this.filteredCoveredRequirements.map(formatTableRow).join('\n');

    const body = encodeURIComponent(
      `Materialbedarf für folgende Produkte:\n\n` +
      `${bestellteProdukte}\n\n` +
      `In der Werkstatt "${this.data.workshopName}" werden folgende Materialien benötigt:\n\n` +
      `${fehlendeHeader}\n${fehlendeMaterialien || '(keine)'}\n\n` +
      `Folgende Bestände sind bereits gedeckt:\n\n` +
      `${gedeckteHeader}\n${gedeckteMaterialien || '(keine)'}\n`
    );

    const subject = encodeURIComponent(`Materialbedarf für Werkstatt ${this.data.workshopName}`);
    const mailto = `mailto:info@sdlink.de?subject=${subject}&body=${body}`;

    window.location.href = mailto;
    this.dialogRef.close();
  }
}
