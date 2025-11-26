import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Workshop } from '../models/api/workshop.model';
import { Product } from '../models/api/product.model';
import { Material } from '../models/api/material.model';
import { ProductMaterial } from '../models/api/product-material.model';

export interface MaterialPlanningLookups {
  workshopById: Record<number, Workshop>;
  productById: Record<number, Product>;
  materialById: Record<number, Material>;
}

export type StockByWorkshopAndMaterial = Record<number, Record<number, number>>;
// => stockByWorkshopAndMaterial[workshopId][materialId] = quantity

export interface MaterialPlanningData {
  workshops: Workshop[];
  products: Product[];
  materials: Material[];
  bom: ProductMaterial[];
  lookups: MaterialPlanningLookups;
  stockByWorkshopAndMaterial: StockByWorkshopAndMaterial;
}

interface MaterialStockGroup {
  category_id: number | null;
  category_name: string;
  materials: {
    id: number;
    current_stock: number;
  }[];
}

@Injectable({ providedIn: 'root' })
export class MaterialPlanningDataService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api`;

  /**
   * Lädt alle erforderlichen Daten für die Materialplanung
   */
  loadAll(): Observable<MaterialPlanningData> {
    // 1. Lade Stammdaten parallel
    return forkJoin({
      workshops: this.http.get<Workshop[]>(`${this.baseUrl}/workshops/`),
      products: this.http.get<Product[]>(`${this.baseUrl}/products/`),
      materials: this.http.get<Material[]>(`${this.baseUrl}/materials/`),
      bom: this.http.get<ProductMaterial[]>(`${this.baseUrl}/product-materials/`)
    }).pipe(
      // 2. Lade Material-Stocks für alle Workshops
      switchMap(baseData => {
        // Stock-Requests für jeden Workshop
        const stockRequests = baseData.workshops.map(workshop =>
          this.loadWorkshopStock(workshop.id).pipe(
            catchError(error => {
              console.warn(`Failed to load stock for workshop ${workshop.id}:`, error);
              return of({ workshopId: workshop.id, stockByMaterial: {} });
            })
          )
        );

        // Wenn keine Workshops vorhanden, gebe leere Stock-Daten zurück
        if (stockRequests.length === 0) {
          return of({
            ...baseData,
            stockByWorkshopAndMaterial: {}
          });
        }

        return forkJoin(stockRequests).pipe(
          map(stockResults => {
            // Baue stockByWorkshopAndMaterial
            const stockByWorkshopAndMaterial: StockByWorkshopAndMaterial = {};
            stockResults.forEach(result => {
              stockByWorkshopAndMaterial[result.workshopId] = result.stockByMaterial;
            });

            return {
              ...baseData,
              stockByWorkshopAndMaterial
            };
          })
        );
      }),
      // 3. Baue Lookups
      map(data => ({
        ...data,
        lookups: {
          workshopById: this.toRecordById(data.workshops),
          productById: this.toRecordById(data.products),
          materialById: this.toRecordById(data.materials)
        }
      }))
    );
  }

  /**
   * Lädt Material-Stock für einen Workshop
   * Basierend auf dem tatsächlichen API-Format (grouped by category)
   */
  private loadWorkshopStock(workshopId: number): Observable<{
    workshopId: number;
    stockByMaterial: Record<number, number>;
  }> {
    return this.http.get<MaterialStockGroup[]>(
      `${this.baseUrl}/workshops/${workshopId}/material-stock/`
    ).pipe(
      map(groups => {
        const stockByMaterial: Record<number, number> = {};

        // Iteriere über alle Kategorien und Materialien
        groups.forEach(group => {
          group.materials.forEach(material => {
            stockByMaterial[material.id] = material.current_stock || 0;
          });
        });

        return {
          workshopId,
          stockByMaterial
        };
      })
    );
  }

  /**
   * Helper: Wandelt Array in Record um (indexed by id)
   */
  private toRecordById<T extends { id: number }>(items: T[]): Record<number, T> {
    const record: Record<number, T> = {};
    items.forEach(item => {
      record[item.id] = item;
    });
    return record;
  }
}
