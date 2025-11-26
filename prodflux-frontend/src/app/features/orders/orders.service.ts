import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, CreateOrUpdateOrder, OrderItem } from '../../shared/models/order.model';

// Re-export for backward compatibility
export type { Order, CreateOrUpdateOrder, OrderItem };

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
