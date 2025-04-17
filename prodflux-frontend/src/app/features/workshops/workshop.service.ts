import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Workshop {
  id: number;
  name: string;
}

export interface MaterialStockEntry {
  material_id: number;
  bezeichnung: string;
  bestand: number;
  bild_url?: string;
}

export interface ProductLifecycleEntry {
  product_id: number;
  product: string;
  bestellungen_moeglich: number;
  lager_fertigung_moeglich: number;
  bestand_fertig: number;
  verkauft: number;
}

export interface MaterialRequirement {
  material_id: number;
  bezeichnung: string;
  required_quantity: number;
  available_quantity: number;
  ordered_quantity: number;
  missing_quantity: number;
}

@Injectable({ providedIn: 'root' })
export class WorkshopService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api`;


  getAll(): Observable<Workshop[]> {
    return this.http.get<Workshop[]>(`${this.baseUrl}/workshops/`);
  }

  getStock(workshopId: number): Observable<MaterialStockEntry[]> {
    return this.http.get<MaterialStockEntry[]>(`${this.baseUrl}/workshops/${workshopId}/material-stock/`);
  }

  getLifecycleOverview(workshopId: number): Observable<ProductLifecycleEntry[]> {
    return this.http.get<ProductLifecycleEntry[]>(`${this.baseUrl}/products/lifecycle-overview/?workshop_id=${workshopId}`);
  }

  getAggregatedRequirements(workshopId: number, products: { product_id: number; quantity: number }[]): Observable<MaterialRequirement[]> {
    return this.http.post<MaterialRequirement[]>(`${this.baseUrl}/material-requirements/`, {
      workshop_id: workshopId,
      products
    });
  }


  manufactureProduct(payload: {
    product_id: number;
    workshop_id: number;
    quantity: number;
  }) {
    return this.http.post(`${this.baseUrl}/manufacture/`, payload);
  }

  getSingleProductRequirements(
    productId: number,
    quantity: number,
    workshopId: number
  ): Observable<MaterialRequirement[]> {
    const url = `${this.baseUrl}/products/${productId}/requirements/?quantity=${quantity}&workshop_id=${workshopId}`;
    return this.http.get<MaterialRequirement[]>(url);
  }
}
