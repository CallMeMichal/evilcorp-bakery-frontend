import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../../core/services/product.service';
import { Product } from '../../../../../domain/product';

@Component({
  selector: 'app-product-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-management-page.html',
  styleUrl: './product-management-page.scss'
})
export class ProductManagementPage implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  paginatedProducts: Product[] = [];
  isLoading = false;
  error: string | null = null;
  activeFilter: string = 'all';
  searchQuery: string = '';
  
  // Categories
  categories: string[] = [];
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 0;

  // Modals
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedProduct: Product | null = null;

  // Forms
  createForm: Partial<Product> = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    base64Image: ''
  };

  editForm: Partial<Product> = {};

  // Image preview
  imagePreview: string = '';

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading = true;
    this.error = null;

    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.extractCategories();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load products. Please try again later.';
        this.isLoading = false;
        console.error('Error loading products:', error);
      }
    });
  }

  extractCategories() {
    const categorySet = new Set<string>();
    this.products.forEach(product => {
      if (product.category) {
        categorySet.add(product.category);
      }
    });
    this.categories = Array.from(categorySet).sort();
  }

  filterProducts(category: string) {
    this.activeFilter = category;
    this.currentPage = 1;
    this.applyFilters();
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.products];

    if (this.activeFilter !== 'all') {
      filtered = filtered.filter(product => 
        product.category.toLowerCase() === this.activeFilter.toLowerCase()
      );
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
    }

    this.filteredProducts = filtered;
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
    this.updatePaginatedProducts();
  }

  updatePaginatedProducts() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedProducts();
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

  getTotalProductsCount(): number {
    return this.products.length;
  }

  getLowStockCount(): number {
    return this.products.filter(p => p.stock < 10 && p.stock > 0).length;
  }

  getOutOfStockCount(): number {
    return this.products.filter(p => p.stock === 0).length;
  }

  // CREATE MODAL
  openCreateModal() {
    this.createForm = {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category: this.categories[0] || '',
      base64Image: ''
    };
    this.imagePreview = '';
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.imagePreview = '';
  }

  onCreateImageChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.createForm.base64Image = reader.result as string;
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  createProduct() {
    if (!this.createForm.name || !this.createForm.category) {
      alert('Please fill in all required fields');
      return;
    }

    this.productService.createProduct(this.createForm).subscribe({
      next: (product) => {
        if (product) {
          this.products.unshift(product);
          this.extractCategories();
          this.applyFilters();
          this.closeCreateModal();
        }
      },
      error: (error) => {
        console.error('Error creating product:', error);
        alert('Failed to create product. Please try again.');
      }
    });
  }

  // EDIT MODAL
  openEditModal(product: Product) {
    this.selectedProduct = product;
    this.editForm = {
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      base64Image: product.base64Image
    };
    this.imagePreview = product.base64Image;
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedProduct = null;
    this.imagePreview = '';
  }

  onEditImageChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.editForm.base64Image = reader.result as string;
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  updateProduct() {
    if (!this.selectedProduct) return;

    this.productService.updateProduct(this.selectedProduct.id, this.editForm).subscribe({
      next: (updatedProduct) => {
        if (updatedProduct) {
          const index = this.products.findIndex(p => p.id === updatedProduct.id);
          if (index !== -1) {
            this.products[index] = updatedProduct;
          }
          this.extractCategories();
          this.applyFilters();
          this.closeEditModal();
        }
      },
      error: (error) => {
        console.error('Error updating product:', error);
        alert('Failed to update product. Please try again.');
      }
    });
  }

  // DELETE MODAL
  openDeleteModal(product: Product) {
    this.selectedProduct = product;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedProduct = null;
  }

  confirmDelete() {
    if (!this.selectedProduct) return;

    this.productService.deleteProduct(this.selectedProduct.id).subscribe({
      next: (success) => {
        if (success) {
          this.products = this.products.filter(p => p.id !== this.selectedProduct!.id);
          this.extractCategories();
          this.applyFilters();
          this.closeDeleteModal();
        }
      },
      error: (error) => {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
      }
    });
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  getStockBadgeClass(stock: number): string {
    if (stock === 0) return 'stock-out';
    if (stock < 10) return 'stock-low';
    return 'stock-good';
  }
}