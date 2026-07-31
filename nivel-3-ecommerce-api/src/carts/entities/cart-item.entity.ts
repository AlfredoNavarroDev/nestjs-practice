import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Product } from 'src/products/entities/product.entity';
import { Cart } from './cart.entity';

// Un mismo producto no puede repetirse como fila distinta en el mismo carrito;
// CartsService.addItem() aprovecha esto sumando quantity al item existente.
@Entity({ name: 'cart_items' })
@Unique('uq_cart_product', ['cart', 'product'])
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  quantity: number;

  @ManyToOne(() => Product, (product) => product.cartItems, {
    nullable: false,
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Cart, (cart) => cart.cartItems, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;
}
