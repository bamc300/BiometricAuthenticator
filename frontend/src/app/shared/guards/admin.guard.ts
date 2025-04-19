import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of, switchMap, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.isAuthenticated().pipe(
      take(1),
      switchMap(isAuthenticated => {
        if (!isAuthenticated) {
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return of(false);
        }
        
        // Check if user has admin role
        return this.authService.getCurrentUser().pipe(
          take(1),
          switchMap(user => {
            if (user && user.roles.includes('ADMIN')) {
              return of(true);
            }
            
            // Not an admin, redirect to dashboard
            this.router.navigate(['/dashboard']);
            return of(false);
          })
        );
      })
    );
  }
}
