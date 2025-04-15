// variants.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProductVariant {
  id: number;
  name: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class VariantsService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8000/api/product-variants/';

  getAll(): Observable<ProductVariant[]> {
    return this.http.get<ProductVariant[]>(this.baseUrl);
  }

  create(data: { name: string; description?: string }): Observable<ProductVariant> {
    return this.http.post<ProductVariant>(this.baseUrl, data);
  }

  update(id: number, data: { name: string; description?: string }): Observable<ProductVariant> {
    return this.http.put<ProductVariant>(`${this.baseUrl}${id}/`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${id}/`);
  }
}
