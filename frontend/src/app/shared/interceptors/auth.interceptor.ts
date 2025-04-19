import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Don't add token for auth-related requests
    if (request.url.includes('/auth/login') || request.url.includes('/auth/register')) {
      return next.handle(request);
    }
    
    const token = this.authService.getAuthToken();
    
    if (token) {
      request = this.addToken(request, token);
    }
    
    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        }
        
        return throwError(() => error);
      })
    );
  }
  
  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);
      
      return this.authService.refreshToken().pipe(
        switchMap((response) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response.token);
          
          return next.handle(this.addToken(request, response.token));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          
          // If refresh token fails, log user out
          this.authService.logout();
          return throwError(() => error);
        })
      );
    }
    
    // Wait until refreshTokenSubject has a non-null value
    // which means that the token is refreshed
    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next.handle(this.addToken(request, token)))
    );
  }
}
