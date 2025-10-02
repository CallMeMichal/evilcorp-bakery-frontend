import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Order } from '../../domain/order';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = 'https://localhost:7200/api/v1/order';

  constructor(private http: HttpClient) {}

  // Pobierz wszystkie zamówienia
  getOrdersByUserId(userId: number): Observable<Order[]> {
    return this.http.get<ApiResponse<Order>>(`${this.apiUrl}/user/${userId}`).pipe(
      map(response => response.data || [])
    );
  }

  // Pobierz zamówienie po ID
  //getOrderById(id: number): Observable<Order> {
  //  return this.http.get<ApiResponse<Order>>(`${this.apiUrl}/${id}`).pipe(
  //    map(response => response.data?.[0] || {} as Order)
  //  );
  //}
}