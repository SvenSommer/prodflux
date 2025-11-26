import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Supplier, SupplierRequest } from './models/supplier.model';

@Injectable({ providedIn: 'root' })
export class SuppliersService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/suppliers/`;

  getAll(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(this.baseUrl);
  }

  get(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.baseUrl}${id}/`);
  }

  create(data: SupplierRequest): Observable<Supplier> {
    return this.http.post<Supplier>(this.baseUrl, data);
  }

  update(id: number, data: SupplierRequest): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.baseUrl}${id}/`, data);
  }

  patch(id: number, data: Partial<SupplierRequest>): Observable<Supplier> {
    return this.http.patch<Supplier>(`${this.baseUrl}${id}/`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${id}/`);
  }
}
