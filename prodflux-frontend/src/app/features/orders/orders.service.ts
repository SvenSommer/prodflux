import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface OrderItem {
  id?: number; // optional, weil beim Anlegen nicht notwendig
  material: number;
  quantity: number;
  preis_pro_stueck: number;
  preis_pro_stueck_mit_versand?: number; // optional, da beim Anlegen nicht erforderlich
  quelle: string;
}
export interface Order {
  id: number;
  bestellt_am: string;
  angekommen_am: string;
  versandkosten: number;
  notiz?: string;
  items: OrderItem[];
}

export interface CreateOrUpdateOrder {
  bestellt_am: string;
  angekommen_am: string;
  versandkosten: number;
  notiz?: string;
  items: OrderItem[];
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/orders/`;

  getAll(): Observable<Order[]> {
    return this.http.get<Order[]>(this.baseUrl);
  }

  get(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}${id}/`);
  }

  create(order: CreateOrUpdateOrder): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, order);
  }

  update(id: number, order: CreateOrUpdateOrder): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}${id}/`, order);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${id}/`);
  }
}
