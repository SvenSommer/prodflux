// src/app/features/products/products.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  bezeichnung: string;
  artikelnummer: string;
  bild?: string; // optional: URL oder Pfad zur Vorschau
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
  private baseUrl = 'http://localhost:8000/api';

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
  createProduct(data: { bezeichnung: string; artikelnummer: string; bild?: File }): Observable<Product> {
    if (data.bild) {
      const formData = new FormData();
      formData.append('bezeichnung', data.bezeichnung);
      formData.append('artikelnummer', data.artikelnummer);
      formData.append('bild', data.bild);
      return this.http.post<Product>(`${this.baseUrl}/products/`, formData);
    } else {
      return this.http.post<Product>(`${this.baseUrl}/products/`, {
        bezeichnung: data.bezeichnung,
        artikelnummer: data.artikelnummer,
      });
    }
  }

  /**
   * Produkt aktualisieren (ohne oder mit Bild)
   */
  updateProduct(id: number, data: { bezeichnung: string; artikelnummer: string; bild?: File }): Observable<Product> {
    if (data.bild) {
      const formData = new FormData();
      formData.append('bezeichnung', data.bezeichnung);
      formData.append('artikelnummer', data.artikelnummer);
      formData.append('bild', data.bild);
      return this.http.put<Product>(`${this.baseUrl}/products/${id}/`, formData);
    } else {
      return this.http.put<Product>(`${this.baseUrl}/products/${id}/`, {
        bezeichnung: data.bezeichnung,
        artikelnummer: data.artikelnummer,
      });
    }
  }

  getProductMaterials(id: number): Observable<ProductMaterial[]> {
    return this.http.get<ProductMaterial[]>(`${this.baseUrl}/products/${id}/materials/`);
  }

  addProductMaterial(data: ProductMaterial): Observable<ProductMaterial> {
    return this.http.post<ProductMaterial>(`${this.baseUrl}/product-materials/`, data);
  }

  deleteProductMaterial(id: number) {
    return this.http.delete(`${this.baseUrl}/product-materials/${id}/`);
  }
}
