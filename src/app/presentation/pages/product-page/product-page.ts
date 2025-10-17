import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap, forkJoin } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { Category } from '../../../domain/category';

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
  isLoadingCategories = true;
  isLoadingProducts = true;
  
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
  
  // Category filter - używamy Category[] zamiast string[]
  categories: Category[] = [];
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
    this.loadCategoriesAndProducts();
    
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
        this.applyFilters();
      }
    });
  }

  private loadCategoriesAndProducts(): void {
    forkJoin({
      categories: this.productService.getVisibleCategories(),
      products: this.productService.getProducts()
    }).subscribe({
      next: (result) => {
        this.categories = result.categories;
              console.log(this.categories)
        this.allProducts = result.products;
        this.isLoadingCategories = false;
        this.isLoadingProducts = false;
        this.isLoading = false;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.isLoadingCategories = false;
        this.isLoadingProducts = false;
        this.isLoading = false;
      }
    });
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleCategory(categoryName: string): void {
    const index = this.selectedCategories.indexOf(categoryName);
    if (index > -1) {
      this.selectedCategories.splice(index, 1);
    } else {
      this.selectedCategories.push(categoryName);
    }
    this.currentPage = 1;
    this.applyFilters();
  }

  isCategorySelected(categoryName: string): boolean {
    return this.selectedCategories.includes(categoryName);
  }

  clearCategories(): void {
    this.selectedCategories = [];
    this.currentPage = 1;
    this.applyFilters();
  }

  removeCategory(categoryName: string): void {
    const index = this.selectedCategories.indexOf(categoryName);
    if (index > -1) {
      this.selectedCategories.splice(index, 1);
      this.currentPage = 1;
      this.applyFilters();
    }
  }

  getMainProductImage(product: any): string {
    if (!product.photos || product.photos.length === 0) {
      return 'assets/images/no-image.png';
    }
    
    const mainPhoto = product.photos.find((photo: any) => photo.isMain);
    if (mainPhoto) {
      return mainPhoto.url;
    }
    
    return product.photos[0].url;
  }

  getSuggestionImage(suggestion: any): string {
    if (!suggestion.photos || suggestion.photos.length === 0) {
      return 'assets/images/no-image.png';
    }
    
    const mainPhoto = suggestion.photos.find((photo: any) => photo.isMain);
    if (mainPhoto) {
      return mainPhoto.url;
    }
    
    return suggestion.photos[0].url;
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

    // Filter by multiple categories
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

  getCategoryCount(categoryName: string): number {
    return this.allProducts.filter(p => p.category === categoryName).length;
  }

  getCategoryName(category: Category): string {
    return category.name;
  }

  getCategoryId(category: Category): number {
    return category.id;
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