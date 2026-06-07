export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  createAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
