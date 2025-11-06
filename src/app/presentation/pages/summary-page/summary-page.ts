
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { CartService } from '../../../core/services/cart.service';

interface OrderData {
  cartItems: any[];
  subtotal: number;
  shipping: number;
  total: number;
  deliveryMethod: 'delivery' | 'pickup';
  selectedAddress: any;
  paymentMethodId: number;
  notes?: string | null;
}

@Component({
  selector: 'app-summary-page',
  imports: [CommonModule, SharedModule],
  templateUrl: './summary-page.html',
  styleUrl: './summary-page.scss'
})
export class SummaryPage implements OnInit {
  orderData: OrderData | null = null;
  isProcessing = false;

  private paymentMethodNames: { [key: number]: string } = {
    1: 'BLIK',
    2: 'Credit Card',
    3: 'PayPal',
    4: 'Apple Pay',
    5: 'Google Pay',
    6: 'Cash on Pickup'
  };

  constructor(
    private router: Router,
    private orderService: OrderService,
    private authService: AuthService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);

    const data = sessionStorage.getItem('orderData');
    
    if (!data) {
      this.router.navigate(['/checkout']);
      return;
    }

    this.orderData = JSON.parse(data);
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  getPaymentMethodName(): string {
    if (!this.orderData?.paymentMethodId) return '';
    return this.paymentMethodNames[this.orderData.paymentMethodId] || '';
  }

  getPaymentIcon(methodId: number): string {
    const methodName = this.paymentMethodNames[methodId];
    const icons: { [key: string]: string } = {
      'BLIK': 'fas fa-mobile-alt',
      'Credit Card': 'fas fa-credit-card',
      'PayPal': 'fab fa-paypal',
      'Apple Pay': 'fab fa-apple',
      'Google Pay': 'fab fa-google',
      'Cash on Pickup': 'fas fa-money-bill-wave'
    };
    return icons[methodName] || 'fas fa-credit-card';
  }

    confirmPayment(): void {
      if (this.isProcessing) return;
      
      this.isProcessing = true;

      const userInfo = this.authService.getUserInfo();
      const paymentData = {
        userId: userInfo?.id,
        deliveryMethod: this.orderData?.deliveryMethod,
        selectedAddress: this.orderData?.selectedAddress,
        paymentMethodId: this.orderData?.paymentMethodId,
        cartItems: this.orderData?.cartItems,
        total: this.orderData?.total,
        notes:this.orderData?.notes
      };

      console.log('Processing payment:', paymentData);

      this.orderService.createOrder(paymentData).subscribe({
        next: (response) => {
          console.log('Order created successfully:', response);
          alert('Payment successful! Order has been placed.');

          // Clear cart after successful order
          this.cartService.clearCart();

          sessionStorage.removeItem('orderData');
          this.router.navigate(['/user-dashboard/orders']);
        },
        error: (error) => {
          console.error('Error creating order:', error);
          alert('Payment failed. Please try again.');
          this.isProcessing = false;
        }
      });
    }

  goBack(): void {
    this.router.navigate(['/checkout']);
  }
}