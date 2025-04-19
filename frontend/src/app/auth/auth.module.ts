import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { BiometricComponent } from './biometric/biometric.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    LoginComponent,
    RegisterComponent,
    BiometricComponent
  ],
  exports: [
    LoginComponent,
    RegisterComponent,
    BiometricComponent
  ]
})
export class AuthModule { }
