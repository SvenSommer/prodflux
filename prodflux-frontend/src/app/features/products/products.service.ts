// src/app/features/products/products.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  bezeichnung: string;
  menge: number;
  preis: number;
  g_preis_brutto: number;
  netto: number;
}

export interface ProductMaterial {
  id?: number;
  product: number;
  material: number;
  quantity_per_unit: number;
  material_info?: {
    id: number;
    bezeichnung: string;
  }
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8000/api';

  createProduct(data: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/products/`, data);
  }

  updateProduct(id: number, data: Omit<Product, 'id'>): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/products/${id}/`, data);
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products/`);
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/products/${id}/`);
  }

  deleteProduct(id: number) {
    return this.http.delete(`${this.baseUrl}/products/${id}/`);
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
