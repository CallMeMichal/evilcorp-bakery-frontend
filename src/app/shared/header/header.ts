import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
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
  userInfo: { name: string; surname:string; role: string } | null = null;

  constructor(
    private router: Router,
    private cartService: CartService,
    private authService: AuthService
  ) {}

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