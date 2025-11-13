import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { UserAddress } from "../../domain/address";


@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private readonly apiUrl = 'https://localhost:7200/api/v1/address';
  
  constructor(private http: HttpClient) {}
  
  getAddressesByUserId(userId: number): Observable<UserAddress[]> {
    return this.http.get<ApiResponse<UserAddress>>(`${this.apiUrl}/user/${userId}`).pipe(
      map(response => {
        console.log('Raw API response:', response); // Debug
        console.log('Addresses with IDs:', response.data); // Debug
        return response.data || [];
      })
    );
  }

    createAddress(address: UserAddress): Observable<UserAddress> {
    return this.http.post<ApiResponse<UserAddress>>(`${this.apiUrl}/create`, address).pipe(
      map(response => {
        if (Array.isArray(response.data)) {
          return response.data[0];
        }
        return response.data as UserAddress;
      })
    );
  }


}