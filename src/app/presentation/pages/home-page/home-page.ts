import { Component, OnInit } from '@angular/core';
import { Product } from '../../../domain/product';
import { ProductPhotos } from '../../../domain/productPhotos';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, SharedModule, RouterModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss'
})
export class HomePage implements OnInit {
  stars = [1, 2, 3, 4, 5];
  products: Product[] = [];
  featuredProducts: Product[] = [];
  isLoading = true;

  constructor(
    private productService: ProductService,
    private router: Router,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  goHome() {
    this.router.navigate(['/']);
  }

  private loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.featuredProducts = products.slice(0, 8);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
      }
    });
  }

  // Metoda do pobierania głównego zdjęcia produktu
  getMainProductImage(product: Product): string {
    if (!product.photos || product.photos.length === 0) {
      return 'assets/images/no-image.png'; // fallback image
    }
    
    // Znajdź główne zdjęcie
    const mainPhoto = product.photos.find((photo: ProductPhotos) => photo.isMain);
    if (mainPhoto) {
      return mainPhoto.url;
    }
    
    // Jeśli nie ma głównego, weź pierwsze dostępne
    return product.photos[0].url;
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product);
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }
}