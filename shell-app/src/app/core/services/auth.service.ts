import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginRequest  { username: string; password: string; }
export interface LoginResponse { token: string; expiresIn: number; ruolo: string; }

const BFF_BASE_URL = 'http://localhost:8080/api';
const TOKEN_KEY    = 'jwt_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${BFF_BASE_URL}/auth/login`, credentials)
      .pipe(tap((res) => localStorage.setItem(TOKEN_KEY, res.token)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Decodifica il payload (parte centrale del JWT, base64url) senza librerie
    // esterne: ci basta controllare il campo "exp".
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // exp è in secondi epoch — confrontiamo con Date.now() in millisecondi
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getRuolo(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])).ruolo ?? null;
    } catch {
      return null;
    }
  }
}
