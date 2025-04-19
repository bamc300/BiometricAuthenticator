import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { UserManagementComponent } from './user-management/user-management.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    AdminDashboardComponent,
    UserManagementComponent
  ],
  exports: [
    AdminDashboardComponent,
    UserManagementComponent
  ]
})
export class AdminModule { }
