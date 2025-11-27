import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Aggregated orders summary (for dashboard overview)
export interface ShopbridgeOrdersSummary {
  order_count: number;
  adapter_count: {
    total: number;
    by_type: Record<string, number>;
  };
  products: Record<string, {
    total_quantity: number;
    orders: {
      order_id: number;
      status: string;
      quantity: number;
      total: string;
      currency: string;
    }[];
  }>;
}

// WooCommerce Order Detail Interfaces
export interface WooCommerceAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface WooCommerceBillingAddress extends WooCommerceAddress {
  email: string;
  phone: string;
}

export interface WooCommerceLineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id: number;
  quantity: number;
  tax_class: string;
  subtotal: string;
  subtotal_tax: string;
  total: string;
  total_tax: string;
  sku: string;
  price: number;
  meta_data: { id: number; key: string; value: string }[];
}

export interface WooCommerceShippingLine {
  id: number;
  method_title: string;
  method_id: string;
  total: string;
  total_tax: string;
}

export interface WooCommerceOrderDetail {
  id: number;
  parent_id: number;
  number: string;
  order_key: string;
  created_via: string;
  version: string;
  status: string;
  currency: string;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  discount_total: string;
  discount_tax: string;
  shipping_total: string;
  shipping_tax: string;
  cart_tax: string;
  total: string;
  total_tax: string;
  prices_include_tax: boolean;
  customer_id: number;
  customer_ip_address: string;
  customer_user_agent: string;
  customer_note: string;
  billing: WooCommerceBillingAddress;
  shipping: WooCommerceAddress;
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  date_paid: string | null;
  date_paid_gmt: string | null;
  date_completed: string | null;
  date_completed_gmt: string | null;
  cart_hash: string;
  meta_data: { id: number; key: string; value: string }[];
  line_items: WooCommerceLineItem[];
  shipping_lines: WooCommerceShippingLine[];
  fee_lines: any[];
  coupon_lines: any[];
  refunds: { id: number; reason: string; total: string }[];
}

// Order status helpers
export const ORDER_STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  'pending': { label: 'Ausstehend', color: '#ff9800', icon: 'hourglass_empty' },
  'processing': { label: 'In Bearbeitung', color: '#2196f3', icon: 'sync' },
  'on-hold': { label: 'Wartend', color: '#9c27b0', icon: 'pause_circle' },
  'completed': { label: 'Abgeschlossen', color: '#4caf50', icon: 'check_circle' },
  'cancelled': { label: 'Storniert', color: '#f44336', icon: 'cancel' },
  'refunded': { label: 'Erstattet', color: '#607d8b', icon: 'replay' },
  'failed': { label: 'Fehlgeschlagen', color: '#c62828', icon: 'error' },
};

@Injectable({ providedIn: 'root' })
export class ShopbridgeOrdersService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/shopbridge/orders/`;

  getOrders(status?: string): Observable<ShopbridgeOrdersSummary> {
    const url = status ? `${this.baseUrl}?status=${status}` : this.baseUrl;
    return this.http.get<ShopbridgeOrdersSummary>(url);
  }

  getOrderDetail(orderId: number): Observable<WooCommerceOrderDetail> {
    return this.http.get<WooCommerceOrderDetail>(`${this.baseUrl}${orderId}/`);
  }
}
