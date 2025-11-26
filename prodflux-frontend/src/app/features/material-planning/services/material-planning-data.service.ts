import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Workshop } from '../models/api/workshop.model';
import { Product } from '../models/api/product.model';
import { Material } from '../models/api/material.model';
import { ProductMaterial } from '../models/api/product-material.model';
import { Order } from '../models/api/order.model';

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
  orders: Order[];
  openOrdersByMaterialId: Record<number, number>;
}

interface MaterialStockGroup {
  category_id: number | null;
  category_name: string;
  materials: {
    id: number;
    current_stock: number;
  }[];
}

interface MaterialCategoryResponse {
  category_id: number | null;
  category_name: string;
  materials: Material[];
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
      materialsGrouped: this.http.get<MaterialCategoryResponse[]>(`${this.baseUrl}/materials/`),
      bom: this.http.get<ProductMaterial[]>(`${this.baseUrl}/product-materials/`),
      orders: this.http.get<Order[]>(`${this.baseUrl}/orders/`).pipe(
        catchError(error => {
          console.warn('Failed to load orders:', error);
          return of([]);
        })
      )
    }).pipe(
      // Flatten materials from grouped structure
      map(data => ({
        ...data,
        materials: this.flattenMaterialsFromGroups(data.materialsGrouped)
      })),
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
      // 3. Baue Lookups + compute openOrdersByMaterialId
      map(data => ({
        ...data,
        lookups: {
          workshopById: this.toRecordById(data.workshops),
          productById: this.toRecordById(data.products),
          materialById: this.toRecordById(data.materials)
        },
        openOrdersByMaterialId: computeOpenOrdersByMaterialId(data.orders)
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

  /**
   * Helper: Extrahiert Materialien aus der gruppierten API-Response
   */
  private flattenMaterialsFromGroups(groups: MaterialCategoryResponse[]): Material[] {
    const materials: Material[] = [];
    groups.forEach(group => {
      materials.push(...group.materials);
    });
    return materials;
  }
}

/**
 * Computes open orders by material ID
 * Open orders are orders where angekommen_am is null
 * Returns a map of materialId -> total open quantity
 */
export function computeOpenOrdersByMaterialId(orders: Order[]): Record<number, number> {
  const result: Record<number, number> = {};

  // Filter for open orders (angekommen_am === null)
  const openOrders = orders.filter(order => order.angekommen_am === null);

  // Sum up quantities per material
  openOrders.forEach(order => {
    order.items.forEach(item => {
      const materialId = item.material;
      const quantity = parseDecimal(item.quantity);

      if (!result[materialId]) {
        result[materialId] = 0;
      }
      result[materialId] += quantity;
    });
  });

  return result;
}

/**
 * Safely parses a decimal string to a number
 * Returns 0 if parsing fails
 */
function parseDecimal(value: string | number): number {
  if (typeof value === 'number') {
    return value;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}
