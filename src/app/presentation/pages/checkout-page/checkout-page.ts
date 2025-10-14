// src/app/presentation/pages/checkout-page/checkout-page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { AddressService } from '../../../core/services/address.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { SharedModule } from '../../../shared/shared.module';
import { Router } from '@angular/router';
import { UserAddress } from '../../../domain/address';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkout-page',
  imports: [CommonModule, SharedModule,FormsModule],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss'
})
export class CheckoutPage implements OnInit {
  cartItems: any[] = [];
  cartTotal = 0;
  subtotal = 0;
  shipping = 5.99;
  
  addresses: UserAddress[] = [];
  selectedAddress: UserAddress | null = null;
  showAddressForm = false;
  deliveryMethod: 'delivery' | 'pickup' = 'delivery';
  selectedPaymentMethodId: number | null = null;
  orderNotes: string = '';
  constructor(
    private cartService: CartService,
    private addressService: AddressService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.calculateTotals();
    });

    if (this.cartItems.length === 0) {
      this.router.navigate(['/']);
      return;
    }

    const userInfo = this.authService.getUserInfo();
    if (userInfo) {
      this.loadAddresses(userInfo.id);
    }
  }

  loadAddresses(userId: number): void {
    this.addressService.getAddressesByUserId(userId).subscribe({
      next: (addresses: UserAddress[]) => {
        this.addresses = addresses;
        const defaultAddress = addresses.find((addr: UserAddress) => addr.isDefault);
        this.selectedAddress = defaultAddress || addresses[0] || null;
        
        if (addresses.length === 0) {
          this.showAddressForm = true;
        }
      },
      error: (error: any) => {
        console.error('Error loading addresses:', error);
        this.showAddressForm = true;
      }
    });
  }

  selectDeliveryMethod(method: 'delivery' | 'pickup'): void {
    this.deliveryMethod = method;
    this.calculateTotals();
  }

  selectAddress(address: UserAddress): void {
    this.selectedAddress = address;
    this.showAddressForm = false;
  }

  isAddressSelected(address: UserAddress): boolean {
    if (!this.selectedAddress) return false;
    
    return this.selectedAddress.id === address.id;
  }

  toggleAddressForm(): void {
    this.showAddressForm = !this.showAddressForm;
  }

  calculateTotals(): void {
    this.subtotal = this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    this.cartTotal = this.deliveryMethod === 'delivery' 
      ? this.subtotal + this.shipping 
      : this.subtotal;
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  validateBeforePayment(): boolean {
    if (this.deliveryMethod === 'delivery' && !this.selectedAddress) {
      alert('Please select a delivery address');
      return false;
    }
    return true;
  }

  selectPaymentMethod(methodId: number): void {
    if (!this.validateBeforePayment()) return;
    this.selectedPaymentMethodId = methodId;
  }

  goToSummary(): void {
    if (!this.validateBeforePayment()) return;
    
    if (!this.selectedPaymentMethodId) {
      alert('Please select a payment method');
      return;
    }

    const orderData = {
      cartItems: this.cartItems,
      subtotal: this.subtotal,
      shipping: this.deliveryMethod === 'delivery' ? this.shipping : 0,
      total: this.cartTotal,
      deliveryMethod: this.deliveryMethod,
      selectedAddress: this.deliveryMethod === 'delivery' ? this.selectedAddress : null,
      paymentMethodId: this.selectedPaymentMethodId,
      notes: this.orderNotes.trim() || null
    };
    sessionStorage.setItem('orderData', JSON.stringify(orderData));
    this.router.navigate(['/summary']);
  }

  payWithBlik(): void {
    this.selectPaymentMethod(1);
  }

  payWithCreditCard(): void {
    this.selectPaymentMethod(2);
  }

  payWithPayPal(): void {
    this.selectPaymentMethod(3);
  }

  payWithApplePay(): void {
    this.selectPaymentMethod(4);
  }

  payWithGooglePay(): void {
    this.selectPaymentMethod(5);
  }

  payWithCash(): void {
    this.selectPaymentMethod(6);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}