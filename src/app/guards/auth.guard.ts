import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // Optionally check specific route permissions here
    const requiredPermission = route.data?.['permission'] as string;
    const requiredAction = route.data?.['action'] as 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' || 'view';
    
    if (requiredPermission && !authService.hasPermission(requiredPermission, requiredAction)) {
      router.navigate(['/dashboard']);
      return false;
    }
    return true;
  }

  router.navigate(['/login']);
  return false;
};
