import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  ShopbridgeOrdersService,
  WooCommerceBillingAddress,
  WooCommerceAddress,
  WooCommerceOrderUpdateData,
} from '../../shopbridgeorder.service';

export interface EditAddressDialogData {
  orderId: number;
  orderNumber: string;
  type: 'billing' | 'shipping';
  address: WooCommerceBillingAddress | WooCommerceAddress;
  billingAddress?: WooCommerceBillingAddress; // For copy function in shipping
}

export interface Country {
  code: string;
  name: string;
}

@Component({
  selector: 'app-edit-address-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './edit-address-dialog.component.html',
  styleUrls: ['./edit-address-dialog.component.scss'],
})
export class EditAddressDialogComponent implements OnInit {
  addressForm!: FormGroup;
  saving = false;
  private initialValues: Record<string, string> = {};

  countries: Country[] = [
    { code: 'DE', name: 'Deutschland' },
    { code: 'AT', name: 'Österreich' },
    { code: 'CH', name: 'Schweiz' },
    { code: 'BE', name: 'Belgien' },
    { code: 'CZ', name: 'Tschechien' },
    { code: 'DK', name: 'Dänemark' },
    { code: 'ES', name: 'Spanien' },
    { code: 'FR', name: 'Frankreich' },
    { code: 'GB', name: 'Großbritannien' },
    { code: 'IT', name: 'Italien' },
    { code: 'LU', name: 'Luxemburg' },
    { code: 'NL', name: 'Niederlande' },
    { code: 'PL', name: 'Polen' },
    { code: 'SE', name: 'Schweden' },
    { code: 'US', name: 'USA' },
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditAddressDialogComponent>,
    private ordersService: ShopbridgeOrdersService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: EditAddressDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const address = this.data.address;
    const isBilling = this.data.type === 'billing';
    const billingAddress = address as WooCommerceBillingAddress;

    this.addressForm = this.fb.group({
      first_name: [address.first_name || ''],
      last_name: [address.last_name || ''],
      company: [address.company || ''],
      address_1: [address.address_1 || ''],
      address_2: [address.address_2 || ''],
      city: [address.city || ''],
      state: [address.state || ''],
      postcode: [address.postcode || ''],
      country: [address.country || 'DE'],
      ...(isBilling
        ? {
            email: [billingAddress.email || ''],
            phone: [billingAddress.phone || ''],
          }
        : {}),
    });

    // Store initial values for change detection
    this.initialValues = { ...this.addressForm.value };
  }

  hasChanges(): boolean {
    const current = this.addressForm.value;
    return Object.keys(current).some(
      (key) => current[key] !== this.initialValues[key]
    );
  }

  copyFromBilling(): void {
    if (this.data.billingAddress) {
      const billing = this.data.billingAddress;
      this.addressForm.patchValue({
        first_name: billing.first_name,
        last_name: billing.last_name,
        company: billing.company,
        address_1: billing.address_1,
        address_2: billing.address_2,
        city: billing.city,
        state: billing.state,
        postcode: billing.postcode,
        country: billing.country,
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.hasChanges()) {
      this.dialogRef.close();
      return;
    }

    this.saving = true;
    const formValue = this.addressForm.value;

    const updateData: WooCommerceOrderUpdateData = {};
    if (this.data.type === 'billing') {
      updateData.billing = formValue as WooCommerceBillingAddress;
    } else {
      updateData.shipping = formValue as WooCommerceAddress;
    }

    this.ordersService.updateOrder(this.data.orderId, updateData).subscribe({
      next: (updatedOrder) => {
        this.saving = false;
        this.snackBar.open(
          `${this.data.type === 'billing' ? 'Rechnungsadresse' : 'Lieferadresse'} wurde aktualisiert`,
          'OK',
          { duration: 3000 }
        );
        this.dialogRef.close(updatedOrder);
      },
      error: (err) => {
        this.saving = false;
        console.error('Error updating address:', err);
        this.snackBar.open(
          'Fehler beim Speichern der Adresse',
          'Schließen',
          { duration: 5000 }
        );
      },
    });
  }
}
