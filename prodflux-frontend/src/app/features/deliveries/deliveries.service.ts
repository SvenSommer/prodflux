import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DeliveryItem {
  material: number;
  quantity: number;
  note?: string;
}

export interface Delivery {
  id: number;
  workshop: number | string;
  note?: string;
  items: DeliveryItem[];
  workshop_name?: string; // optionaler Zusatz, falls Backend Namen mitliefert
}

@Injectable({ providedIn: 'root' })
export class DeliveriesService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8000/api/deliveries/';

  getAll(): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(this.baseUrl);
  }

  getOne(id: number): Observable<Delivery> {
    return this.http.get<Delivery>(`${this.baseUrl}${id}/`);
  }

  create(delivery: Omit<Delivery, 'id'>): Observable<Delivery> {
    return this.http.post<Delivery>(this.baseUrl, delivery);
  }

  update(id: number, delivery: Omit<Delivery, 'id'>): Observable<Delivery> {
    return this.http.put<Delivery>(`${this.baseUrl}${id}/`, delivery);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${id}/`);
  }
}
