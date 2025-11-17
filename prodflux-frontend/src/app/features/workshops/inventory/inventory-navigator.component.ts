import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MaterialUsageComponent } from '../../../shared/components/material-usage/material-usage.component';
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
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MaterialUsageComponent
  ],
  template: `
    <mat-card class="inventory-navigator" *ngIf="isVisible">
      <mat-card-content>
        <!-- Header mit Fortschrittsanzeige -->
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

        <!-- Material-Info-Container -->
        <div class="material-info-container" *ngIf="currentMaterial">
          <!-- Linke Seite: Material-Details -->
          <div class="material-left-section">
            <div class="material-header">
              <a
                [routerLink]="['/materials', currentMaterial.id]"
                class="material-link"
              >
                <h4 class="material-name">{{ currentMaterial.bezeichnung }}</h4>
              </a>
            </div>

            <!-- Material Bild -->
            <div class="material-image-container">
              <a
                *ngIf="currentMaterial.bild_url"
                [routerLink]="['/materials', currentMaterial.id]"
                class="material-image-link"
              >
                <img
                  [src]="currentMaterial.bild_url"
                  [alt]="currentMaterial.bezeichnung"
                  class="material-image"
                  (error)="onImageError($event)"
                />
              </a>
              <a
                *ngIf="!currentMaterial.bild_url"
                [routerLink]="['/materials', currentMaterial.id]"
                class="material-image-link"
              >
                <div class="no-image-placeholder">
                  <mat-icon>image_not_supported</mat-icon>
                </div>
              </a>
            </div>

            <!-- Bestandsinfo -->
            <div class="stock-info">
              <span>Aktueller Bestand: <strong>{{ currentMaterial.bestand }}</strong></span>
            </div>
          </div>

          <!-- Rechte Seite: Produktinformationen -->
          <div class="material-right-section">
            <div class="product-usage-section">
              <app-material-usage [materialId]="currentMaterial ? currentMaterial.id : null"></app-material-usage>
            </div>
          </div>
        </div>

        <!-- Inventur Eingabe -->
        <div class="inventory-input-section" *ngIf="currentMaterial">
          <mat-form-field appearance="outline" class="inventory-input-field">
            <mat-label>Gezählte Menge</mat-label>
            <input
              #inventoryInput
              matInput
              type="number"
              min="0"
              [(ngModel)]="inventoryCount"
              (ngModelChange)="onInventoryCountChange($event)"
              (keydown)="onInputKeyPress($event)"
              (focus)="onInputFocus($event)"
              placeholder="Eingeben..."
            />
            <mat-hint>Enter = Speichern & Weiter</mat-hint>
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
            class="save-button"
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
      bottom: 20px;
      right: 20px;
      width: 40vw;
      min-width: 450px;
      max-width: 600px;
      height: 50vh;
      min-height: 500px;
      max-height: calc(100vh - 60px);
      z-index: 1000;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      mat-card-content {
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 1.5rem;
        overflow-y: auto;
      }

      .progress-section {
        margin-bottom: 1.5rem;
        flex-shrink: 0;

        .progress-text {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.75rem;
          text-align: center;
          font-weight: 500;
        }

        .progress-bar {
          height: 8px;
          border-radius: 4px;
        }
      }

      .material-info-container {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 1.5rem;
        flex: 1;
        min-height: 0;
      }

      .material-left-section {
        flex: 1;
        min-width: 0;

        .material-header {
          margin-bottom: 1rem;

          .material-name {
            margin: 0 0 0.5rem 0;
            font-size: 1.1rem;
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
            background: #f5f5f5;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            display: inline-block;
          }
        }

        .material-image-container {
          margin-bottom: 1rem;

          .material-image {
            width: 120px;
            height: 120px;
            object-fit: contain;
            background-color: #f5f5f5;
            padding: 8px;
            border-radius: 12px;
            border: 2px solid #e0e0e0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .no-image-placeholder {
            width: 120px;
            height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f5f5f5;
            border-radius: 12px;
            border: 2px solid #e0e0e0;

            mat-icon {
              font-size: 48px;
              color: #999;
            }
          }
        }

        .stock-info {
          font-size: 0.9rem;
          color: #666;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #1976d2;

          strong {
            color: #333;
            font-weight: 600;
          }
        }
      }

      .material-right-section {
        flex: 1;
        min-width: 0;
        /* Wichtig: overflow visible damit Badge nicht abgeschnitten wird */
        overflow: visible;

        .product-usage-section {
          height: 100%;
          display: flex;
          flex-direction: column;
          /* Wichtig: overflow visible damit Badge nicht abgeschnitten wird */
          overflow: visible;

          .section-title {
            font-size: 0.875rem;
            color: #666;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e0e0e0;
          }

          .product-images-container {
            flex: 1;

            .product-images-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
              gap: 0.75rem;
              align-content: start;

              .product-item {
                position: relative;

                .product-image-container {
                  position: relative;
                  display: inline-block;
                }

                .product-image {
                  width: 48px;
                  height: 48px;
                  object-fit: contain;
                  background-color: #f9f9f9;
                  padding: 2px;
                  border-radius: 8px;
                  border: 2px solid #e0e0e0;
                  cursor: help;
                  transition: all 0.2s ease;
                  display: block;

                  &:hover {
                    transform: scale(1.05);
                    border-color: #1976d2;
                    box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
                  }
                }

                .product-placeholder {
                  width: 48px;
                  height: 48px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background-color: #f5f5f5;
                  border-radius: 8px;
                  border: 2px solid #e0e0e0;
                  cursor: help;
                  transition: all 0.2s ease;

                  &:hover {
                    background-color: #eeeeee;
                    border-color: #1976d2;
                  }

                  mat-icon {
                    font-size: 24px;
                    color: #999;
                  }
                }

                .usage-badge {
                  position: absolute;
                  top: -6px;
                  right: -6px;
                  background: #ff5722;
                  color: white;
                  font-size: 0.65rem;
                  font-weight: 600;
                  padding: 2px 4px;
                  border-radius: 8px;
                  min-width: 16px;
                  text-align: center;
                  line-height: 1;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                  z-index: 1;
                }
              }
            }
          }

          .no-products-info {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 2rem;
            color: #666;
            font-style: italic;
            text-align: center;
            background: #f8f9fa;
            border-radius: 8px;

            mat-icon {
              color: #999;
            }
          }
        }
      }

      .inventory-input-section {
        margin-bottom: 1.5rem;
        flex-shrink: 0;
        display: flex;
        justify-content: center;

        .inventory-input-field {
          width: 100%;
          max-width: none;

          .mat-mdc-form-field-input-control input {
            font-size: 1.2rem;
            font-weight: 600;
            text-align: center;
            background-color: #f8f9fa;
            border-radius: 4px;
          }
        }
      }

      .navigation-section {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1rem;
        flex-shrink: 0;

        button {
          flex: 1;
          min-width: 0;
          height: 48px;

          &:first-child,
          &:last-child {
            flex: 0.8;
          }

          &.save-button {
            flex: 1.4;
          }

          mat-icon {
            font-size: 20px;
            margin: 0 4px;
          }
        }
      }

      .finish-section {
        text-align: center;
        flex-shrink: 0;

        button {
          width: 100%;
          height: 44px;

          mat-icon {
            margin-right: 0.5rem;
          }
        }
      }
    }

    /* Tablet Anpassungen */
    @media (max-width: 1024px) {
      .inventory-navigator {
        width: 50vw;
        min-width: 400px;

        .material-info-container {
          .material-left-section .material-image-container {
            .material-image,
            .no-image-placeholder {
              width: 100px;
              height: 100px;
            }
            
            .material-image {
              object-fit: contain;
              background-color: #f5f5f5;
              padding: 6px;
            }
          }

          .material-right-section .product-usage-section .product-images-container .product-images-grid {
            grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));

            .product-item {
              .product-image-container {
                .product-image,
                .product-placeholder {
                  width: 40px;
                  height: 40px;
                }
                
                .product-image {
                  object-fit: contain;
                  background-color: #f9f9f9;
                  padding: 2px;
                }

                .usage-badge {
                  font-size: 0.6rem;
                  padding: 1px 3px;
                  top: -5px;
                  right: -5px;
                }
              }
            }
          }
        }
      }
    }

    /* Mobile Anpassungen */
    @media (max-width: 768px) {
      .inventory-navigator {
        position: relative;
        bottom: auto;
        right: auto;
        width: 100%;
        height: auto;
        min-height: auto;
        max-height: calc(100vh - 40px);
        margin: 1rem 0;
        border-radius: 8px;

        mat-card-content {
          overflow-y: auto;
        }

        .material-info-container {
          flex-direction: column;
          gap: 1rem;
        }

        .material-left-section {
          text-align: center;

          .material-image-container {
            .material-image,
            .no-image-placeholder {
              width: 100px;
              height: 100px;
            }
            
            .material-image {
              object-fit: contain;
              background-color: #f5f5f5;
              padding: 6px;
            }
          }
        }

        .material-right-section .product-usage-section .product-images-container .product-images-grid {
          justify-items: center;
        }

        .navigation-section {
          flex-direction: column;
          gap: 0.5rem;

          button {
            width: 100%;
            flex: none;
          }
        }
      }
    }

    @media (max-width: 480px) {
      .inventory-navigator {
        mat-card-content {
          padding: 1rem;
        }

        .material-left-section .material-image-container {
          .material-image,
          .no-image-placeholder {
            width: 80px;
            height: 80px;
          }
          
          .material-image {
            object-fit: contain;
            background-color: #f5f5f5;
            padding: 4px;
          }
        }

        .material-right-section .product-usage-section .product-images-container .product-images-grid {
          grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));

          .product-item {
            .product-image-container {
              .product-image,
              .product-placeholder {
                width: 36px;
                height: 36px;
              }
              
              .product-image {
                object-fit: contain;
                background-color: #f9f9f9;
                padding: 1px;
              }

              .usage-badge {
                font-size: 0.55rem;
                padding: 1px 2px;
                top: -4px;
                right: -4px;
                min-width: 14px;
              }
            }
          }
        }
      }
    }

    /* Niedrige Bildschirmhöhen - Kompakterer Dialog */
    @media (max-height: 700px) {
      .inventory-navigator {
        height: calc(100vh - 40px);
        max-height: calc(100vh - 40px);
        min-height: 400px;
        bottom: 20px;

        mat-card-content {
          padding: 1rem;
        }

        .progress-section {
          margin-bottom: 1rem;
        }

        .material-info-container {
          margin-bottom: 1rem;
          flex-direction: column;
          gap: 1rem;
        }

        .material-left-section .material-image-container {
          .material-image,
          .no-image-placeholder {
            width: 80px;
            height: 80px;
          }
          
          .material-image {
            padding: 4px;
          }
        }

        .inventory-input-section {
          margin-bottom: 1rem;
        }

        .navigation-section {
          margin-bottom: 0.5rem;
        }
      }
    }

    @media (max-height: 600px) {
      .inventory-navigator {
        height: calc(100vh - 20px);
        min-height: 350px;
        bottom: 10px;

        .material-info-container {
          .material-left-section .material-image-container {
            .material-image,
            .no-image-placeholder {
              width: 60px;
              height: 60px;
            }
          }

          .material-right-section .product-usage-section .product-images-container .product-images-grid {
            grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));

            .product-item .product-image-container {
              .product-image,
              .product-placeholder {
                width: 32px;
                height: 32px;
              }
            }
          }
        }

        .navigation-section button {
          height: 40px;
          font-size: 0.875rem;
        }

        .finish-section button {
          height: 36px;
          font-size: 0.875rem;
        }
      }
    }

    @media (max-height: 500px) {
      .inventory-navigator {
        height: calc(100vh - 10px);
        min-height: 300px;
        bottom: 5px;

        mat-card-content {
          padding: 0.75rem;
        }
      }
    }

    /* Custom Tooltip Styles */
    :global(.product-tooltip) {
      font-size: 0.875rem;
      max-width: 200px;
      white-space: normal;
      text-align: center;
    }

    /* Material Links */
    .material-link {
      color: #2196F3;
      text-decoration: none;
      transition: color 0.2s ease;

      &:hover {
        color: #1976D2;
        text-decoration: underline;
      }
    }

    .material-image-link {
      display: block;
      transition: transform 0.2s ease;

      &:hover {
        transform: scale(1.02);
      }
    }
  `]
})
export class InventoryNavigatorComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @ViewChild('inventoryInput') inventoryInput!: ElementRef<HTMLInputElement>;
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
  productMaterialUsage: { [productId: number]: number } = {};
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
      // Fokussiert das Input-Feld bei Material-Wechsel
      this.focusInventoryInput();
    }
  }

  private loadRelatedProducts(): void {
    if (!this.currentMaterial) {
      console.log('❌ Kein currentMaterial vorhanden');
      this.relatedProducts = [];
      this.productMaterialUsage = {};
      return;
    }

    console.log('🔄 Lade Produkte für Material:', this.currentMaterial.id, this.currentMaterial.bezeichnung);

    this.subscription.add(
      this.productsService.getProductsUsingMaterial(this.currentMaterial.id).subscribe({
        next: (products) => {
          console.log('📦 Produkte erhalten:', products);
          this.relatedProducts = products;
          this.loadProductMaterialUsage();
        },
        error: (error) => {
          console.error('❌ Fehler beim Laden der Produktinformationen:', error);
          this.relatedProducts = [];
          this.productMaterialUsage = {};
        }
      })
    );
  }

  private loadProductMaterialUsage(): void {
    if (!this.currentMaterial) return;

    console.log('🔍 Lade Verbrauchsdaten für Material:', this.currentMaterial.id, this.currentMaterial.bezeichnung);
    console.log('📋 Relevante Produkte:', this.relatedProducts.map(p => ({ id: p.id, name: p.bezeichnung })));

    // Hauptstrategie: Lade alle ProductMaterials und filtere sie clientseitig
    console.log('🔄 Lade alle ProductMaterials...');
    this.subscription.add(
      this.productsService.getAllProductMaterials().subscribe({
        next: (allProductMaterials: any[]) => {
          console.log('📊 Alle ProductMaterials erhalten:', allProductMaterials);

          // Filtere nach aktuellem Material
          const relevantMaterials = allProductMaterials.filter((pm: any) => pm.material === this.currentMaterial!.id);
          console.log('🎯 Relevante ProductMaterials für Material', this.currentMaterial!.id, ':', relevantMaterials);

          // Erstelle Mapping
          this.productMaterialUsage = {}; // Reset
          relevantMaterials.forEach((pm: any) => {
            console.log('🔗 Mapping:', `Product ${pm.product} → ${pm.quantity_per_unit}x`);
            this.productMaterialUsage[pm.product] = pm.quantity_per_unit;
          });

          console.log('💾 Finale productMaterialUsage Map:', this.productMaterialUsage);
        },
        error: (error: any) => {
          console.error('❌ Fehler beim Laden aller ProductMaterials:', error);
          // Fallback auf Standard-Werte
          this.relatedProducts.forEach(product => {
            this.productMaterialUsage[product.id] = 1; // Standard: 1 Stück pro Produkt
          });
          console.log('⚠️ Fallback: Verwende 1x für alle Produkte');
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
      const saveEvent = {
        materialId: this.currentMaterial.id,
        materialName: this.currentMaterial.bezeichnung,
        inventoryCount: this.inventoryCount
      };

      this.saveAndNext.emit(saveEvent);
    }
  }

  onFinishInventory(): void {
    this.finishInventory.emit();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Nur aktiv wenn der Dialog sichtbar ist
    if (!this.isVisible) {
      return;
    }

    // Pfeiltasten-Navigation (immer aktiv im Dialog)
    if (event.key === 'ArrowRight') {
      // Nur navigieren wenn wir nicht am Ende sind
      if (this.canGoToNext) {
        event.preventDefault();
        this.onNavigate('next');
      }
    } else if (event.key === 'ArrowLeft') {
      // Nur navigieren wenn wir nicht am Anfang sind
      if (this.canGoToPrevious) {
        event.preventDefault();
        this.onNavigate('previous');
      }
    }
  }

  onInputKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSaveAndNext();
    }
  }

  onInventoryCountChange(count: number): void {
    this.inventoryCountChanged.emit(count);
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  getProductTooltip(product: Product): string {
    const productName = product.bezeichnung || 'Unbekanntes Produkt';
    const usage = this.productMaterialUsage[product.id];

    if (usage !== undefined && usage > 0) {
      const usageText = usage === 1 ? '1 Stück' : `${usage} Stück`;
      return `${productName}\nVerbrauch: ${usageText} pro Produkt`;
    }

    return productName;
  }

  getProductUsage(productId: number): number | null {
    const usage = this.productMaterialUsage[productId];
    console.log('🏷️ getProductUsage für Produkt', productId, '→ Verbrauch:', usage, 'Map:', this.productMaterialUsage);

    // Sicherstellen, dass wir eine Zahl haben
    const numericUsage = usage !== undefined ? Number(usage) : null;
    return (numericUsage !== null && numericUsage > 0) ? numericUsage : null;
  }

  formatUsage(value: number): string {
    // Prüfe, ob die Zahl eine Ganzzahl ist
    if (Number.isInteger(value)) {
      return `${Math.round(value)}x`;
    }

    // Für Dezimalzahlen: maximal 2 Nachkommastellen
    const formatted = Number(value.toFixed(2));

    // Wenn nach dem Runden wieder eine Ganzzahl entsteht
    if (Number.isInteger(formatted)) {
      return `${formatted}x`;
    }

    return `${formatted}x`;
  }

  ngAfterViewInit(): void {
    // Fokussiert das Input-Feld nach der View-Initialisierung
    this.focusInventoryInput();
  }

  private focusInventoryInput(): void {
    // Timeout wird benötigt, damit das DOM vollständig geladen ist
    setTimeout(() => {
      if (this.inventoryInput && this.isVisible) {
        const inputElement = this.inventoryInput.nativeElement;
        inputElement.focus();
        if (inputElement.value) {
          inputElement.select();
        }
      }
    }, 100);
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

  onInputFocus(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.value) {
      // Selektiert den gesamten Text im Input-Feld
      input.select();
    }
  }
}
