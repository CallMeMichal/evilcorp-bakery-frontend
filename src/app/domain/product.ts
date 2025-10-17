import { ProductPhotos } from "./productPhotos";

export interface Product {
  id: number;
  name: string;
  category : string;
  description : string;
  price: number;
  stock: number;
  photos: ProductPhotos[];
}