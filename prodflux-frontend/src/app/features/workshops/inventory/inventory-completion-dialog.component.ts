import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface InventoryCompletionData {
  processedCount: number;
  savedCount: number;
  totalCount: number;
}

@Component({
  selector: 'app-inventory-completion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon class="title-icon">inventory</mat-icon>
      Inventur abgeschlossen
    </h2>
    
    <mat-dialog-content class="dialog-content">
      <div class="completion-message">
        <p class="main-message">Die Inventur wurde erfolgreich abgeschlossen.</p>
        
        <div class="statistics">
          <div class="stat-item processed">
            <div class="stat-icon">
              <mat-icon>visibility</mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ data.processedCount }}</div>
              <div class="stat-label">Materialien bearbeitet</div>
            </div>
          </div>

          <div class="stat-item saved">
            <div class="stat-icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ data.savedCount }}</div>
              <div class="stat-label">Korrekturen gespeichert</div>
            </div>
          </div>

          <div class="stat-item total">
            <div class="stat-icon">
              <mat-icon>inventory_2</mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ data.totalCount }}</div>
              <div class="stat-label">Materialien insgesamt</div>
            </div>
          </div>
        </div>

        <div class="completion-rate" *ngIf="data.totalCount > 0">
          <div class="rate-text">
            Bearbeitungsgrad: {{ getCompletionPercentage() }}%
          </div>
          <div class="rate-bar">
            <div 
              class="rate-fill" 
              [style.width.%]="getCompletionPercentage()">
            </div>
          </div>
        </div>

        <div class="additional-info" *ngIf="getUnprocessedCount() > 0">
          <mat-icon class="info-icon">info</mat-icon>
          <span>{{ getUnprocessedCount() }} Materialien wurden nicht bearbeitet.</span>
        </div>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end" class="dialog-actions">
      <button 
        mat-raised-button 
        color="primary" 
        (click)="closeDialog()"
        cdkFocusInitial>
        <mat-icon>check</mat-icon>
        OK
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0;
      color: #1976d2;

      .title-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .dialog-content {
      padding: 1.5rem 0;

      .completion-message {
        .main-message {
          font-size: 1rem;
          color: #333;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .statistics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;

          .stat-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem;
            border-radius: 8px;
            background-color: #f8f9fa;
            border-left: 4px solid;

            &.processed {
              border-left-color: #2196f3;
              
              .stat-icon mat-icon {
                color: #2196f3;
              }
            }

            &.saved {
              border-left-color: #4caf50;
              
              .stat-icon mat-icon {
                color: #4caf50;
              }
            }

            &.total {
              border-left-color: #ff9800;
              
              .stat-icon mat-icon {
                color: #ff9800;
              }
            }

            .stat-icon mat-icon {
              font-size: 20px;
              width: 20px;
              height: 20px;
            }

            .stat-content {
              .stat-number {
                font-size: 1.5rem;
                font-weight: 700;
                color: #333;
                line-height: 1;
              }

              .stat-label {
                font-size: 0.75rem;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-top: 0.25rem;
              }
            }
          }
        }

        .completion-rate {
          margin-bottom: 1rem;

          .rate-text {
            text-align: center;
            font-size: 0.875rem;
            color: #666;
            margin-bottom: 0.5rem;
            font-weight: 500;
          }

          .rate-bar {
            height: 6px;
            background-color: #e0e0e0;
            border-radius: 3px;
            overflow: hidden;

            .rate-fill {
              height: 100%;
              background: linear-gradient(90deg, #4caf50, #2196f3);
              border-radius: 3px;
              transition: width 0.3s ease;
            }
          }
        }

        .additional-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
          padding: 0.75rem;
          background-color: #fff3e0;
          border-radius: 4px;
          border-left: 4px solid #ff9800;
          font-size: 0.875rem;
          color: #e65100;

          .info-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
      }
    }

    .dialog-actions {
      padding-top: 1rem;

      button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 100px;
      }
    }

    /* Mobile Anpassungen */
    @media (max-width: 600px) {
      .dialog-content {
        .completion-message {
          .statistics {
            grid-template-columns: 1fr;

            .stat-item {
              justify-content: center;
              text-align: center;
              flex-direction: column;
              gap: 0.5rem;
            }
          }
        }
      }
    }
  `]
})
export class InventoryCompletionDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<InventoryCompletionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InventoryCompletionData
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }

  getCompletionPercentage(): number {
    if (this.data.totalCount === 0) return 0;
    return Math.round((this.data.processedCount / this.data.totalCount) * 100);
  }

  getUnprocessedCount(): number {
    return Math.max(0, this.data.totalCount - this.data.processedCount);
  }
}