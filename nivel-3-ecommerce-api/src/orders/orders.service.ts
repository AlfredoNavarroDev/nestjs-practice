import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from 'src/carts/entities/cart.entity';
import { CartItem } from 'src/carts/entities/cart-item.entity';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    // DataSource se usa para abrir un QueryRunner manual y ejecutar
    // la creación de la orden dentro de una transacción atómica.
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<Order[]> {
    return this.ordersRepository.find({
      relations: {
        user: true,
        items: {
          product: true,
        },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order: Order | null = await this.ordersRepository.findOne({
      where: { id },
      relations: {
        user: true,
        items: {
          product: true,
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Orden no encontrada`);
    }

    return order;
  }

  /**
   * Crea una orden a partir del carrito del usuario dentro de una única
   * transacción: valida stock, descuenta stock, crea Order + OrderItems
   * (snapshot de nombre/precio) y vacía el carrito. Si algo falla, se
   * revierte todo (rollback) y no queda estado intermedio en la DB.
   */
  async createFromCart(userId: string): Promise<Order> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const cart: Cart | null = await queryRunner.manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: { user: true, cartItems: { product: true } },
      });

      if (!cart || cart.cartItems.length === 0) {
        throw new BadRequestException(
          'El carrito está vacío o no existe, no se puede crear la orden',
        );
      }

      let total = 0;
      const orderItems: OrderItem[] = [];

      // Recorremos cada item del carrito: validamos stock disponible,
      // lo descontamos y armamos el snapshot que vivirá en OrderItem
      // (nombre y precio en el momento de la compra, no una referencia viva).
      for (const cartItem of cart.cartItems) {
        const product: Product = cartItem.product;

        if (product.stock < cartItem.quantity) {
          throw new ConflictException(
            `Stock insuficiente para el producto "${product.name}"`,
          );
        }

        product.stock -= cartItem.quantity;
        await queryRunner.manager.save(Product, product);

        const subtotal = Number(product.price) * cartItem.quantity;
        total += subtotal;

        orderItems.push(
          queryRunner.manager.create(OrderItem, {
            product,
            productName: product.name,
            unitPrice: product.price,
            quantity: cartItem.quantity,
            subtotal,
          }),
        );
      }

      const order: Order = queryRunner.manager.create(Order, {
        user: cart.user,
        items: orderItems,
        total,
      });
      const savedOrder: Order = await queryRunner.manager.save(Order, order);

      // Orden creada con éxito: el carrito queda vacío para el próximo uso.
      await queryRunner.manager.delete(CartItem, { cart: { id: cart.id } });

      await queryRunner.commitTransaction();

      return savedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
