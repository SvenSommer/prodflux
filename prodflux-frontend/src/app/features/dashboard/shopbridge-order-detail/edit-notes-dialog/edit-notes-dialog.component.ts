import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  ShopbridgeOrdersService,
  WooCommerceOrderUpdateData,
} from '../../shopbridgeorder.service';

export interface EditNotesDialogData {
  orderId: number;
  orderNumber: string;
  customerNote: string;
}

@Component({
  selector: 'app-edit-notes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './edit-notes-dialog.component.html',
  styleUrls: ['./edit-notes-dialog.component.scss'],
})
export class EditNotesDialogComponent implements OnInit {
  notesForm!: FormGroup;
  saving = false;
  private initialNote = '';

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditNotesDialogComponent>,
    private ordersService: ShopbridgeOrdersService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: EditNotesDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.initialNote = this.data.customerNote || '';
    this.notesForm = this.fb.group({
      customer_note: [this.initialNote],
    });
  }

  hasChanges(): boolean {
    return this.notesForm.get('customer_note')?.value !== this.initialNote;
  }

  getCharacterCount(): number {
    return this.notesForm.get('customer_note')?.value?.length || 0;
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
    const customerNote = this.notesForm.get('customer_note')?.value || '';

    const updateData: WooCommerceOrderUpdateData = {
      customer_note: customerNote,
    };

    this.ordersService.updateOrder(this.data.orderId, updateData).subscribe({
      next: (updatedOrder) => {
        this.saving = false;
        this.snackBar.open('Kundennotiz wurde aktualisiert', 'OK', {
          duration: 3000,
        });
        this.dialogRef.close(updatedOrder);
      },
      error: (err) => {
        this.saving = false;
        console.error('Error updating notes:', err);
        this.snackBar.open('Fehler beim Speichern der Notiz', 'Schließen', {
          duration: 5000,
        });
      },
    });
  }
}
