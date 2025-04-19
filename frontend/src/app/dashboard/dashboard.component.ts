import { Component, OnInit } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import { User } from '../shared/models/user.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  isOffline: boolean = !navigator.onLine;
  loading: boolean = true;
  
  lastLogin: string = '-';
  loginMethod: string = '-';
  biometricStatus: string = 'Disabled';
  offlineStatus: string = '-';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Get current user
    this.authService.getCurrentUser().subscribe(user => {
      this.loading = false;
      this.currentUser = user;
      
      if (user) {
        // Update display information
        this.biometricStatus = user.biometricEnabled ? 'Enabled' : 'Disabled';
        
        // Get additional user activity info
        this.authService.getUserActivity().subscribe(
          activity => {
            this.lastLogin = activity.lastLogin || '-';
            this.loginMethod = activity.lastLoginMethod || '-';
            this.offlineStatus = activity.offlineEnabled ? 'Enabled' : 'Disabled';
          },
          err => {
            console.error('Error fetching user activity:', err);
          }
        );
      }
    });

    // Listen for online/offline events
    window.addEventListener('online', () => this.isOffline = false);
    window.addEventListener('offline', () => this.isOffline = true);
  }
}
