import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private tokenKey = 'auth_token';

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post<{ access: string }>(`${this.apiUrl}/login/`, { username, password })
      .pipe(tap(response => {
        localStorage.setItem(this.tokenKey, response.access);
      }));
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
