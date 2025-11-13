// src/app/presentation/pages/checkout-page/checkout-page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { AddressService } from '../../../core/services/address.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ProductService } from '../../../core/services/product.service';
import { SharedModule } from '../../../shared/shared.module';
import { Router } from '@angular/router';
import { UserAddress } from '../../../domain/address';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-checkout-page',
  imports: [CommonModule, SharedModule, FormsModule],
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
  
  // Form fields for new address
  newAddress: UserAddress = {
    id: 0,
    label: '',
    street: '',
    postalCode: '',
    city: '',
    country: '',
    phoneAreaCode: '',
    phoneNumber: '',
    isDefault: false
  };

  isSavingAddress = false;

  constructor(
    private cartService: CartService,
    private addressService: AddressService,
    private authService: AuthService,
    private productService: ProductService,
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
    
    if (this.showAddressForm) {
      this.resetAddressForm();
    }
  }

  resetAddressForm(): void {
    this.newAddress = {
      id: 0,
      label: '',
      street: '',
      postalCode: '',
      city: '',
      country: '',
      phoneAreaCode: '',
      phoneNumber: '',
      isDefault: false
    };
  }

  saveAddress(): void {
    const userInfo = this.authService.getUserInfo();
    if (!userInfo) {
      alert('User not logged in');
      return;
    }

    // Validation
    if (!this.newAddress.label.trim() || 
        !this.newAddress.street.trim() || 
        !this.newAddress.postalCode.trim() || 
        !this.newAddress.city.trim() || 
        !this.newAddress.country.trim() || 
        !this.newAddress.phoneAreaCode.trim() || 
        !this.newAddress.phoneNumber.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    this.isSavingAddress = true;

    // Ustawiamy id jako userId
    const addressToSave: UserAddress = {
      ...this.newAddress,
      id: userInfo.id,
      label: this.newAddress.label.trim(),
      street: this.newAddress.street.trim(),
      postalCode: this.newAddress.postalCode.trim(),
      city: this.newAddress.city.trim(),
      country: this.newAddress.country.trim(),
      phoneAreaCode: this.newAddress.phoneAreaCode.trim(),
      phoneNumber: this.newAddress.phoneNumber.trim()
    };

    this.addressService.createAddress(addressToSave).subscribe({
      next: (createdAddress: UserAddress) => {
        console.log('Address created successfully:', createdAddress);
        
        // Reload addresses silently
        this.loadAddresses(userInfo.id);
        
        // Close form and reset
        this.showAddressForm = false;
        this.resetAddressForm();
        this.isSavingAddress = false;
        
        // Select the newly created address
        this.selectedAddress = createdAddress;
      },
      error: (error: any) => {
        console.error('Error creating address:', error);
        alert('Failed to save address. Please try again.');
        this.isSavingAddress = false;
      }
    });
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

  validateInventory(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.cartItems.length === 0) {
        resolve(true);
        return;
      }

      const productRequests = this.cartItems.map(item =>
        this.productService.getProductById(item.id)
      );

      forkJoin(productRequests).subscribe({
        next: (products) => {
          let hasErrors = false;
          const errors: string[] = [];

          products.forEach((product, index) => {
            const cartItem = this.cartItems[index];

            if (product.stock < cartItem.quantity) {
              hasErrors = true;
              errors.push(
                `${product.name}: Requested ${cartItem.quantity}, but only ${product.stock} available`
              );

              this.cartService.updateQuantity(cartItem.id, Math.min(cartItem.quantity, product.stock));
            }
          });

          if (hasErrors) {
            alert(
              'Some products in your cart have insufficient stock:\n\n' +
              errors.join('\n') +
              '\n\nYour cart has been updated with available quantities.'
            );
            resolve(false);
          } else {
            resolve(true);
          }
        },
        error: (error) => {
          console.error('Error validating inventory:', error);
          alert('Failed to validate product availability. Please try again.');
          resolve(false);
        }
      });
    });
  }

  async goToSummary(): Promise<void> {
    if (!this.validateBeforePayment()) return;

    if (!this.selectedPaymentMethodId) {
      alert('Please select a payment method');
      return;
    }

    const inventoryValid = await this.validateInventory();
    if (!inventoryValid) {
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