import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../domain/product';

@Component({
  selector: 'app-single-product-page',
  imports: [SharedModule, CommonModule, FormsModule, RouterModule],
  templateUrl: './single-product-page.html',
  styleUrl: './single-product-page.scss'
})
export class SingleProductPage implements OnInit {
  product: Product | null = null;
  isLoading = true;
  error: string | null = null;
  quantity = 1;
  selectedImage: string = '';
  selectedPhotoId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = +params['id'];
      if (productId) {
        this.loadProduct(productId);
      } else {
        this.error = 'Invalid product ID';
        this.isLoading = false;
      }
    });
  }

  private loadProduct(id: number): void {
    this.isLoading = true;
    this.error = null;

    this.productService.getProductById(id).subscribe({
      next: (product) => {
        console.log('Loaded product:', product);
        console.log('Product photos:', product.photos);
        console.log('Photos length:', product.photos?.length);
        
        this.product = product;
        
        // Ustaw główne zdjęcie lub fallback
        this.setMainImage();
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.error = 'Failed to load product. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  private setMainImage(): void {
    if (!this.product) return;
    
    // Sprawdź czy produkt ma zdjęcia
    if (this.product.photos && this.product.photos.length > 0) {
      // Znajdź główne zdjęcie (isMain: true)
      const mainPhoto = this.product.photos.find(photo => photo.isMain);
      
      if (mainPhoto) {
        this.selectedImage = mainPhoto.url;
        this.selectedPhotoId = mainPhoto.id;
      } else {
        // Jeśli nie ma głównego, weź pierwsze dostępne
        this.selectedImage = this.product.photos[0].url;
        this.selectedPhotoId = this.product.photos[0].id;
      }
    } else {
      // Fallback gdy nie ma zdjęć
      this.selectedImage = 'assets/images/no-image.png';
      this.selectedPhotoId = null;
    }
  }

  selectImage(photoUrl: string, photoId: number): void {
    this.selectedImage = photoUrl;
    this.selectedPhotoId = photoId;
  }

  increaseQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (this.product && this.product.stock > 0) {
      for (let i = 0; i < this.quantity; i++) {
        this.cartService.addToCart(this.product);
      }
      alert(`Added ${this.quantity} ${this.product.name}(s) to cart!`);
    }
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  getStockStatus(): string {
    if (!this.product) return '';
    if (this.product.stock === 0) return 'Out of Stock';
    if (this.product.stock < 10) return `Only ${this.product.stock} left`;
    return 'In Stock';
  }

  getStockClass(): string {
    if (!this.product) return '';
    if (this.product.stock === 0) return 'out-of-stock';
    if (this.product.stock < 10) return 'low-stock';
    return 'in-stock';
  }

  hasMultiplePhotos(): boolean {
    return this.product?.photos && this.product.photos.length > 1 || false;
  }

  hasPhotos(): boolean {
    return this.product?.photos && this.product.photos.length > 0 || false;
  }

  // Pomocnicza metoda do uzyskania wszystkich zdjęć
  getPhotos() {
    return this.product?.photos || [];
  }
}