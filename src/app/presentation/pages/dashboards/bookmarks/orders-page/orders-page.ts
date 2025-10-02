import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../../../core/services/order.service'; 
import { Order } from '../../../../../domain/order'; 
import { CoreModule } from '../../../../../core/core.module';
import { AuthService } from '../../../../../core/services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, CoreModule, RouterModule],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.scss'
})
export class OrdersPage implements OnInit {
  orders: Order[] = [];
  paginatedOrders: Order[] = [];
  isLoading = false;
  error: string | null = null;
  userId: number | null = null;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 4;
  totalPages = 0;

  constructor(
    private orderService: OrderService, 
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const userInfo = this.authService.getUserInfo();
    
    if (!userInfo || !userInfo.id) {
      this.error = 'User not authenticated';
      return;
    }

    this.userId = userInfo.id;
    this.loadOrders();
  }

  loadOrders() {
    if (!this.userId) {
      this.error = 'User ID not found';
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.orderService.getOrdersByUserId(this.userId).subscribe({
      next: (orders) => {
        this.orders = orders.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.totalPages = Math.ceil(this.orders.length / this.itemsPerPage);
        this.updatePaginatedOrders();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load orders. Please try again later.';
        this.isLoading = false;
        console.error('Error loading orders:', error);
      }
    });
  }

  updatePaginatedOrders() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedOrders = this.orders.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedOrders();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getVisiblePages(): number[] {
    const maxVisible = 3;
    const pages: number[] = [];
    
    if (this.totalPages <= maxVisible) {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }
    
    let startPage = Math.max(1, this.currentPage - 1);
    let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toUpperCase();
  }

  getOrderItemsCount(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalSpent(): number {
    return this.orders.reduce((total, order) => total + order.totalAmount, 0);
  }

  getImageSrc(base64Image: string): string {
    if (!base64Image) {
      return 'assets/placeholder.jpg';
    }
    
    if (base64Image.startsWith('data:image')) {
      return base64Image;
    }
    
    return `data:image/jpeg;base64,${base64Image}`;
  }

    navigateToProduct(productId: number): void {
    this.router.navigate(['/products', productId]);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }
}