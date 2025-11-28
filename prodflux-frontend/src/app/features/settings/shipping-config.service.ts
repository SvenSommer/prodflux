import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ShippingCountryConfig {
  id: number;
  country_code: string;
  country_name: string;
  shipping_type: 'dhl_product' | 'external_link';
  shipping_type_display: string;
  dhl_product: string | null;
  dhl_product_display: string | null;
  external_link: string | null;
  external_link_label: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingConfigDefaults {
  shipping_types: { code: string; name: string }[];
  dhl_products: { code: string; name: string }[];
  default_countries: { code: string; name: string }[];
  default_external_link: string;
}

export interface CountryShippingInfo {
  country_code: string;
  country_name: string;
  shipping_type: 'dhl_product' | 'external_link';
  dhl_product?: string;
  dhl_product_name?: string;
  external_link?: string;
  external_link_label?: string;
  is_configured: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ShippingConfigService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/shopbridge/shipping-config`;

  getAll(): Observable<ShippingCountryConfig[]> {
    return this.http.get<ShippingCountryConfig[]>(`${this.baseUrl}/`);
  }

  getById(id: number): Observable<ShippingCountryConfig> {
    return this.http.get<ShippingCountryConfig>(`${this.baseUrl}/${id}/`);
  }

  create(config: Partial<ShippingCountryConfig>): Observable<ShippingCountryConfig> {
    return this.http.post<ShippingCountryConfig>(`${this.baseUrl}/`, config);
  }

  update(id: number, config: Partial<ShippingCountryConfig>): Observable<ShippingCountryConfig> {
    return this.http.put<ShippingCountryConfig>(`${this.baseUrl}/${id}/`, config);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/`);
  }

  getDefaults(): Observable<ShippingConfigDefaults> {
    return this.http.get<ShippingConfigDefaults>(`${this.baseUrl}/defaults/`);
  }

  getConfigForCountry(countryCode: string): Observable<CountryShippingInfo> {
    return this.http.get<CountryShippingInfo>(`${this.baseUrl}/country/${countryCode}/`);
  }
}
