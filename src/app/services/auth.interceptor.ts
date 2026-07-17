import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const cloned = req.clone({ withCredentials: true });
  return next(cloned).pipe(
    catchError((error) => {
      if (error.status === 401) authService.endExpiredSession();
      return throwError(() => error);
    })
  );
};
