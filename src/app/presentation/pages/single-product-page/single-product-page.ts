import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // DODAJ TO
import { SharedModule } from '../../../shared/shared.module';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../domain/product';

@Component({
  selector: 'app-single-product-page',
  imports: [SharedModule, CommonModule, FormsModule], // DODAJ FormsModule
  templateUrl: './single-product-page.html',
  styleUrl: './single-product-page.scss'
})
export class SingleProductPage implements OnInit {
  product: Product | null = null;
  isLoading = true;
  error: string | null = null;
  quantity = 1;
  selectedImage: string = '';

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
        console.log(product);
        this.product = product;
        this.selectedImage = product.base64Image;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.error = 'Failed to load product. Please try again later.';
        this.isLoading = false;
      }
    });
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
}