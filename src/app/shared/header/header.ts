import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { Product } from '../../domain/product';
import { ProductPhotos } from '../../domain/productPhotos';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header implements OnInit {
  cartCount = 0;
  showCartModal = false;
  cartItems: any[] = [];
  cartTotal = 0;

  // Auth properties
  isLoggedIn = false;
  userInfo: { name: string; surname: string; role: string } | null = null;

  // Search properties
  searchQuery = '';
  suggestions: any[] = [];
  showSuggestions = false;
  isLoadingSuggestions = false;
  selectedSuggestionIndex = -1;

  @ViewChild('searchInput') searchInput!: ElementRef;
  
  private searchSubject = new Subject<string>();

  constructor(
    private router: Router,
    private cartService: CartService,
    private authService: AuthService,
    private productService: ProductService
  ) {
    // Setup search suggestions
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
    this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });

    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
    });

    this.cartService.cartTotal$.subscribe(total => {
      this.cartTotal = total;
    });

    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.userInfo = this.authService.getUserInfo();
    }
  }

  // NOWA METODA - pobiera główne zdjęcie produktu dla sugestii
  getSuggestionImage(suggestion: any): string {
    if (!suggestion.photos || suggestion.photos.length === 0) {
      return 'assets/images/no-image.png';
    }
    
    const mainPhoto = suggestion.photos.find((photo: ProductPhotos) => photo.isMain);
    if (mainPhoto) {
      return mainPhoto.url;
    }
    
    return suggestion.photos[0].url;
  }

  // NOWA METODA - pobiera główne zdjęcie produktu dla koszyka
  getCartItemImage(item: any): string {
    if (!item.photos || item.photos.length === 0) {
      return 'assets/images/no-image.png';
    }
    
    const mainPhoto = item.photos.find((photo: ProductPhotos) => photo.isMain);
    if (mainPhoto) {
      return mainPhoto.url;
    }
    
    return item.photos[0].url;
  }

  // Search methods
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.searchSubject.next(this.searchQuery);
  }

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

  navigateToProfile(): void {
    if (!this.userInfo) return;

    const role = this.userInfo.role.toLowerCase().trim();
    
    if (role === 'admin' || role === 'administrator') {
      this.router.navigate(['/admin-dashboard/overview']);
    } else {
      this.router.navigate(['/user-dashboard/overview']);
    }
  }

  selectSuggestion(suggestion: any): void {
    this.router.navigate(['/products', suggestion.id]);
    this.searchQuery = '';
    this.hideSuggestions();
  }

  hideSuggestions(): void {
    setTimeout(() => {
      this.showSuggestions = false;
      this.selectedSuggestionIndex = -1;
    }, 200);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.suggestions = [];
    this.showSuggestions = false;
  }

  performSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { 
        queryParams: { search: this.searchQuery } 
      });
      this.hideSuggestions();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-container')) {
      this.showSuggestions = false;
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  signIn(): void {
    this.router.navigate(['/signin']);
  }

  register(): void {
    this.router.navigate(['/register']);
  }

  toggleCartModal(): void {
    this.showCartModal = !this.showCartModal;
  }

  closeCartModal(): void {
    this.showCartModal = false;
  }

  updateQuantity(productId: number, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity);
  }

  removeFromCart(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  checkout(): void {
    this.router.navigate(['/checkout']);
  }
}