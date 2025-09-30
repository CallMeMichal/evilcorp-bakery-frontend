// src/app/pages/checkout/checkout-page/checkout-page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { SharedModule } from '../../../shared/shared.module';
import { Router } from '@angular/router';

@Component({
  selector: 'app-checkout-page',
  imports: [CommonModule, SharedModule],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss'
})
export class CheckoutPage implements OnInit {
  cartItems: any[] = [];
  cartTotal = 0;
  subtotal = 0;
  tax = 0;
  shipping = 5.99;

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.calculateTotals();
    });

    // Redirect to home if cart is empty
    if (this.cartItems.length === 0) {
      this.router.navigate(['/']);
    }
  }

  calculateTotals(): void {
    this.subtotal = this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    this.tax = this.subtotal * 0.08; // 8% tax
    this.cartTotal = this.subtotal + this.tax + this.shipping;
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  payWithCreditCard(): void {
    console.log('Credit Card payment selected');
  }

  payWithPayPal(): void {
    console.log('PayPal payment selected');
  }

  payWithApplePay(): void {
    console.log('Apple Pay payment selected');
  }

  payWithGooglePay(): void {
    console.log('Google Pay payment selected');
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}