import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth/auth.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-panel.html',
  styleUrl: './user-panel.scss'
})
export class UserPanel implements OnInit {
  
  constructor(private authService: AuthService, private router: Router) {}

  activeTab: string = 'overview';
  isLoggedIn = false;
  userInfo: { name: string; surname: string; role: string } | null = null;
  userRole: string = '';
  dashboardPrefix: string = 'user-dashboard'; // DODAJ TO

  ngOnInit() {
    this.userInfo = this.authService.getUserInfo();
    this.userRole = this.userInfo?.role || '';
    
    // DODAJ TO - ustaw prefix w zależności od roli
    this.dashboardPrefix = this.userRole.toLowerCase().includes('admin') 
      ? 'admin-dashboard' 
      : 'user-dashboard';
  }

  // Metoda sprawdzająca dostęp do zakładki
  hasAccess(tab: string): boolean {
    const rolePermissions: { [key: string]: string[] } = {
      'admin': ['overview', 'orders', 'customers', 'analytics', 'products', 'settings'],
      'user': ['overview','orders', 'settings'],
    };

    const permissions = rolePermissions[this.userRole.toLowerCase()];
    return permissions?.includes(tab) || false;
  }
  
  setActiveTab(tab: string) {
    if (this.hasAccess(tab)) {
      this.activeTab = tab;
    } else {
      console.warn('Access error:', tab);
    }
  }

  logout() {
    this.authService.logout();
    this.isLoggedIn = false;
    this.userInfo = null;
    this.router.navigate(['/']);
  }
}