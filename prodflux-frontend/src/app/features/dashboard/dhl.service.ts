import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// DHL Products
export type DHLProduct = 'V01PAK' | 'V62KP' | 'V62WP' | 'V66WPI';

export interface DHLProductInfo {
  code: DHLProduct;
  name: string;
  description: string;
}

export const DHL_PRODUCTS: DHLProductInfo[] = [
  { code: 'V62KP', name: 'DHL Kleinpaket', description: 'DHL Kleinpaket bis 25 kg (Standard)' },
  { code: 'V01PAK', name: 'DHL Paket', description: 'Standard DHL Paket bis 31,5 kg' },
  { code: 'V62WP', name: 'Warenpost', description: 'Warenpost National bis 1 kg' },
  { code: 'V66WPI', name: 'Warenpost International', description: 'Warenpost International' },
];

// Print Formats
export interface PrintFormat {
  code: string;
  name: string;
  description: string;
}

export const PRINT_FORMATS: PrintFormat[] = [
  { code: '910-300-356', name: '100x150 Thermo', description: 'Thermodrucker 100 x 150 mm (empfohlen)' },
  { code: '910-300-300', name: '100x200 Thermo', description: 'Thermodrucker 100 x 150 mm (Standard)' },
  { code: '910-300-700', name: 'A4', description: 'DIN A4 (210 x 297 mm)' },
  { code: '910-300-710', name: '100x200', description: 'Label 100 x 200 mm' },
  { code: '910-300-600', name: '103x199', description: 'Label 103 x 199 mm' },
  { code: '910-300-400', name: '100x70', description: 'Label 100 x 70 mm (Warenpost)' },
];

// DHL Services (Additional Options)
export interface DHLServiceOption {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
}

export const DHL_SERVICES: DHLServiceOption[] = [
  { key: 'goGreen', name: 'GoGreen', description: 'Klimaneutraler Versand', enabled: false },
  { key: 'goGreenPlus', name: 'GoGreen Plus', description: 'Erweiterter Klimaschutz', enabled: false },
  { key: 'parcelOutletRouting', name: 'Filialrouting', description: 'Zustellung an Filiale', enabled: false },
  { key: 'neighbourDelivery', name: 'Nachbar', description: 'Abgabe beim Nachbarn erlaubt', enabled: false },
  { key: 'preferredLocation', name: 'Ablageort', description: 'Wunschablageort', enabled: false },
  { key: 'endorsement', name: 'Beilageretoure', description: 'Retoure beilegen', enabled: false },
];

// Request/Response Types
export interface CreateLabelRequest {
  consignee: {
    name1: string;
    name2?: string;
    street: string;
    house_number: string;
    postal_code: string;
    city: string;
    country: string;
    email?: string;
    phone?: string;
  };
  details: {
    weight_kg: number;
    length_cm?: number;
    width_cm?: number;
    height_cm?: number;
  };
  product: DHLProduct;
  reference?: string;
  print_format?: string;
  services?: Record<string, boolean | string>;
  woocommerce_order_id?: number;
  woocommerce_order_number?: string;
}

export interface LabelResult {
  success: boolean;
  shipment_number: string | null;
  label_pdf_base64: string | null;
  label_format: string;
  routing_code: string | null;
  reference: string | null;
  warnings: string[];
  error: string | null;
}

export interface StoredLabel {
  id: number;
  shipment_number: string;
  product: string;
  reference: string | null;
  print_format: string;
  routing_code: string | null;
  status: 'created' | 'printed' | 'deleted';
  created_at: string;
  printed_at: string | null;
  has_pdf: boolean;
}

export interface LabelsByOrderResponse {
  order_id: number;
  labels: StoredLabel[];
  count: number;
}

export interface LabelPdfResponse {
  id: number;
  shipment_number: string;
  label_b64: string;
  print_format: string;
}

export interface DHLConfigStatus {
  environment: string;
  is_sandbox: boolean;
  customer_number: string;
  api_configured: boolean;
}

export interface DHLHealthStatus {
  status: 'ok' | 'error';
  environment: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class DHLService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/shopbridge/dhl`;

  /**
   * Get DHL configuration status
   */
  getConfig(): Observable<DHLConfigStatus> {
    return this.http.get<DHLConfigStatus>(`${this.baseUrl}/config/`);
  }

  /**
   * Check DHL API health
   */
  healthCheck(): Observable<DHLHealthStatus> {
    return this.http.get<DHLHealthStatus>(`${this.baseUrl}/health/`);
  }

  /**
   * Create a shipping label
   */
  createLabel(request: CreateLabelRequest): Observable<LabelResult> {
    return this.http.post<LabelResult>(`${this.baseUrl}/labels/`, request);
  }

  /**
   * Delete/cancel a shipment
   */
  deleteShipment(shipmentNumber: string): Observable<{ status: string }> {
    return this.http.delete<{ status: string }>(
      `${this.baseUrl}/shipments/${shipmentNumber}/`
    );
  }

  /**
   * Get all labels for a WooCommerce order
   */
  getLabelsByOrder(orderId: number): Observable<LabelsByOrderResponse> {
    return this.http.get<LabelsByOrderResponse>(
      `${this.baseUrl}/labels/order/${orderId}/`
    );
  }

  /**
   * Get PDF data for a specific label
   */
  getLabelPdf(labelId: number): Observable<LabelPdfResponse> {
    return this.http.get<LabelPdfResponse>(
      `${this.baseUrl}/labels/${labelId}/pdf/`
    );
  }

  /**
   * Mark a label as printed
   */
  markLabelPrinted(labelId: number): Observable<{ id: number; status: string; printed_at: string }> {
    return this.http.post<{ id: number; status: string; printed_at: string }>(
      `${this.baseUrl}/labels/${labelId}/printed/`,
      {}
    );
  }

  /**
   * Download label PDF from base64
   */
  downloadLabel(base64: string, filename: string): void {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /**
   * Open label PDF in new tab
   */
  openLabel(base64: string): void {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
}
