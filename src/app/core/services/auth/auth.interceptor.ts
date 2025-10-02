import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApplicationRef, createComponent, EnvironmentInjector, ComponentRef } from '@angular/core';
import { SessionExpiredModal } from '../../../presentation/pages/modals/session-expired-modal/session-expired-modal';
import { UnauthorizedModal } from '../../../presentation/pages/modals/unauthorized-modal/unauthorized-modal';

let sessionExpiredModalRef: ComponentRef<SessionExpiredModal> | null = null;
let unauthorizedModalRef: ComponentRef<UnauthorizedModal> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const appRef = inject(ApplicationRef);
  const injector = inject(EnvironmentInjector);
  const token = localStorage.getItem('jwt_token');

  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const errorResponse = error.error;
        
        if (errorResponse?.title === 'Unauthorized' && 
            (errorResponse?.detail?.includes('Token') ||
             errorResponse?.detail?.includes('invalid') ||
             errorResponse?.detail?.includes('expired'))) {
          
          localStorage.removeItem('jwt_token');
          
          if (!sessionExpiredModalRef) {
            sessionExpiredModalRef = createComponent(SessionExpiredModal, {
              environmentInjector: injector
            });

            document.body.appendChild(sessionExpiredModalRef.location.nativeElement);
            appRef.attachView(sessionExpiredModalRef.hostView);
          }
        }
      }

      if (error.status === 403) {
        const errorResponse = error.error;
        
        if (errorResponse?.title === 'Forbidden') {
          if (!unauthorizedModalRef) {
            unauthorizedModalRef = createComponent(UnauthorizedModal, {
              environmentInjector: injector
            });

            document.body.appendChild(unauthorizedModalRef.location.nativeElement);
            appRef.attachView(unauthorizedModalRef.hostView);
          }
        }
      }

      return throwError(() => error);
    })
  );
};


export function hideSessionExpiredModal(appRef: ApplicationRef): void {
  if (sessionExpiredModalRef) {
    appRef.detachView(sessionExpiredModalRef.hostView);
    sessionExpiredModalRef.destroy();
    sessionExpiredModalRef = null;
  }
}

export function hideUnauthorizedModal(appRef: ApplicationRef): void {
  if (unauthorizedModalRef) {
    appRef.detachView(unauthorizedModalRef.hostView);
    unauthorizedModalRef.destroy();
    unauthorizedModalRef = null;
  }
}