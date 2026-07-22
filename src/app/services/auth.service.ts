import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface UserPermission {
  code: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
}

export interface AuthenticatedUser {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  roles: string[];
  permissions: UserPermission[];
}

import { environment } from '../config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // Enforce secure HTTPS connection scheme in non-development/production environments
  private apiBase = window.location.origin.includes('localhost') 
    ? environment.apiBase 
    : window.location.origin.replace('http:', 'https:') + '/api';

  getDownloadUrl(filePath: string): string {
    if (!filePath) return '#';
    if (filePath.startsWith('http')) return filePath;
    const base = this.apiBase.replace('/api', '');
    // Authentication is sent as an HttpOnly cookie; never expose a token in URLs.
    return `${base}${filePath}`;
  }

  currentUser = signal<AuthenticatedUser | null>(null);

  constructor() {
    const session = sessionStorage.getItem('auth_user');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed?.user) {
          this.currentUser.set(parsed.user);
        } else {
          sessionStorage.removeItem('auth_user');
        }
      } catch (err) {
        sessionStorage.removeItem('auth_user');
      }
    }
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/auth/login`, credentials).pipe(
      tap((res) => {
        if (res?.user) {
          sessionStorage.setItem('auth_user', JSON.stringify({ user: res.user }));
          this.currentUser.set(res.user);
        }
      })
    );
  }

  updatePassword(userId: string, password: string): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/users/${userId}`, { password }).pipe(
      tap((res) => {
        const session = sessionStorage.getItem('auth_user');
        if (session && res) {
          const parsed = JSON.parse(session);
          parsed.user = res;
          sessionStorage.setItem('auth_user', JSON.stringify(parsed));
          this.currentUser.set(res);
        }
      })
    );
  }

  logout() {
    this.http.post(`${this.apiBase}/auth/logout`, {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  private clearSession(redirect = true) {
    localStorage.removeItem('auth_session'); // Remove legacy persisted JWTs.
    sessionStorage.removeItem('auth_user');
    this.currentUser.set(null);
    if (redirect) this.router.navigate(['/login']);
  }

  endExpiredSession(): void {
    this.clearSession(true);
  }

  getToken(): string | null {
    return null; // Tokens are intentionally held only in the HttpOnly auth cookie.
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = token.split('.')[1];
      if (!payload) return true;
      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(normalizedPayload));
      return !decoded.exp || Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  }

  hasPermission(
    permissionCode: string,
    action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' = 'view'
  ): boolean {
    const user = this.currentUser();
    if (!user) return false;

    // Superadmin bypass
    if (user.roles.includes('System Administrator')) return true;

    const perm = user.permissions.find((p) => p.code === permissionCode);
    if (!perm) return false;

    switch (action) {
      case 'view':
        return perm.canView;
      case 'create':
        return perm.canCreate;
      case 'edit':
        return perm.canEdit;
      case 'delete':
        return perm.canDelete;
      case 'approve':
        return perm.canApprove;
      case 'export':
        return perm.canExport;
      default:
        return false;
    }
  }

  hasModuleAccess(modulePrefix: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    
    // Superadmin bypass
    if (user.roles.includes('System Administrator')) return true;
    
    return user.permissions.some(
      (p) => p.code.toLowerCase().startsWith(modulePrefix.toLowerCase()) && p.canView
    );
  }
}
