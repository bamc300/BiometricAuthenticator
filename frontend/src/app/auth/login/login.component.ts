import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { OfflineStorageService } from '../../shared/services/offline-storage.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  returnUrl: string = '/dashboard';
  loading: boolean = false;
  error: string = '';
  isOffline: boolean = !navigator.onLine;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private offlineStorageService: OfflineStorageService
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Get return URL from route parameters or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    
    // Check if already logged in
    this.authService.isAuthenticated().subscribe(isAuth => {
      if (isAuth) {
        this.router.navigate([this.returnUrl]);
      }
    });

    // Listen for online/offline events
    window.addEventListener('online', () => this.isOffline = false);
    window.addEventListener('offline', () => this.isOffline = true);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    const { username, password } = this.loginForm.value;

    // If offline, attempt to login using cached credentials
    if (this.isOffline) {
      this.offlineLoginAttempt(username, password);
      return;
    }

    // Online login flow
    this.authService.login(username, password).subscribe({
      next: () => {
        // Proceed to biometric verification
        this.router.navigate(['/biometric'], { 
          queryParams: { username, returnUrl: this.returnUrl } 
        });
      },
      error: err => {
        this.error = err.error?.message || 'Unable to login. Please check your credentials.';
        this.loading = false;
      }
    });
  }

  private offlineLoginAttempt(username: string, password: string): void {
    this.offlineStorageService.verifyOfflineCredentials(username, password).subscribe({
      next: (isValid) => {
        this.loading = false;
        if (isValid) {
          // Proceed to biometric verification
          this.router.navigate(['/biometric'], { 
            queryParams: { username, returnUrl: this.returnUrl, offline: true } 
          });
        } else {
          this.error = 'Invalid credentials or user not cached for offline use.';
        }
      },
      error: err => {
        this.loading = false;
        this.error = 'Error during offline authentication.';
        console.error('Offline login error:', err);
      }
    });
  }
}
