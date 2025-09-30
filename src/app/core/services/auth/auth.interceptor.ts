// auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApplicationRef, createComponent, EnvironmentInjector, ComponentRef } from '@angular/core';
import { SessionExpiredModal } from '../../../presentation/pages/modals/session-expired-modal/session-expired-modal'; 

// Zmienna globalna do przechowywania referencji do modala
let modalComponentRef: ComponentRef<SessionExpiredModal> | null = null;

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
        localStorage.removeItem('jwt_token');
        
        if (!modalComponentRef) {

          modalComponentRef = createComponent(SessionExpiredModal, {
            environmentInjector: injector
          });

          document.body.appendChild(modalComponentRef.location.nativeElement);
          appRef.attachView(modalComponentRef.hostView);
        }
      }
      return throwError(() => error);
    })
  );
};

export function hideSessionExpiredModal(appRef: ApplicationRef): void {
  if (modalComponentRef) {
    appRef.detachView(modalComponentRef.hostView);
    modalComponentRef.destroy();
    modalComponentRef = null;
  }
}