// src/app/features/materials/materials.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Material {
  id: number;
  bezeichnung: string;
  hersteller_bezeichnung: string;
  preis_brutto: number;
  quelle: string;
  bestell_nr: string;
}

@Injectable({ providedIn: 'root' })
export class MaterialsService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8000/api/materials/';

  getMaterials(): Observable<Material[]> {
    return this.http.get<Material[]>(this.baseUrl);
  }

  createMaterial(data: Omit<Material, 'id'>): Observable<Material> {
    return this.http.post<Material>(this.baseUrl, data);
  }

  deleteMaterial(id: number) {
    return this.http.delete(`${this.baseUrl}${id}/`);
  }
}
