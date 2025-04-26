import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MaterialCategory {
  id: number;
  name: string;
  order: number;
}

@Injectable({ providedIn: 'root' })
export class MaterialCategoriesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/material-categories/`;

  getAll(): Observable<MaterialCategory[]> {
    return this.http.get<MaterialCategory[]>(this.baseUrl);
  }

  create(data: { name: string; order: number }): Observable<MaterialCategory> {
    return this.http.post<MaterialCategory>(this.baseUrl, data);
  }

  update(id: number, data: { name: string; order: number }): Observable<MaterialCategory> {
    return this.http.put<MaterialCategory>(`${this.baseUrl}${id}/`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${id}/`);
  }
}
