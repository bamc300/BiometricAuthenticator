import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { BiometricComponent } from './auth/biometric/biometric.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { UserManagementComponent } from './admin/user-management/user-management.component';
import { WelcomeComponent } from './welcome.component';

import { AuthGuard } from './shared/guards/auth.guard';
import { AdminGuard } from './shared/guards/admin.guard';

// Definimos las rutas para la aplicación standalone (sin NgModule)
export const routes: Routes = [
  { path: '', component: WelcomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'biometric', component: BiometricComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { 
    path: 'admin', 
    canActivate: [AuthGuard, AdminGuard],
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'users', component: UserManagementComponent }
    ] 
  },
  { path: '**', redirectTo: '/' }
];
