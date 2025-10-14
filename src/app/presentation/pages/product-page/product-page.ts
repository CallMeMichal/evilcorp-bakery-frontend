import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product-page',
  imports: [SharedModule, CommonModule, FormsModule],
  templateUrl: './product-page.html',
  styleUrl: './product-page.scss'
})
export class ProductPage implements OnInit {
  products: any[] = [];
  allProducts: any[] = [];
  filteredProducts: any[] = [];
  isLoading = true;
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 9;
  totalPages = 0;
  pages: number[] = [];
  
  // Search properties
  searchQuery = '';
  suggestions: any[] = [];
  showSuggestions = false;
  isLoadingSuggestions = false;
  selectedSuggestionIndex = -1;
  
  // Category filter - ZMIANA: array zamiast string
  categories: string[] = [];
  selectedCategories: string[] = [];
  
  isDropdownOpen = false;
  Math = Math;

  @ViewChild('searchInput') searchInput!: ElementRef;
  
  private searchSubject = new Subject<string>();

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute
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
    
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
        this.applyFilters();
      }
    });
  }

  private loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.extractCategories();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
      }
    });
  }

  private extractCategories(): void {
    const categorySet = new Set<string>();
    this.allProducts.forEach(product => {
      if (product.category) {
        categorySet.add(product.category);
      }
    });
    this.categories = Array.from(categorySet).sort();
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  // NOWA METODA: Toggle pojedynczej kategorii
  toggleCategory(category: string): void {
    const index = this.selectedCategories.indexOf(category);
    if (index > -1) {
      this.selectedCategories.splice(index, 1);
    } else {
      this.selectedCategories.push(category);
    }
    this.currentPage = 1;
    this.applyFilters();
  }

  // NOWA METODA: Sprawdź czy kategoria jest zaznaczona
  isCategorySelected(category: string): boolean {
    return this.selectedCategories.includes(category);
  }

  // NOWA METODA: Wyczyść wszystkie kategorie
  clearCategories(): void {
    this.selectedCategories = [];
    this.currentPage = 1;
    this.applyFilters();
  }

  // NOWA METODA: Usuń pojedynczą kategorię
  removeCategory(category: string): void {
    const index = this.selectedCategories.indexOf(category);
    if (index > -1) {
      this.selectedCategories.splice(index, 1);
      this.currentPage = 1;
      this.applyFilters();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.category-dropdown-container')) {
      this.isDropdownOpen = false;
    }
  }

  clearFilters(): void {
    this.selectedCategories = [];
    this.searchQuery = '';
    this.suggestions = [];
    this.showSuggestions = false;
    this.currentPage = 1;
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.allProducts];

    // ZMIANA: Filter by multiple categories
    if (this.selectedCategories.length > 0) {
      filtered = filtered.filter(p => this.selectedCategories.includes(p.category));
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    this.filteredProducts = filtered;
    this.calculatePagination();
    this.updateDisplayedProducts();
  }

  private calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  private updateDisplayedProducts(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.products = this.filteredProducts.slice(startIndex, endIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedProducts();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedProducts();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedProducts();
    }
  }

  getVisiblePages(): number[] {
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  getCategoryCount(category: string): number {
    return this.allProducts.filter(p => p.category === category).length;
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.searchSubject.next(this.searchQuery);
    
    if (!this.searchQuery.trim()) {
      this.currentPage = 1;
      this.applyFilters();
    }
  }

  navigateToProduct(productId: number): void {
    this.router.navigate(['/products', productId]);
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

  selectSuggestion(suggestion: any): void {
    this.searchQuery = suggestion.name;
    this.hideSuggestions();
    this.performSearch();
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
    this.currentPage = 1;
    this.applyFilters();
  }

  private performSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  addToCart(product: any): void {
    this.cartService.addToCart(product);
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }
}