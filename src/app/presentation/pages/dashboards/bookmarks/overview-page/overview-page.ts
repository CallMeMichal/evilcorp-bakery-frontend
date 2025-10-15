import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { OrderService } from '../../../../../core/services/order.service';
import { ProductService } from '../../../../../core/services/product.service';
import { AuthService } from '../../../../../core/services/auth/auth.service';
import { Order } from '../../../../../domain/order';
import { UserService } from '../../../../../core/services/user.service';

interface Activity {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  time: string;
  type: 'order' | 'account' | 'info';
}

@Component({
  selector: 'app-overview-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './overview-page.html',
  styleUrl: './overview-page.scss'
})
export class OverviewPage implements OnInit {
  userInfo: { name: string; surname: string; role: string; id: number } | null = null;
  orders: Order[] = [];
  isLoading = false;
  error: string | null = null;

  totalOrders = 0;
  activeOrders = 0;
  completedOrders = 0;
  totalSpent = 0;
  averageOrderValue = 0;

  activities: Activity[] = [];
  popularProducts: any[] = [];
  isLoadingProducts = false;

  memberSinceDate: Date | null = null;

  constructor(
    private authService: AuthService,
    private userService : UserService,
    private orderService: OrderService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userInfo = this.authService.getUserInfo();
    
    if (!this.userInfo || !this.userInfo.id) {
      this.error = 'User not authenticated';
      return;
    }

    this.loadDashboardData();
    this.loadPopularProducts();
    this.loadMemberSinceDate();
  }

  loadDashboardData() {
    if (!this.userInfo?.id) return;

    this.isLoading = true;
    this.error = null;

    this.orderService.getOrdersByUserId(this.userInfo.id).subscribe({
      next: (orders) => {
        this.orders = orders.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        this.calculateStats();
        this.generateActivityFeed();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load dashboard data';
        this.isLoading = false;
        console.error('Error loading dashboard:', error);
      }
    });
  }

  loadPopularProducts() {
    this.isLoadingProducts = true;

    this.productService.getProducts().subscribe({
      next: (products) => {
        // Weź pierwsze 3 produkty, które są dostępne (stock > 0)
        this.popularProducts = products
          .filter(p => p.stock > 0)
          .slice(0, 4);
        
        this.isLoadingProducts = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.popularProducts = [];
        this.isLoadingProducts = false;
      }
    });
  }

  calculateStats() {
    this.totalOrders = this.orders.length;
    
    this.activeOrders = this.orders.filter(order => 
      ['pending', 'processing', 'shipped'].includes(order.status.toLowerCase())
    ).length;
    
    this.completedOrders = this.orders.filter(order => 
      order.status.toLowerCase() === 'completed'
    ).length;
    
    this.totalSpent = this.orders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    this.averageOrderValue = this.totalOrders > 0 
      ? this.totalSpent / this.totalOrders 
      : 0;
  }

  generateActivityFeed() {
    const recentOrders = this.orders.slice(0, 3);

    const orderActivities: Activity[] = recentOrders.map((order): Activity => ({
      icon: order.status.toLowerCase() === 'completed' ? 'fa-check-circle' : 'fa-shopping-bag',
      iconColor: order.status.toLowerCase() === 'completed' ? 'green' : 'orange',
      title: `Order ${order.status}`,
      description: `Order #${order.orderGuid.substring(0, 8)}... - ${this.formatPrice(order.totalAmount)}`,
      time: this.getRelativeTime(order.createdAt),
      type: 'order'
    }));

    this.activities = [
      ...orderActivities,
    ].slice(0, 5);
  }

  getRelativeTime(date: Date | string): string {
    const now = new Date();
    const orderDate = new Date(date);
    const diffInMs = now.getTime() - orderDate.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return this.formatDate(date);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  loadMemberSinceDate() {
    if (!this.userInfo?.id) return;

    this.userService.getUserJoinDate(this.userInfo.id).subscribe({
      next: (date) => {
        this.memberSinceDate = date;
      },
      error: (error) => {
        console.error('Error loading member since date:', error);
        this.memberSinceDate = new Date();
      }
    });
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

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  navigateToOrders() {
    this.router.navigate(['/user-dashboard/orders']);
  }

  navigateToProducts() {
    this.router.navigate(['/products']);
  }

  navigateToProduct(productId: number) {
    this.router.navigate(['/products', productId]);
  }

  getOrderTrend(): { percentage: number; isPositive: boolean } {
    if (this.orders.length < 2) return { percentage: 0, isPositive: true };
    
    const lastMonth = this.orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return orderDate > monthAgo;
    }).length;

    const percentage = Math.min(Math.round((lastMonth / this.orders.length) * 100), 100);
    return { percentage, isPositive: percentage >= 50 };
  }

  getSpendingTrend(): { percentage: number; isPositive: boolean } {
    if (this.orders.length === 0) return { percentage: 0, isPositive: true };
    
    const avgSpending = this.averageOrderValue;
    const lastOrderSpending = this.orders[0]?.totalAmount || 0;
    
    if (avgSpending === 0) return { percentage: 0, isPositive: true };
    
    const percentage = Math.round(((lastOrderSpending - avgSpending) / avgSpending) * 100);
    return { percentage: Math.abs(percentage), isPositive: percentage >= 0 };
  }
}