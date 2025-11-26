import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Delivery, DeliveryItem, CreateOrUpdateDelivery } from '../../shared/models/delivery.model';

// Re-export for backward compatibility
export type { Delivery, DeliveryItem, CreateOrUpdateDelivery };

@Injectable({ providedIn: 'root' })
export class DeliveriesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/deliveries/`;

  getAll(): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(this.baseUrl);
  }

  getByOrder(orderId: number): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(
      `${environment.apiUrl}/api/orders/${orderId}/deliveries/`
    );
  }

  getOne(id: number): Observable<Delivery> {
    return this.http.get<Delivery>(`${this.baseUrl}${id}/`);
  }

  create(delivery: CreateOrUpdateDelivery): Observable<Delivery> {
    return this.http.post<Delivery>(this.baseUrl, delivery);
  }

  update(id: number, delivery: CreateOrUpdateDelivery): Observable<Delivery> {
    return this.http.put<Delivery>(`${this.baseUrl}${id}/`, delivery);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${id}/`);
  }
}
