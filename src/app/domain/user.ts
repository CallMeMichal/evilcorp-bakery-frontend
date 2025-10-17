import { UserAddress } from "./address";

export interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  createdAt: Date;
  dateOfBirth: Date;
  isActive: boolean;
  addresses?: UserAddress[];
}