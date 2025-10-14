import { OrderItem } from './order-item';

export interface Order {
  id: number;
  orderGuid : string;
  totalAmount: number;
  status : string;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  items: OrderItem[];
}