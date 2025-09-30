import { Injectable } from '@angular/core';
import { JwtToken } from '../../../domain/jwtToken';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap } from 'rxjs';

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
      console.log(payload);
      const decodedPayload = atob(payload);
      return JSON.parse(decodedPayload) as JwtToken;
    } catch (error) {
      console.error('Error decoding token:', error);
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

  getUserInfo(): { name: string; role: string } | null {
    const token = this.decodeToken();
    if (!token) {
      return null;
    }

    return {
      name: token.given_name,
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
          console.log('Backend response:', response);
          
          if (response.success && response.data) {
            const token = response.data[0];
            
            // Lepsze sprawdzenie tokena
            if (token && token.trim().length > 0) {
              localStorage.setItem('jwt_token', token);
              return true; // Logowanie udane
            }
          }
          return false; // Brak tokena lub nieudane logowanie
        }),
        catchError((error) => {
          console.error('Login error:', error);
          return of(false);
        })
    );
  }


}