import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../../domain/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = 'https://localhost:7200/api/v1/product';

  constructor(private http: HttpClient) { }

  getProducts(): Observable<Product[]> {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/all`).pipe(
      map(response => response.data || [])
    );
  }


  


    getProductSuggestions(query: string): Observable<Product[]> {
    if (!query || query.length < 1) {
      return of([]);
    }
    
    return this.http.get<any>(`${this.apiUrl}/suggestions?query=${query}`).pipe(
      map(response => response.data || [])
    );
  }


  searchProducts(query: string): Observable<Product[]> {
    return this.http.get<any>(`${this.apiUrl}/suggestions?query=${query}`).pipe(
      map(response => response.data || [])
    );
  }
}