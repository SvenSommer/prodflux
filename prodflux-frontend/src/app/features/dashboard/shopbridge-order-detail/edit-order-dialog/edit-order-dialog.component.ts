import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';

import {
  ShopbridgeOrdersService,
  WooCommerceOrderDetail,
  WooCommerceBillingAddress,
  WooCommerceAddress,
  WooCommerceOrderUpdateData
} from '../../shopbridgeorder.service';

export interface EditOrderDialogData {
  order: WooCommerceOrderDetail;
}

@Component({
  selector: 'app-edit-order-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatCheckboxModule,
    MatDividerModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>edit</mat-icon>
      Bestellung #{{ data.order.number }} bearbeiten
    </h2>

    <mat-dialog-content>
      <mat-tab-group>
        <!-- Rechnungsadresse Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>receipt</mat-icon>
            <span>Rechnungsadresse</span>
          </ng-template>

          <div class="form-content" [formGroup]="billingForm">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Vorname</mat-label>
                <input matInput formControlName="first_name">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Nachname</mat-label>
                <input matInput formControlName="last_name">
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Firma</mat-label>
              <input matInput formControlName="company">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Adresszeile 1</mat-label>
              <input matInput formControlName="address_1">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Adresszeile 2</mat-label>
              <input matInput formControlName="address_2">
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>PLZ</mat-label>
                <input matInput formControlName="postcode">
              </mat-form-field>
              <mat-form-field appearance="outline" class="flex-2">
                <mat-label>Stadt</mat-label>
                <input matInput formControlName="city">
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Bundesland</mat-label>
                <input matInput formControlName="state">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Land (ISO Code)</mat-label>
                <input matInput formControlName="country" placeholder="z.B. DE">
              </mat-form-field>
            </div>

            <mat-divider></mat-divider>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>E-Mail</mat-label>
              <input matInput formControlName="email" type="email">
              <mat-icon matPrefix>email</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Telefon</mat-label>
              <input matInput formControlName="phone" type="tel">
              <mat-icon matPrefix>phone</mat-icon>
            </mat-form-field>
          </div>
        </mat-tab>

        <!-- Lieferadresse Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>local_shipping</mat-icon>
            <span>Lieferadresse</span>
          </ng-template>

          <div class="form-content" [formGroup]="shippingForm">
            <div class="copy-billing-section">
              <button mat-stroked-button color="primary" (click)="copyBillingToShipping()">
                <mat-icon>content_copy</mat-icon>
                Von Rechnungsadresse übernehmen
              </button>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Vorname</mat-label>
                <input matInput formControlName="first_name">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Nachname</mat-label>
                <input matInput formControlName="last_name">
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Firma</mat-label>
              <input matInput formControlName="company">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Adresszeile 1</mat-label>
              <input matInput formControlName="address_1">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Adresszeile 2</mat-label>
              <input matInput formControlName="address_2">
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>PLZ</mat-label>
                <input matInput formControlName="postcode">
              </mat-form-field>
              <mat-form-field appearance="outline" class="flex-2">
                <mat-label>Stadt</mat-label>
                <input matInput formControlName="city">
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Bundesland</mat-label>
                <input matInput formControlName="state">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Land (ISO Code)</mat-label>
                <input matInput formControlName="country" placeholder="z.B. DE">
              </mat-form-field>
            </div>
          </div>
        </mat-tab>

        <!-- Notizen Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>note</mat-icon>
            <span>Notizen</span>
          </ng-template>

          <div class="form-content">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Kundennotiz</mat-label>
              <textarea
                matInput
                [(ngModel)]="customerNote"
                rows="5"
                placeholder="Notiz des Kunden zur Bestellung">
              </textarea>
              <mat-hint>Diese Notiz wird dem Kunden angezeigt</mat-hint>
            </mat-form-field>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()" [disabled]="saving">
        Abbrechen
      </button>
      <button
        mat-raised-button
        color="primary"
        (click)="save()"
        [disabled]="saving || !hasChanges()">
        <mat-icon *ngIf="!saving">save</mat-icon>
        <mat-spinner *ngIf="saving" diameter="20"></mat-spinner>
        {{ saving ? 'Speichern...' : 'Speichern' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 12px;

      mat-icon {
        color: #1976d2;
      }
    }

    mat-dialog-content {
      min-width: 550px;
      max-width: 700px;
      max-height: 70vh;

      mat-tab-group {
        margin-top: 8px;
      }

      .mat-mdc-tab {
        mat-icon {
          margin-right: 8px;
        }
      }
    }

    .form-content {
      padding: 24px 16px;
    }

    .form-row {
      display: flex;
      gap: 16px;

      mat-form-field {
        flex: 1;
      }

      .flex-2 {
        flex: 2;
      }
    }

    .full-width {
      width: 100%;
    }

    mat-divider {
      margin: 16px 0;
    }

    .copy-billing-section {
      margin-bottom: 24px;

      button {
        mat-icon {
          margin-right: 8px;
        }
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;

      button {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    mat-spinner {
      margin-right: 8px;
    }
  `]
})
export class EditOrderDialogComponent {
  private fb = inject(FormBuilder);
  private orderService = inject(ShopbridgeOrdersService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<EditOrderDialogComponent>);

  saving = false;
  customerNote: string;

  // Original values for comparison
  private originalBilling: WooCommerceBillingAddress;
  private originalShipping: WooCommerceAddress;
  private originalCustomerNote: string;

  // Form groups for addresses
  billingForm: FormGroup;
  shippingForm: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: EditOrderDialogData) {
    // Store originals for change detection
    this.originalBilling = { ...data.order.billing };
    this.originalShipping = { ...data.order.shipping };
    this.originalCustomerNote = data.order.customer_note || '';
    this.customerNote = this.originalCustomerNote;

    // Initialize billing form
    this.billingForm = this.fb.group({
      first_name: [data.order.billing.first_name],
      last_name: [data.order.billing.last_name],
      company: [data.order.billing.company],
      address_1: [data.order.billing.address_1],
      address_2: [data.order.billing.address_2],
      city: [data.order.billing.city],
      state: [data.order.billing.state],
      postcode: [data.order.billing.postcode],
      country: [data.order.billing.country],
      email: [data.order.billing.email],
      phone: [data.order.billing.phone],
    });

    // Initialize shipping form
    this.shippingForm = this.fb.group({
      first_name: [data.order.shipping.first_name],
      last_name: [data.order.shipping.last_name],
      company: [data.order.shipping.company],
      address_1: [data.order.shipping.address_1],
      address_2: [data.order.shipping.address_2],
      city: [data.order.shipping.city],
      state: [data.order.shipping.state],
      postcode: [data.order.shipping.postcode],
      country: [data.order.shipping.country],
    });
  }

  copyBillingToShipping(): void {
    const billingValues = this.billingForm.value;
    this.shippingForm.patchValue({
      first_name: billingValues.first_name,
      last_name: billingValues.last_name,
      company: billingValues.company,
      address_1: billingValues.address_1,
      address_2: billingValues.address_2,
      city: billingValues.city,
      state: billingValues.state,
      postcode: billingValues.postcode,
      country: billingValues.country,
    });
    this.snackBar.open('Rechnungsadresse übernommen', 'OK', { duration: 2000 });
  }

  hasChanges(): boolean {
    // Check billing changes
    const billingValues = this.billingForm.value;
    const billingChanged = Object.keys(billingValues).some(
      key => billingValues[key] !== (this.originalBilling as any)[key]
    );

    // Check shipping changes
    const shippingValues = this.shippingForm.value;
    const shippingChanged = Object.keys(shippingValues).some(
      key => shippingValues[key] !== (this.originalShipping as any)[key]
    );

    // Check customer note changes
    const noteChanged = this.customerNote !== this.originalCustomerNote;

    return billingChanged || shippingChanged || noteChanged;
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    if (!this.hasChanges()) {
      this.dialogRef.close(false);
      return;
    }

    this.saving = true;

    // Build update data - only include changed fields
    const updateData: Partial<WooCommerceOrderUpdateData> = {};

    // Check billing changes
    const billingValues = this.billingForm.value;
    const billingChanged = Object.keys(billingValues).some(
      key => billingValues[key] !== (this.originalBilling as any)[key]
    );
    if (billingChanged) {
      updateData.billing = billingValues;
    }

    // Check shipping changes
    const shippingValues = this.shippingForm.value;
    const shippingChanged = Object.keys(shippingValues).some(
      key => shippingValues[key] !== (this.originalShipping as any)[key]
    );
    if (shippingChanged) {
      updateData.shipping = shippingValues;
    }

    // Check customer note changes
    if (this.customerNote !== this.originalCustomerNote) {
      updateData.customer_note = this.customerNote;
    }

    this.orderService.updateOrder(this.data.order.id, updateData).subscribe({
      next: (response) => {
        this.saving = false;
        this.snackBar.open(
          `Bestellung erfolgreich aktualisiert (${response.updated_fields.join(', ')})`,
          'OK',
          { duration: 3000 }
        );
        this.dialogRef.close(response.order);
      },
      error: (err) => {
        this.saving = false;
        console.error('Fehler beim Aktualisieren:', err);
        this.snackBar.open(
          `Fehler: ${err.error?.error || 'Unbekannter Fehler'}`,
          'Schließen',
          { duration: 5000 }
        );
      }
    });
  }
}
