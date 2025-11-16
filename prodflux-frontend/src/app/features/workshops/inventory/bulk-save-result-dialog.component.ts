import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface BulkSaveResultData {
  savedCount: number;
  errorCount: number;
  totalCount: number;
}

@Component({
  selector: 'app-bulk-save-result-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon [class]="data.errorCount > 0 ? 'warning-icon' : 'success-icon'">
        {{data.errorCount > 0 ? 'warning' : 'check_circle'}}
      </mat-icon>
      Inventur abgeschlossen
    </h2>

    <mat-dialog-content class="dialog-content">
      <div class="result-summary">
        <div class="saved-count" *ngIf="data.savedCount > 0">
          <mat-icon class="success-icon small">check</mat-icon>
          <span><strong>{{data.savedCount}}</strong> Korrekturen erfolgreich gespeichert</span>
        </div>

        <div class="error-count" *ngIf="data.errorCount > 0">
          <mat-icon class="error-icon small">error</mat-icon>
          <span><strong>{{data.errorCount}}</strong> Fehler aufgetreten</span>
        </div>

        <div class="total-info">
          Von insgesamt {{data.totalCount}} Korrekturen verarbeitet.
        </div>
      </div>

      <div class="reload-info" *ngIf="data.savedCount > 0">
        <mat-icon class="info-icon">info</mat-icon>
        Die Tabelle wird automatisch mit den neuen Werten aktualisiert.
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" (click)="close()">
        OK
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 350px;
      padding: 16px 0;
    }

    .result-summary {
      margin-bottom: 16px;
    }

    .saved-count,
    .error-count {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 16px;
    }

    .total-info {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e0e0e0;
      color: #666;
      font-size: 14px;
    }

    .reload-info {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 12px;
      background-color: #f5f5f5;
      border-radius: 4px;
      border-left: 4px solid #2196f3;
      font-size: 14px;
      color: #555;
    }

    .success-icon {
      color: #4caf50;
    }

    .warning-icon {
      color: #ff9800;
    }

    .error-icon {
      color: #f44336;
    }

    .info-icon {
      color: #2196f3;
    }

    .small {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      padding: 24px 24px 16px;
    }

    mat-dialog-actions {
      padding: 16px 24px;
      margin: 0;
    }
  `]
})
export class BulkSaveResultDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<BulkSaveResultDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BulkSaveResultData
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
