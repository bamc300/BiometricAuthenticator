import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User, UserStats } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8000/api/users';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl)
      .pipe(
        catchError(error => {
          console.error('Get all users error:', error);
          return throwError(() => error);
        })
      );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Get user ${id} error:`, error);
          return throwError(() => error);
        })
      );
  }

  getUserStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.apiUrl}/stats`)
      .pipe(
        catchError(error => {
          console.error('Get user stats error:', error);
          return throwError(() => error);
        })
      );
  }

  createUser(user: any): Observable<User> {
    return this.http.post<User>(this.apiUrl, user)
      .pipe(
        catchError(error => {
          console.error('Create user error:', error);
          return throwError(() => error);
        })
      );
  }

  updateUser(id: string, user: any): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user)
      .pipe(
        catchError(error => {
          console.error(`Update user ${id} error:`, error);
          return throwError(() => error);
        })
      );
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Delete user ${id} error:`, error);
          return throwError(() => error);
        })
      );
  }

  resetPassword(id: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/reset-password`, { password: newPassword })
      .pipe(
        catchError(error => {
          console.error(`Reset password for user ${id} error:`, error);
          return throwError(() => error);
        })
      );
  }

  toggleBiometric(id: string, enabled: boolean): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/${id}/toggle-biometric`, { enabled })
      .pipe(
        catchError(error => {
          console.error(`Toggle biometric for user ${id} error:`, error);
          return throwError(() => error);
        })
      );
  }
}
