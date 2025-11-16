import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-inventory-controls',
  standalone: true,
  imports: [
    CommonModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="inventory-controls">
      <!-- Inventurmodus Toggle -->
      <div class="toggle-section">
        <mat-slide-toggle
          [checked]="inventoryModeActive"
          (change)="onInventoryModeToggle()"
          color="primary">
          Inventurmodus
        </mat-slide-toggle>

        <span class="help-text" *ngIf="inventoryModeActive">
          <mat-icon>info</mat-icon>
          Geben Sie die tatsächlich gezählten Mengen ein. Korrekturen werden automatisch berechnet.
        </span>
      </div>

      <!-- Inventur Actions -->
      <div class="actions-section" *ngIf="inventoryModeActive">
        <button
          *ngIf="!navigationModeActive"
          mat-raised-button
          color="accent"
          (click)="onStartNavigation()"
          [disabled]="materialCount === 0"
        >
          <mat-icon>navigate_next</mat-icon>
          Inventur starten (alle Materialien)
        </button>

        <button
          *ngIf="!navigationModeActive"
          mat-raised-button
          color="primary"
          (click)="onSaveAll()"
          [disabled]="unsavedCount === 0"
        >
          <mat-icon>inventory</mat-icon>
          Alle Inventurkorrekturen speichern
        </button>

        <span class="info-text" *ngIf="!navigationModeActive && unsavedCount > 0">
          {{ unsavedCount }} Materialien erfasst
        </span>
      </div>
    </div>
  `,
  styles: [`
    .inventory-controls {
      padding: 1rem;
      background-color: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .toggle-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;

      .help-text {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #666;

        mat-icon {
          font-size: 1.125rem;
          width: 1.125rem;
          height: 1.125rem;
        }
      }
    }

    .actions-section {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;

      button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .info-text {
        color: #388e3c;
        font-weight: 500;
        font-size: 0.875rem;
      }
    }

    @media (max-width: 768px) {
      .actions-section {
        flex-direction: column;
        align-items: stretch;

        button {
          justify-content: center;
        }
      }
    }
  `]
})
export class InventoryControlsComponent {
  @Input() inventoryModeActive = false;
  @Input() navigationModeActive = false;
  @Input() materialCount = 0;
  @Input() unsavedCount = 0;

  @Output() inventoryModeToggled = new EventEmitter<void>();
  @Output() navigationStarted = new EventEmitter<void>();
  @Output() saveAllRequested = new EventEmitter<void>();

  onInventoryModeToggle(): void {
    this.inventoryModeToggled.emit();
  }

  onStartNavigation(): void {
    this.navigationStarted.emit();
  }

  onSaveAll(): void {
    this.saveAllRequested.emit();
  }
}
