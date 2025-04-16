// src/app/features/materials/materials.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/enviroment';

export interface Material {
  id: number;
  bezeichnung: string;
  hersteller_bezeichnung: string;
  bild: File | null;
  bild_url: string | null;
}

export interface MaterialMovement {
  id: number;
  quantity: number;
  change_type: 'lieferung' | 'verbrauch' | 'korrektur' | 'verlust';
  note?: string;
  created_at: string;
  delivery_id?: number;
}

@Injectable({ providedIn: 'root' })
export class MaterialsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/materials/`;


  getMaterials(): Observable<Material[]> {
    return this.http.get<Material[]>(this.baseUrl);
  }

  getMaterial(id: number) {
    return this.http.get<Material>(`${this.baseUrl}${id}/`);
  }

  updateMaterial(id: number, data: Partial<Material>) {
    return this.http.put<Material>(`${this.baseUrl}${id}/`, data);
  }

  createMaterial(data: Omit<Material, 'id'>): Observable<Material> {
    return this.http.post<Material>(this.baseUrl, data);
  }

  deleteMaterial(id: number) {
    return this.http.delete(`${this.baseUrl}${id}/`);
  }

  createMaterialFormData(data: FormData): Observable<Material> {
    return this.http.post<Material>(this.baseUrl, data);
  }

  updateMaterialFormData(id: number, data: FormData) {
    return this.http.put<Material>(`${this.baseUrl}${id}/`, data);
  }

  getMaterialMovements(materialId: number, workshopId: number): Observable<MaterialMovement[]> {
    return this.http.get<MaterialMovement[]>(`${this.baseUrl}${materialId}/movements?workshop_id=${workshopId}`);
  }

  updateMaterialMovement(id: number, data: Partial<MaterialMovement>) {
    return this.http.patch<MaterialMovement>(`${this.baseUrl}movements/${id}/`, data);
  }

  deleteMaterialMovement(id: number) {
    return this.http.delete(`${this.baseUrl}movements/${id}/`);
  }
}
