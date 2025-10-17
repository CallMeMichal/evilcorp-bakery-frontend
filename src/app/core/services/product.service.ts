import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Product } from '../../domain/product';
import { Category } from '../../domain/category';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = 'https://localhost:7200/api/v1/product';

  constructor(private http: HttpClient) { }

  getVisibleProducts(): Observable<Product[]> {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/all/visible`).pipe(
      map(response => response.data || [])
    );
  }


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


  getVisibleCategories(): Observable<Category[]> {
    return this.http.get<any>(`${this.apiUrl}/category/user/all`).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error loading visible categories:', error);
        throw error;
      })
    );
  }


  createProduct(product: Partial<Product>): Observable<Product | null> {
    const payload = {
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryName: product.category,
      photos: product.photos?.map(photo => ({
        url: photo.url,  // base64 string
        isMain: photo.isMain
      })) || []
    };

    return this.http.post<any>(`${this.apiUrl}/create`, payload).pipe(
      map(response => response.data || null),
      catchError(error => {
        console.error('Error creating product:', error);
        throw error;
      })
    );
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product | null> {
    return this.http.put<any>(`${this.apiUrl}/update/${id}`, product).pipe(
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

   getAllCategoriesAdmin(): Observable<Category[]> {
    return this.http.get<any>(`${this.apiUrl}/category/admin/all`).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error loading categories:', error);
        throw error;
      })
    );
  }

  createCategory(categoryName: string): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/create/category?query=${encodeURIComponent(categoryName)}`, {}).pipe(
      map(response => response.success || response.data),
      catchError(error => {
        console.error('Error creating category:', error);
        throw error;
      })
    );
  }

  activateCategory(categoryId: number): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/visible/category/${categoryId}`, {}).pipe(
      map(response => response.success || response.data),
      catchError(error => {
        console.error('Error activating category:', error);
        throw error;
      })
    );
  }

  deactivateCategory(categoryId: number): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/invisible/category/${categoryId}`, {}).pipe(
      map(response => response.success || response.data),
      catchError(error => {
        console.error('Error deactivating category:', error);
        throw error;
      })
    );
  }

}