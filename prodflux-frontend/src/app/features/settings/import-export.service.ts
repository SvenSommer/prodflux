import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ImportExportResponse {
  count?: number;
  suppliers?: any[];
  orders?: any[];
  prices?: any[];
  success?: boolean;
  created_count?: number;
  messages?: string[];
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImportExportService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api`;

  // Suppliers
  exportSuppliers(isActive?: boolean): Observable<ImportExportResponse> {
    let url = `${this.apiUrl}/suppliers/export/`;
    if (isActive !== undefined) {
      url += `?is_active=${isActive}`;
    }
    return this.http.get<ImportExportResponse>(url);
  }

  importSuppliers(data: any): Observable<ImportExportResponse> {
    return this.http.post<ImportExportResponse>(
      `${this.apiUrl}/suppliers/import/`,
      data
    );
  }

  // Orders
  exportOrders(
    supplierId?: number,
    isHistorical?: boolean
  ): Observable<ImportExportResponse> {
    let url = `${this.apiUrl}/orders/export/`;
    const params: string[] = [];

    if (supplierId !== undefined) {
      params.push(`supplier_id=${supplierId}`);
    }
    if (isHistorical !== undefined) {
      params.push(`is_historical=${isHistorical}`);
    }

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get<ImportExportResponse>(url);
  }

  importOrders(data: any): Observable<ImportExportResponse> {
    return this.http.post<ImportExportResponse>(
      `${this.apiUrl}/orders/import/`,
      data
    );
  }

  // Material Supplier Prices
  exportMaterialSupplierPrices(
    materialId?: number,
    supplierId?: number
  ): Observable<ImportExportResponse> {
    let url = `${this.apiUrl}/material-supplier-prices/export/`;
    const params: string[] = [];

    if (materialId !== undefined) {
      params.push(`material_id=${materialId}`);
    }
    if (supplierId !== undefined) {
      params.push(`supplier_id=${supplierId}`);
    }

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get<ImportExportResponse>(url);
  }

  importMaterialSupplierPrices(data: any): Observable<ImportExportResponse> {
    return this.http.post<ImportExportResponse>(
      `${this.apiUrl}/material-supplier-prices/import/`,
      data
    );
  }

  // Helper method to download JSON file
  downloadJson(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Helper method to read JSON file
  readJsonFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          resolve(json);
        } catch (error) {
          reject(new Error('Ungültige JSON-Datei'));
        }
      };
      reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
      reader.readAsText(file);
    });
  }
}
