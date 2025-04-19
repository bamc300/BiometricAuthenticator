import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, HTTP_INTERCEPTORS, withInterceptorsFromDi } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { ServiceWorkerModule } from '@angular/service-worker';
import { routes } from './app/app-routing.module';
import { AuthInterceptor } from './app/shared/interceptors/auth.interceptor';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from './app/shared/shared.module';
import { AuthModule } from './app/auth/auth.module';
import { AdminModule } from './app/admin/admin.module';

// Aplicación completa configurada para usar proveedores mejorados
bootstrapApplication(AppComponent, {
  providers: [
    // Configuración de router con hash para evitar problemas de rutas en el servidor
    provideRouter(routes, withHashLocation()),
    // Configuración de HTTP mejorada con interceptores  
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    importProvidersFrom(
      ServiceWorkerModule.register('service-worker.js', {
        enabled: true,
        registrationStrategy: 'registerImmediately'
      }),
      FormsModule,
      ReactiveFormsModule,
      SharedModule,
      AuthModule,
      AdminModule
    )
  ]
})
.then(() => {
  console.log('Angular application bootstrapped successfully');
})
.catch(err => console.error('Bootstrap error:', err));
