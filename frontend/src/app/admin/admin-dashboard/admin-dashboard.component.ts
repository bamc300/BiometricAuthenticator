import { Component, OnInit } from '@angular/core';
import { UserService } from '../../shared/services/user.service';
import { User } from '../../shared/models/user.model';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class AdminDashboardComponent implements OnInit {
  userCount: number = 0;
  adminCount: number = 0;
  regularUserCount: number = 0;
  biometricEnabledCount: number = 0;
  isOffline: boolean = !navigator.onLine;
  loading: boolean = true;
  error: string = '';
  currentUser: User | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Get current user
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOffline = false;
      this.loadDashboardData();
    });
    window.addEventListener('offline', () => this.isOffline = true);

    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    
    if (this.isOffline) {
      this.error = 'Admin dashboard data is limited in offline mode.';
      this.loading = false;
      return;
    }

    this.userService.getUserStats().subscribe({
      next: (stats) => {
        this.userCount = stats.totalUsers || 0;
        this.adminCount = stats.adminCount || 0;
        this.regularUserCount = stats.regularUserCount || 0;
        this.biometricEnabledCount = stats.biometricEnabledCount || 0;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load dashboard statistics.';
        console.error('Dashboard stats error:', err);
        this.loading = false;
      }
    });
  }

  refreshData(): void {
    this.loadDashboardData();
  }
}
