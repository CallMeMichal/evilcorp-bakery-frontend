import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../../../core/services/order.service'; 
import { Order } from '../../../../../domain/order'; 
import { Product } from '../../../../../domain/product';
import { ProductPhotos } from '../../../../../domain/productPhotos';
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
  filteredOrders: Order[] = [];
  paginatedOrders: Order[] = [];
  isLoading = false;
  error: string | null = null;
  userId: number | null = null;
  activeFilter: string = 'all';
  
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
        this.applyFilter();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load orders. Please try again later.';
        this.isLoading = false;
        console.error('Error loading orders:', error);
      }
    });
  }

  filterOrders(status: string) {
    this.activeFilter = status;
    this.currentPage = 1;
    this.applyFilter();
  }

  applyFilter() {
    if (this.activeFilter === 'all') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter(order => 
        order.status.toLowerCase() === this.activeFilter.toLowerCase()
      );
    }
    
    this.totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
    this.updatePaginatedOrders();
  }

  updatePaginatedOrders() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedOrders = this.filteredOrders.slice(startIndex, endIndex);
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

  getActiveOrdersCount(): number {
    return this.orders.filter(order => 
      order.status.toLowerCase() === 'pending' || 
      order.status.toLowerCase() === 'processing' ||
      order.status.toLowerCase() === 'shipped'
    ).length;
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

  // ZAKTUALIZOWANA METODA - pobiera główne zdjęcie z nowej struktury
  getProductMainImage(product: Product): string {
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

  // STARA METODA - zachowana dla backward compatibility jeśli gdzieś jeszcze jest używana
  getImageSrc(base64Image: string): string {
    if (!base64Image) {
      return 'assets/images/no-image.png';
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

  getStatusClass(status: string): string {
    const statusName = status.toLowerCase();
    
    switch(statusName) {
      case 'pending':
        return 'status-pending';
      case 'processing':
        return 'status-processing';
      case 'shipped':
        return 'status-shipped';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  }
}