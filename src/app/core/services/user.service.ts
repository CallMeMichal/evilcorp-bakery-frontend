import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, map, Observable, of } from "rxjs";
import { User } from "../../domain/user";

@Injectable({
  providedIn: 'root' 
})

export class UserService{


    private readonly apiUrl = 'https://localhost:7200/api/v1/user';
    

    constructor(private http: HttpClient){}




      getUserJoinDate(userId: number): Observable<Date> {
        return this.http.get<ApiResponse<string>>(`${this.apiUrl}/${userId}/joindate`)
          .pipe(
            map(response => {
              if (response.success && response.data) {
                const dateString = response.data as any as string;
                return new Date(dateString);
              }
              return new Date();
            }),
            catchError(error => {
              console.error('Error fetching user join date:', error);
              return of(new Date());
            })
          );
      }



    getAllUsers(): Observable<User[]> {
        return this.http.get<any>(`${this.apiUrl}/all`).pipe(
            map(response => response.data as User[] || []),
            catchError(error => {
                console.error('Error fetching users:', error);
                return of([]);
            })
        );
    }


    deleteUser(id: number): Observable<boolean> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
        map(response => response.success),
        catchError(error => {
            console.error(`Error deleting user ${id}:`, error);
            throw error;
        })
    );
  }
}