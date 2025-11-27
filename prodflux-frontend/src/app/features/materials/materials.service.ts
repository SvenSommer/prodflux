// src/app/features/materials/materials.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError } from 'rxjs';
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
  suppliers?: number[];
  supplier_details?: {
    id: number;
    name: string;
  }[];
  deprecated?: boolean;
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
    deprecated?: boolean;
  }[];
}

@Injectable({ providedIn: 'root' })
export class MaterialsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/materials/`;

  getMaterialsGrouped(includeDeprecated: boolean = false): Observable<MaterialCategoryGroup[]> {
    const params = includeDeprecated ? '?include_deprecated=true' : '';
    return this.http.get<MaterialCategoryGroup[]>(`${this.baseUrl}${params}`);
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

  addMaterialMovement(data: {
    material: number;
    change_type: string;
    quantity: number;
    note?: string;
    workshop_id?: number;
  }): Observable<MaterialMovement> {
    const { material, ...body } = data;
    const url = `${this.baseUrl}${material}/movements/`;

    return this.http.post<MaterialMovement>(url, body);
  }

  updateMaterialFormData(id: number, data: FormData) {
    return this.http.put<Material>(`${this.baseUrl}${id}/`, data);
  }

  getMaterialMovements(materialId: number, workshopId: number): Observable<MaterialMovement[]> {
    return this.http.get<MaterialMovement[]>(`${this.baseUrl}${materialId}/movements/?workshop_id=${workshopId}`);
  }

  updateMaterialMovement(materialId: number, id: number, data: Partial<MaterialMovement>) {
    return this.http.patch<MaterialMovement>(`${this.baseUrl}${materialId}/movements/${id}/`, data);
  }

  deleteMaterialMovement(materialId: number, id: number) {
    return this.http.delete(`${this.baseUrl}${materialId}/movements/${id}/`);
  }

  getMaterialStock(materialId: number, workshopId: number): Observable<MaterialStock> {
    return this.http.get<MaterialStock>(`${this.baseUrl}${materialId}/stock/?workshop_id=${workshopId}`);
  }

  createInventoryCorrection(materialId: number, data: {
    workshop_id: number;
    inventory_count: number;
    note?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}${materialId}/inventory-correction/`, data);
  }

  toggleMaterialDeprecated(materialId: number): Observable<ToggleMaterialDeprecatedResponse> {
    return this.http.post<ToggleMaterialDeprecatedResponse>(
      `${this.baseUrl}${materialId}/toggle-deprecated/`,
      {}
    );
  }

  // Material Supplier Prices
  getMaterialSupplierPricesOverview(materialId: number): Observable<MaterialSupplierPriceOverview[]> {
    return this.http.get<MaterialSupplierPriceOverview[]>(
      `${this.baseUrl}${materialId}/supplier-prices/`
    );
  }

  createMaterialSupplierPrice(data: CreateMaterialSupplierPrice): Observable<MaterialSupplierPrice> {
    return this.http.post<MaterialSupplierPrice>(
      `${environment.apiUrl}/api/material-supplier-prices/`,
      data
    );
  }

  updateMaterialSupplierPrice(id: number, data: Partial<CreateMaterialSupplierPrice>): Observable<MaterialSupplierPrice> {
    return this.http.patch<MaterialSupplierPrice>(
      `${environment.apiUrl}/api/material-supplier-prices/${id}/`,
      data
    );
  }

  deleteMaterialSupplierPrice(id: number): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/api/material-supplier-prices/${id}/`
    );
  }
}

export interface ToggleMaterialDeprecatedResponse {
  material_id: number;
  material_deprecated: boolean;
  action: 'deprecated' | 'reactivated';
}

export interface MaterialSupplierPriceOverview {
  supplier_id: number;
  supplier_name: string;
  manual_price: number | null;
  manual_price_valid_from: string | null;
  manual_price_note: string | null;
  last_order_price: number | null;
  last_order_price_with_shipping: number | null;
  last_order_date: string | null;
  last_order_number: string | null;
}

export interface CreateMaterialSupplierPrice {
  material: number;
  supplier: number;
  price: number;
  valid_from: string;
  note?: string;
}

export interface MaterialSupplierPrice {
  id: number;
  material: number;
  material_name: string;
  supplier: number;
  supplier_name: string;
  price: number;
  valid_from: string;
  note: string;
  created_at: string;
  updated_at: string;
}
