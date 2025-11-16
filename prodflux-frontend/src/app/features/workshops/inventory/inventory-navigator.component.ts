import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { InventoryService, InventoryProgress } from './inventory.service';
import { MaterialStockMaterial } from '../workshop.service';
import { ProductsService, Product } from '../../products/products.service';
import { Subscription } from 'rxjs';

export interface NavigationEvent {
  direction: 'next' | 'previous';
}

export interface SaveAndNextEvent {
  materialId: number;
  materialName: string;
  inventoryCount: number;
}

@Component({
  selector: 'app-inventory-navigator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule
  ],
  template: `
    <mat-card class="inventory-navigator" *ngIf="isVisible">
      <mat-card-content>
        <!-- Fortschrittsanzeige -->
        <div class="progress-section">
          <div class="progress-text">
            Material {{ progress.currentIndex + 1 }} von {{ progress.totalCount }}
            ({{ progress.progressPercentage }}% bearbeitet)
          </div>
          <mat-progress-bar
            mode="determinate"
            [value]="progress.progressPercentage"
            class="progress-bar">
          </mat-progress-bar>
        </div>

        <!-- Aktuelles Material -->
        <div class="material-section" *ngIf="currentMaterial">
          <div class="material-header">
            <h4 class="material-name">{{ currentMaterial.bezeichnung }}</h4>
          </div>

          <!-- Material Bild -->
          <div class="material-image-container">
            <img
              *ngIf="currentMaterial.bild_url"
              [src]="currentMaterial.bild_url"
              [alt]="currentMaterial.bezeichnung"
              class="material-image"
              (error)="onImageError($event)"
            />
            <div *ngIf="!currentMaterial.bild_url" class="no-image-placeholder">
              <mat-icon>image_not_supported</mat-icon>
            </div>
          </div>

          <!-- Bestandsinfo -->
          <div class="stock-info">
            <span>Aktueller Bestand: <strong>{{ currentMaterial.bestand }}</strong></span>
          </div>

          <!-- Produktinformationen -->
          <div class="product-usage-section" *ngIf="relatedProducts.length > 0">
            <div class="section-title">Verwendet in:</div>
            <div class="product-images-grid">
              <div
                *ngFor="let product of relatedProducts"
                class="product-item"
                [matTooltip]="product.bezeichnung"
                matTooltipPosition="above"
              >
                <img
                  *ngIf="product.bild"
                  [src]="product.bild"
                  [alt]="product.bezeichnung"
                  class="product-image"
                  (error)="onProductImageError($event)"
                />
                <div *ngIf="!product.bild" class="product-placeholder">
                  <mat-icon>inventory_2</mat-icon>
                </div>
              </div>
            </div>
          </div>

          <!-- Inventur Eingabe -->
          <mat-form-field appearance="outline" class="inventory-input-field">
            <mat-label>Gezählte Menge</mat-label>
            <input
              #inventoryInput
              matInput
              type="number"
              min="0"
              [(ngModel)]="inventoryCount"
              (keydown)="onKeyPress($event)"
              placeholder="Eingeben..."
            />
          </mat-form-field>
        </div>

        <!-- Navigation Buttons -->
        <div class="navigation-section">
          <button
            mat-button
            (click)="onNavigate('previous')"
            [disabled]="!canGoToPrevious"
            matTooltip="Vorheriges Material (Pfeil Links)"
          >
            <mat-icon>chevron_left</mat-icon>
            Zurück
          </button>

          <button
            mat-raised-button
            color="primary"
            (click)="onSaveAndNext()"
            [disabled]="inventoryCount === undefined || inventoryCount < 0"
            matTooltip="Material speichern und zum nächsten (Enter)"
          >
            <mat-icon>save</mat-icon>
            Speichern & Weiter
          </button>

          <button
            mat-button
            (click)="onNavigate('next')"
            [disabled]="!canGoToNext"
            matTooltip="Nächstes Material (Pfeil Rechts)"
          >
            Weiter
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>

        <!-- Inventur beenden -->
        <div class="finish-section">
          <button
            mat-stroked-button
            color="accent"
            (click)="onFinishInventory()"
            matTooltip="Inventur-Navigation beenden"
          >
            <mat-icon>done</mat-icon>
            Inventur beenden
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .inventory-navigator {
      position: fixed;
      top: 100px;
      right: 20px;
      width: 350px;
      max-width: calc(100vw - 40px);
      z-index: 1000;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(0, 0, 0, 0.08);

      .progress-section {
        margin-bottom: 1rem;

        .progress-text {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .progress-bar {
          height: 6px;
          border-radius: 3px;
        }
      }

      .material-section {
        text-align: center;
        margin-bottom: 1.5rem;

        .material-header {
          margin-bottom: 1rem;

          .material-name {
            margin: 0 0 0.25rem 0;
            font-size: 1rem;
            font-weight: 600;
            color: #1976d2;
            word-wrap: break-word;
            line-height: 1.3;
          }

          .material-category {
            font-size: 0.75rem;
            color: #666;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
        }

        .material-image-container {
          margin-bottom: 1rem;

          .material-image {
            width: 100px;
            height: 100px;
            object-fit: cover;
            border-radius: 8px;
            border: 2px solid #e0e0e0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .no-image-placeholder {
            width: 100px;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f5f5f5;
            border-radius: 8px;
            border: 2px solid #e0e0e0;
            margin: 0 auto;

            mat-icon {
              font-size: 40px;
              color: #999;
            }
          }
        }

        .stock-info {
          margin-bottom: 1rem;
          font-size: 0.875rem;
          color: #666;

          strong {
            color: #333;
          }
        }

        .inventory-input-field {
          width: 100%;
          max-width: 200px;
        }

        .product-usage-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e0e0e0;

          .section-title {
            font-size: 0.75rem;
            color: #666;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
            text-align: center;
          }

          .product-images-grid {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 0.5rem;

            .product-item {
              position: relative;

              .product-image {
                width: 32px;
                height: 32px;
                object-fit: cover;
                border-radius: 4px;
                border: 1px solid #e0e0e0;
                cursor: help;
                transition: transform 0.2s ease;

                &:hover {
                  transform: scale(1.1);
                  border-color: #1976d2;
                }
              }

              .product-placeholder {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #f5f5f5;
                border-radius: 4px;
                border: 1px solid #e0e0e0;
                cursor: help;

                mat-icon {
                  font-size: 16px;
                  color: #999;
                }
              }
            }
          }
        }
      }

      .navigation-section {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;

        button {
          flex: 1;
          min-width: 0;

          &:first-child,
          &:last-child {
            flex: 0.8;
          }

          mat-icon {
            font-size: 18px;
            margin: 0 2px;
          }
        }
      }

      .finish-section {
        text-align: center;

        button {
          width: 100%;

          mat-icon {
            margin-right: 0.5rem;
          }
        }
      }
    }

    /* Mobile Anpassungen */
    @media (max-width: 768px) {
      .inventory-navigator {
        position: relative;
        top: auto;
        right: auto;
        width: 100%;
        margin: 1rem 0;

        .navigation-section {
          flex-direction: column;

          button {
            width: 100%;
          }
        }
      }
    }

    @media (max-width: 480px) {
      .inventory-navigator {
        .material-section {
          .material-image-container {
            .material-image,
            .no-image-placeholder {
              width: 80px;
              height: 80px;
            }
          }
        }
      }
    }
  `]
})
export class InventoryNavigatorComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isVisible = false;
  @Input() currentMaterial: MaterialStockMaterial | null = null;
  @Input() inventoryCount: number | undefined = undefined;
  @Input() canGoToNext = false;
  @Input() canGoToPrevious = false;

  @Output() navigation = new EventEmitter<NavigationEvent>();
  @Output() saveAndNext = new EventEmitter<SaveAndNextEvent>();
  @Output() finishInventory = new EventEmitter<void>();
  @Output() inventoryCountChanged = new EventEmitter<number>();

  progress: InventoryProgress = {
    processedCount: 0,
    savedCount: 0,
    totalCount: 0,
    currentIndex: 0,
    progressPercentage: 0
  };

  relatedProducts: Product[] = [];
  shouldFocus = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private inventoryService: InventoryService,
    private productsService: ProductsService
  ) {}

  ngOnInit(): void {
    // Subscribe to inventory state changes for progress tracking
    this.subscription.add(
      this.inventoryService.state$.subscribe(() => {
        this.progress = this.inventoryService.getProgress();
        this.shouldFocus = this.isVisible;
        this.loadRelatedProducts();
      })
    );
  }

  ngOnChanges(): void {
    // Reload products when current material changes
    if (this.currentMaterial) {
      this.loadRelatedProducts();
    }
  }

  private loadRelatedProducts(): void {
    if (!this.currentMaterial) {
      this.relatedProducts = [];
      return;
    }

    this.subscription.add(
      this.productsService.getProductsUsingMaterial(this.currentMaterial.id).subscribe({
        next: (products) => {
          this.relatedProducts = products;
        },
        error: (error) => {
          console.error('Fehler beim Laden der Produktinformationen:', error);
          this.relatedProducts = [];
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onNavigate(direction: 'next' | 'previous'): void {
    this.navigation.emit({ direction });
  }

  onSaveAndNext(): void {
    if (this.currentMaterial && this.inventoryCount !== undefined && this.inventoryCount >= 0) {
      this.saveAndNext.emit({
        materialId: this.currentMaterial.id,
        materialName: this.currentMaterial.bezeichnung,
        inventoryCount: this.inventoryCount
      });
    }
  }

  onFinishInventory(): void {
    this.finishInventory.emit();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSaveAndNext();
    } else if (event.key === 'ArrowRight' || event.key === 'Tab') {
      event.preventDefault();
      this.onNavigate('next');
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.onNavigate('previous');
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
    }
  }

  onProductImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
    }
  }
}
