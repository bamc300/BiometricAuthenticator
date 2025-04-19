import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
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
      map(isAuthenticated => {
        if (isAuthenticated) {
          // Logged in, so return true
          return true;
        }
        
        // Not logged in, redirect to login page with return url
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      })
    );
  }
}
