import { Product } from './product';

export interface OrderItem {
  id: number;
  productDTO: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}