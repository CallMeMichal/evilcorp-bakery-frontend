import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../../core/services/user.service';
import { User } from '../../../../../domain/user';
import { UserAddress } from '../../../../../domain/address';

// Interface dla formularza edycji
interface EditUserForm {
  name?: string;
  surname?: string;
  email?: string;
  role?: string;
  dateOfBirth?: string;
  isActive?: boolean;
  addresses?: UserAddress[];
}

@Component({
  selector: 'app-customers-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers-page.html',
  styleUrl: './customers-page.scss'
})
export class CustomersPage implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];
  isLoading = false;
  error: string | null = null;
  activeFilter: string = 'all';
  searchQuery: string = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 0;

  // Edit Modal
  showEditModal = false;
  selectedUser: User | null = null;
  editForm: EditUserForm = {};
  isUpdating = false;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.error = null;

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load users. Please try again later.';
        this.isLoading = false;
        console.error('Error loading users:', error);
      }
    });
  }

  filterUsers(filter: string) {
    this.activeFilter = filter;
    this.currentPage = 1;
    this.applyFilters();
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.users];

    if (this.activeFilter !== 'all') {
      switch (this.activeFilter) {
        case 'admin':
          filtered = filtered.filter(user => user.role.toLowerCase() === 'admin');
          break;
        case 'user':
          filtered = filtered.filter(user => user.role.toLowerCase() === 'user');
          break;
        case 'active':
          filtered = filtered.filter(user => user.isActive === true);
          break;
        case 'inactive':
          filtered = filtered.filter(user => user.isActive === false);
          break;
      }
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.surname.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    this.filteredUsers = filtered;
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    this.updatePaginatedUsers();
  }

  updatePaginatedUsers() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedUsers();
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

  // Statistics methods
  getTotalUsersCount(): number {
    return this.users.length;
  }

  getAdminCount(): number {
    return this.users.filter(user => 
      user.role.toLowerCase() === 'admin'
    ).length;
  }

  getUserCount(): number {
    return this.users.filter(user => 
      user.role.toLowerCase() === 'user'
    ).length;
  }

  getActiveUsersCount(): number {
    return this.users.filter(user => user.isActive === true).length;
  }

  getInactiveUsersCount(): number {
    return this.users.filter(user => user.isActive === false).length;
  }

  // Edit modal methods
  openEditModal(user: User) {
    console.log('User data from API:', user); // Debug

    this.selectedUser = user;
    this.editForm = {
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role === 'Admin' ? 'Administrator' : user.role, // ✅ Mapowanie Admin -> Administrator
      dateOfBirth: this.formatDateForInput(user.dateOfBirth), // ✅ Formatowanie ISO -> YYYY-MM-DD
      isActive: user.isActive,
      addresses: user.addresses ? [...user.addresses] : []
    };
    
    console.log('Mapped editForm:', this.editForm); // Debug
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedUser = null;
    this.editForm = {};
    this.isUpdating = false;
  }

  addAddress() {
    if (!this.editForm.addresses) {
      this.editForm.addresses = [];
    }
    
    const newAddress: UserAddress = {
      id: 0,
      street: '',
      city: '',
      postalCode: '',
      country: '',
      isDefault: this.editForm.addresses.length === 0,
      label: '',
      phoneNumber: '',
      phoneAreaCode: ''
    };
    
    this.editForm.addresses.push(newAddress);
  }

  removeAddress(index: number) {
    if (this.editForm.addresses) {
      this.editForm.addresses.splice(index, 1);
    }
  }

  setDefaultAddress(index: number) {
    if (this.editForm.addresses) {
      this.editForm.addresses.forEach((addr: UserAddress, i: number) => {
        addr.isDefault = i === index;
      });
    }
  }

  private prepareUpdateData(): Partial<User> {
  return {
    name: this.editForm.name,
    surname: this.editForm.surname,
    email: this.editForm.email,
    role: this.editForm.role === 'Administrator' ? 'Admin' : this.editForm.role,
    dateOfBirth: this.editForm.dateOfBirth ? new Date(this.editForm.dateOfBirth) : undefined,
    isActive: this.editForm.isActive,
    addresses: this.editForm.addresses
  };
}

  confirmUpdate() {
    if (!this.selectedUser || this.isUpdating) return;

    this.isUpdating = true;
    const updateData = this.prepareUpdateData();

    this.userService.updateUser(this.selectedUser.id, updateData).subscribe({
      next: (updatedUser) => {
        // ✅ Natychmiastowa aktualizacja lokalnych danych
        const userIndex = this.users.findIndex(u => u.id === updatedUser.id);
        if (userIndex !== -1) {
          this.users[userIndex] = updatedUser;
        }
        
        this.applyFilters();
        this.closeEditModal();
        
        // ✅ Opcjonalnie: ciche odświeżenie w tle dla pewności
        this.silentRefresh();
      },
      error: (error) => {
        console.error('Error updating user:', error);
        alert('Failed to update user. Please try again.');
        this.isUpdating = false;
      }
    });
  }

  private silentRefresh() {
    // Ciche odświeżenie bez pokazywania loaderów
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.applyFilters();
        this.isUpdating = false;
      },
      error: () => {
        // Cichy błąd - dane lokalne już są zaktualizowane
        this.isUpdating = false;
      }
    });
  }

  // Helper methods
  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDateForInput(date: Date | string): string {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  getRoleBadgeClass(role: string): string {
    return role.toLowerCase() === 'admin' ? 'role-admin' : 'role-user';
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
  }

  getUserInitials(user: User): string {
    return `${user.name.charAt(0)}${user.surname.charAt(0)}`.toUpperCase();
  }
}