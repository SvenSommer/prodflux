import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Workshop {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class WorkshopsService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8000/api/workshops/';

  getAll(): Observable<Workshop[]> {
    return this.http.get<Workshop[]>(this.baseUrl);
  }

  create(data: { name: string }): Observable<Workshop> {
    return this.http.post<Workshop>(this.baseUrl, data);
  }

  update(id: number, data: { name: string }): Observable<Workshop> {
    return this.http.put<Workshop>(`${this.baseUrl}${id}/`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${id}/`);
  }
}
