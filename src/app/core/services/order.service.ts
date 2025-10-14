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

  createOrder(orderData: any): Observable<any> {
      const payload = {
          userId:orderData.userId,
          deliveryMethod: orderData.deliveryMethod,
          selectedAddressDto: orderData.selectedAddress,
          paymentMethodId: orderData.paymentMethodId,
          cartItems: orderData.cartItems.map((item: any) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              base64Image: item.base64Image
          })),
          total: orderData.total,
          notes: orderData.notes || null
      };

      return this.http.post<any>(`${this.apiUrl}/create`, payload);
  }
}