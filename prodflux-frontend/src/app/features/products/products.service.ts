// src/app/features/products/products.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MaterialCategoryGroup } from '../materials/materials.service';
import { MaterialRequirementGroup } from '../workshops/workshop.service';

export interface Product {
  id: number;
  bezeichnung: string;
  artikelnummer: string;
  bild?: string;
  version?: {
    id: number;
    name: string;
    description?: string;
  };
  varianten?: {
    id: number;
    name: string;
    description?: string;
  }[];
}

export interface ProductMaterial {
  id?: number;
  product: number;
  material: number;
  quantity_per_unit: number;
  material_info?: {
    id: number;
    bezeichnung: string;
  };
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api`;

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products/`);
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/products/${id}/`);
  }

  deleteProduct(id: number) {
    return this.http.delete(`${this.baseUrl}/products/${id}/`);
  }

  /**
   * Produkt anlegen (ohne oder mit Bild)
   */
  createProduct(data: { bezeichnung: string; artikelnummer: string; version?: string; bild?: File }): Observable<Product> {
    if (data.bild) {
      const formData = new FormData();
      formData.append('bezeichnung', data.bezeichnung);
      formData.append('artikelnummer', data.artikelnummer);
      if (data.version) formData.append('version', data.version);
      formData.append('bild', data.bild);
      return this.http.post<Product>(`${this.baseUrl}/products/`, formData);
    } else {
      return this.http.post<Product>(`${this.baseUrl}/products/`, {
        bezeichnung: data.bezeichnung,
        artikelnummer: data.artikelnummer,
        version: data.version ?? '',
      });
    }
  }

  /**
   * Produkt aktualisieren (ohne oder mit Bild)
   */
  updateProduct(id: number, data: { bezeichnung: string; artikelnummer: string; version?: string; bild?: File }): Observable<Product> {
    if (data.bild) {
      const formData = new FormData();
      formData.append('bezeichnung', data.bezeichnung);
      formData.append('artikelnummer', data.artikelnummer);
      if (data.version) formData.append('version', data.version);
      formData.append('bild', data.bild);
      return this.http.put<Product>(`${this.baseUrl}/products/${id}/`, formData);
    } else {
      return this.http.put<Product>(`${this.baseUrl}/products/${id}/`, {
        bezeichnung: data.bezeichnung,
        artikelnummer: data.artikelnummer,
        version: data.version ?? '',
      });
    }
  }

  getProductMaterials(productId: number): Observable<MaterialCategoryGroup[]> {
    return this.http.get<MaterialCategoryGroup[]>(`${this.baseUrl}/products/${productId}/materials/`);
  }

  addProductMaterial(data: ProductMaterial): Observable<ProductMaterial> {
    return this.http.post<ProductMaterial>(`${this.baseUrl}/product-materials/`, data);
  }

  deleteProductMaterial(id: number) {
    return this.http.delete(`${this.baseUrl}/product-materials/${id}/`);
  }

  getMaterialRequirements(productId: number, quantity: number, workshopId: number) {
    return this.http.get<MaterialRequirementGroup[]>(`${this.baseUrl}/products/${productId}/requirements/?quantity=${quantity}&workshop_id=${workshopId}`);
  }
}
