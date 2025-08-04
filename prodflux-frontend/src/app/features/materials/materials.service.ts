// src/app/features/materials/materials.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Material {
  id: number;
  bezeichnung: string;
  hersteller_bezeichnung: string;
  bild: File | null;
  bild_url: string | null;
  category?: {
    id: number;
    name: string;
    order: number;
  };
  alternatives: number[];
  required_quantity_per_unit?: number;
  product_material_id?: number; // Added to store product material ID
}

export interface MaterialCategoryGroup {
  category_id: number | null;
  category_name: string;
  materials: Material[];
}

export interface MaterialMovement {
  id: number;
  quantity: number;
  change_type: 'lieferung' | 'verbrauch' | 'korrektur' | 'verlust';
  note?: string;
  created_at: string;
  delivery_id?: number;
}

export interface MaterialStock {
  material_id: number;
  bezeichnung: string;
  bestell_nr?: string;
  hersteller_bezeichnung: string;
  category?: string;
  current_stock: number;
  workshop_id: number;
  material_details: Material;
  alternatives: {
    id: number;
    bezeichnung: string;
    hersteller_bezeichnung: string;
    bestell_nr?: string;
    category?: {
      id: number;
      name: string;
      order: number;
    } | null;
    bild?: string;
    bild_url?: string;
    current_stock: number;
  }[];
}

@Injectable({ providedIn: 'root' })
export class MaterialsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/materials/`;

  getMaterialsGrouped(): Observable<MaterialCategoryGroup[]> {
    return this.http.get<MaterialCategoryGroup[]>(this.baseUrl);
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

  getMaterialAlternatives(materialId: number): Observable<Material[]> {
    return this.http.get<Material[]>(`${this.baseUrl}${materialId}/alternatives/`);
  }

  addAlternative(materialId: number, alternativeId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}${materialId}/alternatives/`, {
      alternative_material_id: alternativeId,
    });
  }

  removeAlternative(materialId: number, alternativeId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${materialId}/alternatives/${alternativeId}/`);
  }

  createMaterialFormData(data: FormData): Observable<Material> {
    return this.http.post<Material>(this.baseUrl, data);
  }

  createMovement(data: {
    material: number;
    workshop_id: number;
    change_type: string;
    quantity: number;
    note?: string;
  }): Observable<MaterialMovement> {
    const { material, ...body } = data;
    return this.http.post<MaterialMovement>(
      `${this.baseUrl}${material}/movements`,
      body
    );
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

  getMaterialStock(materialId: number, workshopId: number): Observable<MaterialStock> {
    return this.http.get<MaterialStock>(`${this.baseUrl}${materialId}/stock?workshop_id=${workshopId}`);
  }
}
