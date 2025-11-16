import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MaterialStockMaterial } from '../workshop.service';

export interface InventoryState {
  isActive: boolean;
  isNavigationMode: boolean;
  currentMaterialIndex: number;
  allMaterials: MaterialStockMaterial[];
  processedMaterialIds: Set<number>;
  savedMaterialIds: Set<number>;
  inventoryCounts: { [materialId: number]: number };
}

export interface InventoryProgress {
  processedCount: number;
  savedCount: number;
  totalCount: number;
  currentIndex: number;
  progressPercentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private initialState: InventoryState = {
    isActive: false,
    isNavigationMode: false,
    currentMaterialIndex: 0,
    allMaterials: [],
    processedMaterialIds: new Set<number>(),
    savedMaterialIds: new Set<number>(),
    inventoryCounts: {}
  };

  private stateSubject = new BehaviorSubject<InventoryState>(this.initialState);

  // Public observables
  state$ = this.stateSubject.asObservable();

  get currentState(): InventoryState {
    return this.stateSubject.value;
  }

  // Inventur initialisieren
  initializeInventory(materials: MaterialStockMaterial[]): void {
    const inventoryCounts: { [materialId: number]: number } = {};

    // Aktuelle Bestände als Standardwerte setzen
    materials.forEach(material => {
      inventoryCounts[material.id] = material.bestand || 0;
    });

    this.updateState({
      ...this.initialState,
      isActive: true,
      allMaterials: materials,
      inventoryCounts
    });
  }

  // Inventur zurücksetzen
  resetInventory(): void {
    this.stateSubject.next(this.initialState);
  }

  // Navigation starten
  startNavigation(): void {
    const currentState = this.currentState;
    if (currentState.allMaterials.length === 0) {
      throw new Error('Keine Materialien zum Inventarisieren gefunden.');
    }

    this.updateState({
      ...currentState,
      isNavigationMode: true,
      currentMaterialIndex: 0,
      processedMaterialIds: new Set([currentState.allMaterials[0]?.id]),
      savedMaterialIds: new Set()
    });
  }

  // Navigation beenden
  finishNavigation(): void {
    const currentState = this.currentState;
    this.updateState({
      ...currentState,
      isNavigationMode: false
    });
  }

  // Zum nächsten Material
  goToNext(): boolean {
    const currentState = this.currentState;
    if (currentState.currentMaterialIndex < currentState.allMaterials.length - 1) {
      const newIndex = currentState.currentMaterialIndex + 1;
      const newProcessedIds = new Set(currentState.processedMaterialIds);
      newProcessedIds.add(currentState.allMaterials[newIndex].id);

      this.updateState({
        ...currentState,
        currentMaterialIndex: newIndex,
        processedMaterialIds: newProcessedIds
      });
      return true;
    }
    return false;
  }

  // Zum vorherigen Material
  goToPrevious(): boolean {
    const currentState = this.currentState;
    if (currentState.currentMaterialIndex > 0) {
      const newIndex = currentState.currentMaterialIndex - 1;
      const newProcessedIds = new Set(currentState.processedMaterialIds);
      newProcessedIds.add(currentState.allMaterials[newIndex].id);

      this.updateState({
        ...currentState,
        currentMaterialIndex: newIndex,
        processedMaterialIds: newProcessedIds
      });
      return true;
    }
    return false;
  }

  // Inventurzählung setzen
  setInventoryCount(materialId: number, count: number): void {
    const currentState = this.currentState;
    this.updateState({
      ...currentState,
      inventoryCounts: {
        ...currentState.inventoryCounts,
        [materialId]: count
      }
    });
  }

  // Material als gespeichert markieren
  markMaterialAsSaved(materialId: number): void {
    const currentState = this.currentState;
    const newSavedIds = new Set(currentState.savedMaterialIds);
    newSavedIds.add(materialId);

    this.updateState({
      ...currentState,
      savedMaterialIds: newSavedIds
    });
  }

  // Material als nicht gespeichert markieren (bei Fehler)
  unmarkMaterialAsSaved(materialId: number): void {
    const currentState = this.currentState;
    const newSavedIds = new Set(currentState.savedMaterialIds);
    newSavedIds.delete(materialId);

    this.updateState({
      ...currentState,
      savedMaterialIds: newSavedIds
    });
  }

  // Aktuelles Material abrufen
  getCurrentMaterial(): MaterialStockMaterial | null {
    const currentState = this.currentState;
    return currentState.allMaterials[currentState.currentMaterialIndex] || null;
  }

  // Fortschritt berechnen
  getProgress(): InventoryProgress {
    const currentState = this.currentState;
    const processedCount = currentState.processedMaterialIds.size;
    const savedCount = currentState.savedMaterialIds.size;
    const totalCount = currentState.allMaterials.length;

    return {
      processedCount,
      savedCount,
      totalCount,
      currentIndex: currentState.currentMaterialIndex,
      progressPercentage: totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0
    };
  }

  // Navigation möglich?
  canGoToNext(): boolean {
    const currentState = this.currentState;
    return currentState.currentMaterialIndex < currentState.allMaterials.length - 1;
  }

  canGoToPrevious(): boolean {
    const currentState = this.currentState;
    return currentState.currentMaterialIndex > 0;
  }

  // Fortschritt als String
  getProgressString(): string {
    const progress = this.getProgress();
    if (progress.totalCount === 0) return '0/0';
    return `${progress.currentIndex + 1}/${progress.totalCount}`;
  }

  // Private helper method
  private updateState(newState: InventoryState): void {
    this.stateSubject.next(newState);
  }
}
