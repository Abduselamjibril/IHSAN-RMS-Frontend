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
  private apiBase = 'http://localhost:3000/api';

  currentUser = signal<AuthenticatedUser | null>(null);

  constructor() {
    const session = localStorage.getItem('auth_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        this.currentUser.set(parsed.user);
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

  logout() {
    const token = this.getToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    
    this.http.post(`${this.apiBase}/auth/logout`, {}, { headers }).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  private clearSession() {
    localStorage.removeItem('auth_session');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    const session = localStorage.getItem('auth_session');
    if (!session) return null;
    try {
      return JSON.parse(session).token;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
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
