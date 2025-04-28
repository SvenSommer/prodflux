import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Workshop {
  id: number;
  name: string;
}

export interface MaterialStockMaterial {
  id: number;
  bezeichnung: string;
  hersteller_bezeichnung: string;
  bestell_nr: string;
  bild_url: string | null;
  bestand: number; // Aus current_stock
  alternatives: number[];
}

export interface MaterialStockGroup {
  category_id: number | null;
  category_name: string;
  materials: MaterialStockMaterial[];
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

export interface MaterialRequirementGroup {
  category_id: number;
  category_name: string;
  materials: MaterialRequirementExtended[];
}

export interface MaterialRequirementExtended {
  id: number;
  bezeichnung: string;
  hersteller_bezeichnung: string;
  bestell_nr: string;
  bild_url: string | null;
  required_quantity: number;
  ordered_quantity: number;
  available_quantity: number;
  missing_quantity: number;
}

@Injectable({ providedIn: 'root' })
export class WorkshopService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api`;


  getAll(): Observable<Workshop[]> {
    return this.http.get<Workshop[]>(`${this.baseUrl}/workshops/`);
  }

  getStock(workshopId: number): Observable<MaterialStockGroup[]> {
    return this.http.get<any[]>(`${this.baseUrl}/workshops/${workshopId}/material-stock/`).pipe(
      tap((response) => {
        console.log('[WorkshopService] Material-Stock API Response:', response);
      }),
      map((response) => {
        // Das Backend liefert bereits Gruppen, wir müssen sie nur mappen
        const mappedGroups: MaterialStockGroup[] = response.map(group => ({
          category_id: group.category_id,
          category_name: group.category_name,
          materials: group.materials.map((mat: any) => ({
            id: mat.id,
            bezeichnung: mat.bezeichnung,
            hersteller_bezeichnung: mat.hersteller_bezeichnung,
            bestell_nr: mat.bestell_nr,
            bild_url: mat.bild_url ?? null,
            bestand: mat.current_stock ?? 0,  // 🛠 Hier musst du aufpassen, evtl. heißt das anders
            alternatives: mat.alternatives ?? [],
          }))
        }));

        console.log('[WorkshopService] Mapped MaterialStockGroups:', mappedGroups);
        return mappedGroups;
      })
    );
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


}
