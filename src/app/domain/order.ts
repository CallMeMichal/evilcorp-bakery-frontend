import { OrderItem } from './order-item';

export interface Order {
  id: number;
  totalAmount: number;
  notes: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  items: OrderItem[];
}