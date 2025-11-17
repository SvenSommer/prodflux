import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
  color?: 'primary' | 'accent' | 'warn';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirm-dialog">
      <div mat-dialog-title class="dialog-title">
        <mat-icon *ngIf="data.icon" [class]="'icon-' + (data.color || 'primary')">
          {{ data.icon }}
        </mat-icon>
        <span>{{ data.title }}</span>
      </div>

      <div mat-dialog-content class="dialog-content">
        <p>{{ data.message }}</p>
      </div>

      <div mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()">
          {{ data.cancelText || 'Abbrechen' }}
        </button>
        <button
          mat-raised-button
          [color]="data.color || 'warn'"
          (click)="onConfirm()"
          cdkFocusInitial>
          {{ data.confirmText || 'Bestätigen' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 350px;
      max-width: 500px;
      padding: 24px;
    }

    .dialog-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 500;
      margin: -24px -24px 16px -24px;
      padding: 24px 24px 16px 24px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }

    .dialog-title mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .icon-primary {
      color: #1976d2;
    }

    .icon-accent {
      color: #ff4081;
    }

    .icon-warn {
      color: #f44336;
    }

    .dialog-content {
      padding: 20px 0;
      margin: 0;
    }

    .dialog-content p {
      margin: 0;
      font-size: 16px;
      line-height: 1.6;
      color: rgba(0, 0, 0, 0.87);
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 0 0 0;
      margin: -24px -24px -24px -24px;
      padding: 16px 24px 24px 24px;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
      background-color: rgba(0, 0, 0, 0.02);
    }

    .dialog-actions button {
      min-width: 100px;
      height: 40px;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
