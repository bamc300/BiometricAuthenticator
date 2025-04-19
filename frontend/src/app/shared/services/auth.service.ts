import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User, UserActivity } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private userKey = 'current_user';
  private isOfflineMode = false;
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem(this.tokenKey);
    const userStr = localStorage.getItem(this.userKey);
    
    if (token) {
      const user = userStr ? JSON.parse(userStr) : null;
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  setOfflineMode(isOffline: boolean): void {
    this.isOfflineMode = isOffline;
  }

  isOffline(): boolean {
    return this.isOfflineMode;
  }

  /**
   * Realiza el login de la primera fase (solo con contraseña)
   * No establece el estado como autenticado para requerir la segunda fase (biométrica)
   */
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { username, password })
      .pipe(
        // Solo devuelve la respuesta con un token parcial, pero no autentica completamente
        // pues es obligatorio completar el segundo factor (biométrico)
        map(response => {
          if (response && response.token) {
            // Almacenamos el token parcial temporalmente
            localStorage.setItem('temp_auth_token', response.token);
            
            // Almacenamos temporalmente el usuario para el segundo factor
            if (response.user) {
              localStorage.setItem('temp_user', JSON.stringify(response.user));
            }
            
            // Pero NO establecemos el estado como autenticado todavía
            // isAuthenticatedSubject permanece en false
          }
          return response;
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Verifica el segundo factor (biométrico) y completa la autenticación
   * Es obligatorio pasar por esta verificación para completar el login
   */
  verifyBiometric(username: string): Observable<{token: string, user: any}> {
    const tempToken = localStorage.getItem('temp_auth_token');
    const tempUserStr = localStorage.getItem('temp_user');
    
    // Preparamos los headers manualmente
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Añadir token temporal si existe
    if (tempToken) {
      headers['X-Temp-Auth-Token'] = tempToken;
    }
    
    // Utilizamos el método post sin opciones complejas para evitar problemas de tipo
    return this.http.post<{token: string, user: any}>(
      `${this.apiUrl}/auth/biometric/verify`, 
      { username },
      { headers }
    ).pipe(
      tap(response => {
        // Limpiamos los tokens temporales
        localStorage.removeItem('temp_auth_token');
        localStorage.removeItem('temp_user');
        
        if (response && response.token) {
          // Establecemos el token completo (con ambos factores validados)
          this.setAuthToken(response.token);
          
          // Usamos el usuario de la respuesta o el temporal si está disponible
          let user = response.user;
          if (!user && tempUserStr) {
            try {
              user = JSON.parse(tempUserStr);
            } catch (e) {
              console.error('Error parsing temp user:', e);
            }
          }
          
          if (user) {
            this.currentUserSubject.next(user);
            localStorage.setItem(this.userKey, JSON.stringify(user));
          }
          
          // AHORA SÍ establecemos el estado autenticado (ambos factores verificados)
          this.isAuthenticatedSubject.next(true);
          
          // Registramos el método de autenticación
          if (user) {
            user.lastLoginMethod = 'biometric';
            user.lastLogin = new Date().toISOString();
          }
        }
      }),
      catchError(error => {
        console.error('Biometric verification error:', error);
        // Limpiamos los tokens temporales en caso de error
        localStorage.removeItem('temp_auth_token');
        localStorage.removeItem('temp_user');
        return throwError(() => error);
      })
    );
  }

  register(firstName: string, lastName: string, username: string, email: string, password: string, biometricEnabled: boolean): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, { 
      firstName, 
      lastName, 
      username, 
      email, 
      password,
      biometricEnabled
    }).pipe(
      catchError(error => {
        console.error('Registration error:', error);
        return throwError(() => error);
      })
    );
  }

  enrollBiometric(username: string, biometricType: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/biometric/enroll`, { 
      username,
      biometricType
    }).pipe(
      catchError(error => {
        console.error('Biometric enrollment error:', error);
        return throwError(() => error);
      })
    );
  }

  getUserActivity(): Observable<UserActivity> {
    if (this.isOfflineMode) {
      return of({
        lastLogin: 'Offline Session',
        lastLoginMethod: 'Offline Authentication',
        offlineEnabled: true
      });
    }
    
    return this.http.get<UserActivity>(`${this.apiUrl}/users/activity`)
      .pipe(
        catchError(error => {
          console.error('Get user activity error:', error);
          return of({});
        })
      );
  }

  logout(): void {
    // Clear stored token and user data
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    
    // Reset behavior subjects
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.isOfflineMode = false;
    
    // Send logout request to server (fire and forget)
    if (navigator.onLine) {
      this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe();
    }
  }

  setAuthToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getAuthToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  refreshToken(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/refresh-token`, {})
      .pipe(
        tap(response => {
          if (response && response.token) {
            this.setAuthToken(response.token);
          }
        }),
        catchError(error => {
          console.error('Token refresh error:', error);
          // If refresh fails, log out the user
          if (error.status === 401) {
            this.logout();
          }
          return throwError(() => error);
        })
      );
  }
}
