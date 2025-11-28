import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProductManual {
  id: number;
  product_identifier: string;
  language: string;
  language_display: string;
  manual_type: string;
  manual_type_display: string;
  title: string;
  pdf_url: string;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductManualDefaults {
  languages: { code: string; name: string }[];
  manual_types: { code: string; name: string }[];
  common_products: string[];
}

export interface OrderManualsResponse {
  order_id: number;
  country_code: string;
  language: string;
  product_identifiers: string[];
  manuals: ProductManual[];
  manual_count: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductManualService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/shopbridge/product-manuals`;

  getAll(params?: {
    product?: string;
    language?: string;
    type?: string;
    active?: boolean;
  }): Observable<ProductManual[]> {
    const queryParams: string[] = [];
    if (params?.product) queryParams.push(`product=${encodeURIComponent(params.product)}`);
    if (params?.language) queryParams.push(`language=${params.language}`);
    if (params?.type) queryParams.push(`type=${params.type}`);
    if (params?.active !== undefined) queryParams.push(`active=${params.active}`);

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return this.http.get<ProductManual[]>(`${this.baseUrl}/${queryString}`);
  }

  getById(id: number): Observable<ProductManual> {
    return this.http.get<ProductManual>(`${this.baseUrl}/${id}/`);
  }

  create(manual: Partial<ProductManual>): Observable<ProductManual> {
    return this.http.post<ProductManual>(`${this.baseUrl}/`, manual);
  }

  update(id: number, manual: Partial<ProductManual>): Observable<ProductManual> {
    return this.http.patch<ProductManual>(`${this.baseUrl}/${id}/`, manual);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/`);
  }

  getDefaults(): Observable<ProductManualDefaults> {
    return this.http.get<ProductManualDefaults>(`${this.baseUrl}/defaults/`);
  }

  getManualsForOrder(orderId: number): Observable<OrderManualsResponse> {
    return this.http.get<OrderManualsResponse>(`${this.baseUrl}/for-order/${orderId}/`);
  }
}
