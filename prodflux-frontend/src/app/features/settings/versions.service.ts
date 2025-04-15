import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProductVersion {
  id: number;
  name: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class VersionsService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8000/api/product-versions/';

  getAll(): Observable<ProductVersion[]> {
    return this.http.get<ProductVersion[]>(this.baseUrl);
  }

  create(data: { name: string; description?: string }): Observable<ProductVersion> {
    return this.http.post<ProductVersion>(this.baseUrl, data);
  }

  update(id: number, data: { name: string; description?: string }): Observable<ProductVersion> {
    return this.http.put<ProductVersion>(`${this.baseUrl}${id}/`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${id}/`);
  }
}
