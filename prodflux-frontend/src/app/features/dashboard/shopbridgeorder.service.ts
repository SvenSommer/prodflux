import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ShopbridgeOrder {
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

@Injectable({ providedIn: 'root' })
export class ShopbridgeOrdersService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/shopbridge/orders/`;

  getOrders(status?: string): Observable<ShopbridgeOrder> {
    const url = status ? `${this.baseUrl}?status=${status}` : this.baseUrl;
    return this.http.get<ShopbridgeOrder>(url);
  }
}
