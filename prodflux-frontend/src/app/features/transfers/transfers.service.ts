import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TransferItem {
  id?: number; // optional, weil beim Anlegen nicht notwendig
  material: number;
  quantity: number;
  note?: string; // optionales Feld für jede Position
}

export interface Transfer {
  id: number;
  source_workshop: number;
  target_workshop: number;
  note?: string;
  items: TransferItem[];
}

export interface CreateOrUpdateTransfer {
  source_workshop: number;
  target_workshop: number;
  note?: string;
  items: TransferItem[];
}

@Injectable({ providedIn: 'root' })
export class TransfersService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/transfers/`;

  getAll(): Observable<Transfer[]> {
    return this.http.get<Transfer[]>(this.baseUrl);
  }

  get(id: number): Observable<Transfer> {
    return this.http.get<Transfer>(`${this.baseUrl}${id}/`);
  }

  create(transfer: CreateOrUpdateTransfer): Observable<Transfer> {
    return this.http.post<Transfer>(this.baseUrl, transfer);
  }

  update(id: number, transfer: CreateOrUpdateTransfer): Observable<Transfer> {
    return this.http.put<Transfer>(`${this.baseUrl}${id}/`, transfer);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${id}/`);
  }
}
