// src/app/pages/product/product-page/product-page.ts
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'app-product-page',
  imports: [SharedModule, CommonModule, FormsModule],
  templateUrl: './product-page.html',
  styleUrl: './product-page.scss'
})
export class ProductPage implements OnInit {
  products: any[] = [];
  allProducts: any[] = [];
  isLoading = true;
  
  // Search properties
  searchQuery = '';
  suggestions: any[] = [];
  showSuggestions = false;
  isLoadingSuggestions = false;
  selectedSuggestionIndex = -1;
  
  @ViewChild('searchInput') searchInput!: ElementRef;
  
  private searchSubject = new Subject<string>();

  constructor(
    private productService: ProductService,
    private cartService: CartService
  ) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 1) {
          this.suggestions = [];
          this.showSuggestions = false;
          this.isLoadingSuggestions = false;
          return [];
        }
        
        this.isLoadingSuggestions = true;
        return this.productService.getProductSuggestions(query);
      })
    ).subscribe({
      next: (suggestions) => {
        this.suggestions = suggestions;
        this.showSuggestions = suggestions.length > 0;
        this.isLoadingSuggestions = false;
        this.selectedSuggestionIndex = -1;
      },
      error: (error) => {
        console.error('Error getting suggestions:', error);
        this.suggestions = [];
        this.showSuggestions = false;
        this.isLoadingSuggestions = false;
      }
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        console.log(products);
        this.products = products;
        this.allProducts = products;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
      }
    });
  }

  // Search input handling
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.searchSubject.next(this.searchQuery);
  }

  // Keyboard navigation
  onSearchKeyDown(event: KeyboardEvent): void {
    if (!this.showSuggestions) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedSuggestionIndex = Math.min(
          this.selectedSuggestionIndex + 1, 
          this.suggestions.length - 1
        );
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
        break;
        
      case 'Enter':
        event.preventDefault();
        if (this.selectedSuggestionIndex >= 0) {
          this.selectSuggestion(this.suggestions[this.selectedSuggestionIndex]);
        } else if (this.searchQuery.trim()) {
          this.performSearch();
        }
        break;
        
      case 'Escape':
        this.hideSuggestions();
        break;
    }
  }

  // Select suggestion
  selectSuggestion(suggestion: any): void {
    this.searchQuery = suggestion.name;
    this.hideSuggestions();
    this.performSearch();
  }

  // Hide suggestions
  hideSuggestions(): void {
    setTimeout(() => {
      this.showSuggestions = false;
      this.selectedSuggestionIndex = -1;
    }, 200);
  }

  // Clear search
  clearSearch(): void {
    this.searchQuery = '';
    this.suggestions = [];
    this.showSuggestions = false;
    this.products = this.allProducts;
  }

  // Perform actual search
  private performSearch(): void {
    if (!this.searchQuery.trim()) {
      this.products = this.allProducts;
      return;
    }

    this.isLoading = true;
    this.productService.searchProducts(this.searchQuery).subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error searching products:', error);
        this.isLoading = false;
      }
    });
  }

  addToCart(product: any): void {
    this.cartService.addToCart(product);
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }
}