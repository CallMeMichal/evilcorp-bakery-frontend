import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';



import { SharedModule } from './shared/shared.module'; 
import { CoreModule } from './core/core.module';
import { routes } from './presentation/presentation-routing.module';
import { authInterceptor } from './core/services/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    importProvidersFrom(SharedModule),
    importProvidersFrom(CoreModule)
  ]
};