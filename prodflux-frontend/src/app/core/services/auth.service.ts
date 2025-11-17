import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  username: string;
  email: string;
  workshop: {
    id: number;
    name: string;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private tokenKey = 'auth_token';
  private userKey = 'user_data';

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Initialize with stored values
    const hasValidToken = this.hasValidToken();
    const storedUser = this.getUserFromStorage();

    this.isLoggedInSubject.next(hasValidToken);
    this.currentUserSubject.next(storedUser);

    // Check token validity on service initialization
    this.validateToken();
  }  login(username: string, password: string): Observable<any> {
    return this.http.post<{ access: string }>(`${this.apiUrl}/login/`, { username, password })
      .pipe(
        tap(response => {
          localStorage.setItem(this.tokenKey, response.access);
          this.isLoggedInSubject.next(true);
          // Fetch user data after successful login
          this.fetchCurrentUser().subscribe();
        }),
        catchError(error => {
          this.isLoggedInSubject.next(false);
          throw error;
        })
      );
  }

  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me/`)
      .pipe(
        tap(user => {
          localStorage.setItem(this.userKey, JSON.stringify(user));
          this.currentUserSubject.next(user);
        }),
        catchError(error => {
          console.error('Failed to fetch user data:', error);
          this.logout();
          return of(null as any);
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private getUserFromStorage(): User | null {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.isLoggedInSubject.next(false);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.isLoggedInSubject.value;
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Basic JWT token validation (check expiration)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  private validateToken(): void {
    const isValid = this.hasValidToken();
    console.log('validateToken: token is valid =', isValid);

    if (isValid) {
      // Token exists and is valid
      console.log('validateToken: setting isLoggedIn to true');
      this.isLoggedInSubject.next(true);

      // Fetch user data if not available
      if (!this.getCurrentUser()) {
        this.fetchCurrentUser().subscribe();
      }
    } else {
      // Token invalid, clear everything
      this.isLoggedInSubject.next(false);
      this.currentUserSubject.next(null);
      // Don't call logout() here to avoid infinite loop, just clear storage
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
  }
}
