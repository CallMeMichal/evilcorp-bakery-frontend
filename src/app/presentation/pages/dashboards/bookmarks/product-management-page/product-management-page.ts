import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../../core/services/product.service';
import { Product } from '../../../../../domain/product';
import { ProductPhotos } from '../../../../../domain/productPhotos';
import { Category } from '../../../../../domain/category';

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
  
  // Kategorie do filtrowania (tylko aktywne)
  categories: string[] = [];
  // Wszystkie kategorie z API (aktywne i nieaktywne)
  allCategories: Category[] = [];
  // Tylko aktywne kategorie dla użytkowników
  visibleCategories: Category[] = [];
  
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 0;

  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedProduct: Product | null = null;

  // Image viewer properties
  showImageViewer = false;
  viewerImages: { url: string, isMain: boolean, isExisting: boolean }[] = [];
  currentImageIndex = 0;

  showCategoryModal = false;
  newCategoryName = '';
  categoryToDelete: Category | null = null;
  isCategoryLoading = false;

  categoryFilter: 'all' | 'active' | 'inactive' = 'all';

  isSilentLoading = false;

  createForm: Partial<Product> = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    photos: []
  };

  editForm: Partial<Product> = {};

  createFormPhotos: File[] = [];
  editFormPhotos: File[] = [];
  createPhotoPreviews: string[] = [];
  editPhotoPreviews: string[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadProductsAndCategories();
  }


  loadProductsAndCategories(silent: boolean = false) {
    if (!silent) {
      this.isLoading = true;
    } else {
      this.isSilentLoading = true;
    }
    
    this.error = null;

    Promise.all([
      this.productService.getProducts().toPromise(),
      this.productService.getVisibleCategories().toPromise(),
      this.productService.getAllCategoriesAdmin().toPromise()
    ]).then(([products, visibleCategories, allCategories]) => {
      this.products = products || [];
      this.visibleCategories = visibleCategories || [];
      this.allCategories = allCategories || [];
      
      this.categories = this.visibleCategories.map(cat => cat.name).sort();
      
      this.applyFilters();
      
      if (!silent) {
        this.isLoading = false;
      } else {
        this.isSilentLoading = false;
      }
    }).catch(error => {
      this.error = 'Failed to load data. Please try again later.';
      
      if (!silent) {
        this.isLoading = false;
      } else {
        this.isSilentLoading = false;
      }
      
      console.error('Error loading data:', error);
    });
  }

  loadProducts() {
    this.isLoading = true;
    this.error = null;

    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
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

  loadAllCategories() {
    this.isCategoryLoading = true;
    
    Promise.all([
      this.productService.getVisibleCategories().toPromise(),
      this.productService.getAllCategoriesAdmin().toPromise()
    ]).then(([visibleCategories, allCategories]) => {
      this.visibleCategories = visibleCategories || [];
      this.allCategories = allCategories || [];
      
      // Aktualizuj dostępne kategorie do filtrowania
      this.categories = this.visibleCategories.map(cat => cat.name).sort();
      
      this.isCategoryLoading = false;
    }).catch(error => {
      console.error('Error loading categories:', error);
      this.isCategoryLoading = false;
    });
  }

  // Metoda pomocnicza do pobierania wszystkich dostępnych kategorii dla edycji
  getAllAvailableCategories(): string[] {
    const activeCategories = this.categories;
    const currentCategory = this.editForm.category;
    
    // Jeśli obecna kategoria nie jest w liście aktywnych, dodaj ją
    if (currentCategory && !activeCategories.includes(currentCategory)) {
      return [...activeCategories, currentCategory].sort();
    }
    
    return activeCategories;
  }

  getMainPhoto(product: Product): ProductPhotos | null {
    return product.photos?.find(photo => photo.isMain) || product.photos?.[0] || null;
  }

  hasMultiplePhotos(product: Product): boolean {
    return (product.photos?.length || 0) > 1;
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

  // Statystyki kategorii
  getCategoryStats() {
    return {
      totalCategories: this.allCategories.length,
      activeCategories: this.allCategories.filter(cat => cat.isActive).length,
      inactiveCategories: this.allCategories.filter(cat => !cat.isActive).length
    };
  }

  // Image Viewer Methods
  openImageViewer(productPhotos: ProductPhotos[], newPhotoPreviews: string[] = [], clickedIndex: number = 0, isExisting: boolean = true) {
    this.viewerImages = [];
    
    productPhotos.forEach(photo => {
      this.viewerImages.push({
        url: photo.url,
        isMain: photo.isMain,
        isExisting: true
      });
    });
    
    newPhotoPreviews.forEach(preview => {
      this.viewerImages.push({
        url: preview,
        isMain: false,
        isExisting: false
      });
    });

    if (isExisting) {
      this.currentImageIndex = clickedIndex;
    } else {
      this.currentImageIndex = productPhotos.length + clickedIndex;
    }

    this.showImageViewer = true;
  }

  closeImageViewer() {
    this.showImageViewer = false;
    this.viewerImages = [];
    this.currentImageIndex = 0;
  }

  previousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    } else {
      this.currentImageIndex = this.viewerImages.length - 1;
    }
  }

  nextImage() {
    if (this.currentImageIndex < this.viewerImages.length - 1) {
      this.currentImageIndex++;
    } else {
      this.currentImageIndex = 0;
    }
  }

  goToImage(index: number) {
    this.currentImageIndex = index;
  }

  getCurrentImage(): { url: string, isMain: boolean, isExisting: boolean } | null {
    if (!this.viewerImages.length || this.currentImageIndex < 0 || this.currentImageIndex >= this.viewerImages.length) {
      return null;
    }
    return this.viewerImages[this.currentImageIndex];
  }

  // CREATE MODAL
  openCreateModal() {
    this.createForm = {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category: this.categories[0] || '',
      photos: []
    };
    this.createFormPhotos = [];
    this.createPhotoPreviews = [];
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.createFormPhotos = [];
    this.createPhotoPreviews = [];
  }

  onCreateImagesChange(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.createFormPhotos = [...this.createFormPhotos, ...files];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        this.createPhotoPreviews.push(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  removeCreatePhoto(index: number) {
    this.createFormPhotos.splice(index, 1);
    this.createPhotoPreviews.splice(index, 1);
    if (this.showImageViewer) {
      this.closeImageViewer();
    }
  }

  setMainCreatePhoto(index: number) {
    const photo = this.createFormPhotos.splice(index, 1)[0];
    const preview = this.createPhotoPreviews.splice(index, 1)[0];
    
    this.createFormPhotos.unshift(photo);
    this.createPhotoPreviews.unshift(preview);
    
    if (this.showImageViewer) {
      this.closeImageViewer();
    }
  }

  createProduct() {
    if (!this.createForm.name || !this.createForm.category || this.createFormPhotos.length === 0) {
      alert('Please fill in all required fields and add at least one photo');
      return;
    }

    const photos: ProductPhotos[] = [];
    let processedCount = 0;

    this.createFormPhotos.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        photos.push({
          id: 0,
          url: reader.result as string,
          isMain: index === 0
        });
        
        processedCount++;
        if (processedCount === this.createFormPhotos.length) {
          this.createForm.photos = photos;
          this.submitCreateProduct();
        }
      };
      reader.readAsDataURL(file);
    });
  }

  private submitCreateProduct() {
    this.productService.createProduct(this.createForm).subscribe({
      next: (product) => {
        if (product) {
          this.products.unshift(product);
          this.applyFilters();
          this.closeCreateModal();
          this.loadProductsAndCategories(true);
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
      photos: [...(product.photos || [])]
    };
    this.editFormPhotos = [];
    this.editPhotoPreviews = [];
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedProduct = null;
    this.editFormPhotos = [];
    this.editPhotoPreviews = [];
    if (this.showImageViewer) {
      this.closeImageViewer();
    }
  }

  onEditImagesChange(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.editFormPhotos = [...this.editFormPhotos, ...files];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        this.editPhotoPreviews.push(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  removeEditPhoto(index: number, isExisting: boolean = false) {
    if (isExisting) {
      this.editForm.photos?.splice(index, 1);
    } else {
      const adjustedIndex = index;
      this.editFormPhotos.splice(adjustedIndex, 1);
      this.editPhotoPreviews.splice(adjustedIndex, 1);
    }
    
    if (this.showImageViewer) {
      this.closeImageViewer();
    }
  }

  setMainEditPhoto(index: number, isExisting: boolean = false) {
    if (isExisting && this.editForm.photos) {
      this.editForm.photos.forEach((photo, i) => {
        photo.isMain = i === index;
      });
      
      if (this.showImageViewer) {
        this.closeImageViewer();
      }
    }
  }

  updateProduct() {
    if (!this.selectedProduct) return;

    const allPhotos = [...(this.editForm.photos || [])];
    
    if (this.editFormPhotos.length > 0) {
      let processedCount = 0;
      
      this.editFormPhotos.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          allPhotos.push({
            id: 0,
            url: reader.result as string,
            isMain: false
          });
          
          processedCount++;
          if (processedCount === this.editFormPhotos.length) {
            this.editForm.photos = allPhotos;
            this.submitUpdateProduct();
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      this.submitUpdateProduct();
    }
  }

  private submitUpdateProduct() {
    if (!this.selectedProduct) return;

    this.productService.updateProduct(this.selectedProduct.id, this.editForm).subscribe({
      next: (updatedProduct) => {
        if (updatedProduct) {
          const index = this.products.findIndex(p => p.id === updatedProduct.id);
          if (index !== -1) {
            this.products[index] = updatedProduct;
          }
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

  // CATEGORY MANAGEMENT
  openCategoryModal() {
    this.newCategoryName = '';
    this.categoryToDelete = null;
    this.categoryFilter = 'all'; // Reset filter when opening modal
    this.showCategoryModal = true;
    this.loadAllCategories();
  }

  closeCategoryModal() {
    this.showCategoryModal = false;
    this.newCategoryName = '';
    this.categoryToDelete = null;

    this.loadProductsAndCategories(true);
  }

  addCategory() {
    const categoryName = this.newCategoryName.trim();
    
    if (!categoryName) {
      alert('Please enter a category name');
      return;
    }
    
    if (this.allCategories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
      alert('Category already exists');
      return;
    }
    
    this.productService.createCategory(categoryName).subscribe({
      next: (success) => {
        if (success) {
          this.newCategoryName = '';
          this.loadAllCategories();
        }
      },
      error: (error) => {
        console.error('Error creating category:', error);
        alert('Failed to create category. Please try again.');
      }
    });
  }

  toggleCategoryStatus(category: Category) {
    const action = category.isActive ? 'deactivate' : 'activate';
    const serviceMethod = category.isActive 
      ? this.productService.deactivateCategory(category.id)
      : this.productService.activateCategory(category.id);

    serviceMethod.subscribe({
      next: (success) => {
        if (success) {
          this.loadAllCategories();
        }
      },
      error: (error) => {
        console.error(`Error ${action}ing category:`, error);
        alert(`Failed to ${action} category. Please try again.`);
      }
    });
  }

  confirmDeleteCategory(category: Category) {
    this.categoryToDelete = category;
  }

  deleteCategory() {
    if (!this.categoryToDelete) return;
    
    // Sprawdź czy kategoria jest używana przez jakiś produkt
    const isUsed = this.products.some(product => product.category === this.categoryToDelete!.name);
    
    if (isUsed) {
      alert(`Cannot delete category "${this.categoryToDelete.name}" because it is used by some products.`);
      this.categoryToDelete = null;
      return;
    }
  

    //todo usuwanie
    
    this.categoryToDelete = null;
    alert('Category deletion would be implemented here');
  }

  cancelDeleteCategory() {
    this.categoryToDelete = null;
  }

  isCategoryInUse(categoryName: string): boolean {
    return this.products.some(product => product.category === categoryName);
  }
  
  getCategoryProductCount(categoryName: string): number {
    return this.products.filter(product => product.category === categoryName).length;
  }

  getFilteredCategories(): Category[] {
    switch (this.categoryFilter) {
      case 'active':
        return this.allCategories.filter(cat => cat.isActive);
      case 'inactive':
        return this.allCategories.filter(cat => !cat.isActive);
      default:
        return this.allCategories;
    }
  }

  setCategoryFilter(filter: 'all' | 'active' | 'inactive') {
    this.categoryFilter = filter;
  }

}