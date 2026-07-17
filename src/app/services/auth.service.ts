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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // Enforce secure HTTPS connection scheme in non-development/production environments
  private apiBase = window.location.origin.includes('localhost') 
    ? 'http://localhost:3000/api' 
    : window.location.origin.replace('http:', 'https:') + '/api';

  getDownloadUrl(filePath: string): string {
    if (!filePath) return '#';
    if (filePath.startsWith('http')) return filePath;
    const base = this.apiBase.replace('/api', '');
    const token = this.getToken();
    return `${base}${filePath}${token ? '?token=' + token : ''}`;
  }

  currentUser = signal<AuthenticatedUser | null>(null);

  constructor() {
    const session = localStorage.getItem('auth_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed?.token && parsed?.user && !this.isTokenExpired(parsed.token)) {
          this.currentUser.set(parsed.user);
        } else {
          localStorage.removeItem('auth_session');
        }
      } catch (err) {
        localStorage.removeItem('auth_session');
      }
    }
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/auth/login`, credentials).pipe(
      tap((res) => {
        if (res && res.token) {
          localStorage.setItem('auth_session', JSON.stringify(res));
          this.currentUser.set(res.user);
        }
      })
    );
  }

  updatePassword(userId: string, password: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    return this.http.put<any>(`${this.apiBase}/users/${userId}`, { password }, { headers }).pipe(
      tap((res) => {
        const session = localStorage.getItem('auth_session');
        if (session && res) {
          const parsed = JSON.parse(session);
          parsed.user = res;
          localStorage.setItem('auth_session', JSON.stringify(parsed));
          this.currentUser.set(res);
        }
      })
    );
  }

  logout() {
    const token = this.getToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    
    this.http.post(`${this.apiBase}/auth/logout`, {}, { headers }).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  private clearSession(redirect = true) {
    localStorage.removeItem('auth_session');
    this.currentUser.set(null);
    if (redirect) this.router.navigate(['/login']);
  }

  endExpiredSession(): void {
    this.clearSession(true);
  }

  getToken(): string | null {
    const session = localStorage.getItem('auth_session');
    if (!session) return null;
    try {
      const token = JSON.parse(session).token;
      if (!token || this.isTokenExpired(token)) {
        this.clearSession(false);
        return null;
      }
      return token;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null && this.getToken() !== null;
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
