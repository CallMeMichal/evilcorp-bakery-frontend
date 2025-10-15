import { Injectable } from '@angular/core';
import { JwtToken } from '../../../domain/jwtToken';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { Form } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'https://localhost:7200/api/v1/auth';

  constructor(private http: HttpClient){}

  decodeToken(): JwtToken | null {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      return null;
    }

    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      return JSON.parse(decodedPayload) as JwtToken;
    } catch (error) {
      return null;
    }
  }

  isLoggedIn(): boolean {
    const token = this.decodeToken();
    if (!token) {
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return token.exp > currentTime;
  }

  getUserInfo(): {id: number ,name: string; surname:string; role: string } | null {
    const token = this.decodeToken();
    if (!token) {
      return null;
    }

    return {
      id : parseInt(token.sub),
      name: token.given_name,
      surname : token.family_name,
      role: token.role
    };
  }




  logout(): void {
    localStorage.removeItem('jwt_token');
  }

  login(email: string, password: string): Observable<boolean> {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    return this.http.post<ApiResponse<string>>(this.apiUrl + `/login`, formData)
      .pipe(
        map((response) => {
          
          if (response.success && response.data) {
            const token = response.data[0];
            
            if (token && token.trim().length > 0) {
              localStorage.setItem('jwt_token', token);
              return true;
            }
          }
          return false;
        }),
        catchError((error) => {
          return of(false);
        })
    );
  }


  register(formData: FormData): Observable<boolean> {
    return this.http.post<ApiResponse<any>>(this.apiUrl + `/register`, formData)
      .pipe(
        map((response) => {
          if (response.success) {
            return true;
          }
          return false;
        }),
        catchError((error) => {
          console.error('Registration error:', error);
          return of(false);
        })
      );
  }


}