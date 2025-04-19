import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading: boolean = false;
  error: string = '';
  isOffline: boolean = !navigator.onLine;
  biometricSupported: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.registerForm = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      biometricEnabled: [true]
    }, {
      validator: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Check if already logged in
    this.authService.isAuthenticated().subscribe(isAuth => {
      if (isAuth) {
        this.router.navigate(['/dashboard']);
      }
    });

    // Listen for online/offline events
    window.addEventListener('online', () => this.isOffline = false);
    window.addEventListener('offline', () => this.isOffline = true);

    // Check if biometrics are supported
    if (window.PublicKeyCredential) {
      // Verificar si hay autenticador de plataforma disponible
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => {
          this.biometricSupported = available;
          console.log('Biometric support detected:', available);
        })
        .catch(error => {
          console.error('Error checking biometric support:', error);
          this.biometricSupported = false;
        });
    }
  }

  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    if (this.isOffline) {
      this.error = 'Registration is not available while offline.';
      return;
    }

    this.loading = true;
    this.error = '';

    const { firstName, lastName, username, email, password, biometricEnabled } = this.registerForm.value;

    this.authService.register(firstName, lastName, username, email, password, biometricEnabled).subscribe({
      next: () => {
        this.loading = false;
        
        if (biometricEnabled) {
          // If biometrics are enabled, proceed to biometric enrollment
          this.router.navigate(['/biometric'], { 
            queryParams: { 
              username, 
              action: 'enroll' 
            } 
          });
        } else {
          // If not using biometrics, go directly to login
          this.router.navigate(['/login'], { 
            queryParams: { registered: 'true' } 
          });
        }
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
