import { Component, OnInit, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './shared/services/auth.service';
import { OfflineStorageService } from './shared/services/offline-storage.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class AppComponent implements OnInit {
  title = 'Auth PWA';
  isLoggedIn = false;
  isAdmin = false;
  isOffline = !navigator.onLine;
  username: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private offlineStorageService: OfflineStorageService
  ) {}

  ngOnInit(): void {
    // Check authentication status
    this.authService.isAuthenticated().subscribe(isAuth => {
      this.isLoggedIn = isAuth;
      if (isAuth) {
        this.authService.getCurrentUser().subscribe(user => {
          if (user) {
            this.username = user.username;
            this.isAdmin = user.roles.includes('ADMIN');
          }
        });
      }
    });

    // Initialize offline sync
    this.offlineStorageService.init();
    
    // Load feather icons (commented out until we add feather.js)
    // if (typeof feather !== 'undefined') {
    //   feather.replace();
    // }
  }

  @HostListener('window:online')
  onOnline() {
    this.isOffline = false;
    // Try to sync offline data
    this.offlineStorageService.syncOfflineData().subscribe();
  }

  @HostListener('window:offline')
  onOffline() {
    this.isOffline = true;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
