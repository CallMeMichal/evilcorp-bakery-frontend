import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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

  getProductById(id: number): Observable<Product> {
    return this.http.get<any>(`${this.apiUrl}/specified/${id}`).pipe(
      map((response: any) => response.data as Product)
    );
  }


  getCategories(): Observable<string[]> {
    return this.getProducts().pipe(
      map(products => {
        const categories = products.map(p => p.category);
        return [...new Set(categories)].sort(); // Unikalne kategorie, posortowane
      })
    );
  }

  createProduct(product: Partial<Product>): Observable<Product | null> {
    return this.http.post<any>(this.apiUrl, product).pipe(
      map(response => response.data || null),
      catchError(error => {
        console.error('Error creating product:', error);
        throw error;
      })
    );
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product | null> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, product).pipe(
      map(response => response.data || null),
      catchError(error => {
        console.error(`Error updating product ${id}:`, error);
        throw error;
      })
    );
  }

  deleteProduct(id: number): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.success),
      catchError(error => {
        console.error(`Error deleting product ${id}:`, error);
        throw error;
      })
    );
  }

}