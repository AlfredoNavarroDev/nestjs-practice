import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { User } from 'src/users/entities/user.entity';
import { Product } from 'src/products/entities/product.entity';
import { ProductsService } from 'src/products/products.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    private readonly userService: UsersService,
    private readonly productService: ProductsService,
  ) {}

  async findOrCreateCartByUser(userId: string): Promise<Cart> {
    const existingCart: Cart | null = await this.cartRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
      relations: {
        cartItems: {
          product: true,
        },
      },
    });

    if (existingCart) {
      return existingCart;
    }

    const user: User = await this.userService.findOne(userId);

    const cart: Cart = this.cartRepository.create({ user });
    const savedCart: Cart = await this.cartRepository.save(cart);
    savedCart.cartItems = [];

    return savedCart;
  }

  async findCartByUser(userId: string): Promise<Cart> {
    const findingCart: Cart | null = await this.cartRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
    });

    if (!findingCart) {
      throw new NotFoundException(`No se ha encontrado el carrito`);
    }

    return findingCart;
  }

  async addItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartItem> {
    const cart: Cart = await this.findOrCreateCartByUser(userId);

    const product: Product = await this.productService.findOne(productId);

    const existingItem: CartItem | null = await this.cartItemRepository.findOne(
      {
        where: {
          cart: {
            id: cart.id,
          },
          product: {
            id: product.id,
          },
        },
      },
    );

    // Si el producto ya está en el carrito, sumamos cantidades en vez de
    // crear una fila duplicada (ver @Unique en CartItem).
    if (existingItem) {
      existingItem.quantity += quantity;
      return this.cartItemRepository.save(existingItem);
    }

    const cartItem: CartItem = this.cartItemRepository.create({
      cart,
      product,
      quantity,
    });

    return this.cartItemRepository.save(cartItem);
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartItem> {
    const cart: Cart = await this.findCartByUser(userId);

    const cartItem: CartItem | null = await this.cartItemRepository.findOne({
      where: {
        cart: {
          id: cart.id,
        },
        product: {
          id: productId,
        },
      },
      relations: {
        product: true,
        cart: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException(`Producto no encontrado en el carrito`);
    }

    cartItem.quantity = quantity;

    return this.cartItemRepository.save(cartItem);
  }

  async removeItem(userId: string, productId: string): Promise<void> {
    const cart: Cart | null = await this.cartRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
    });

    if (!cart) {
      throw new NotFoundException(`No se ha encontrado el carrito`);
    }

    const cartItem: CartItem | null = await this.cartItemRepository.findOne({
      where: {
        cart: {
          id: cart.id,
        },
        product: {
          id: productId,
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundException(`Producto no encontrado en el carrito`);
    }

    await this.cartItemRepository.delete({ id: cartItem.id });
  }

  async clearCart(userId: string): Promise<void> {
    const cart: Cart | null = await this.cartRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
    });

    if (!cart) {
      throw new NotFoundException(`No se ha encontrado el carrito`);
    }

    await this.cartItemRepository.delete({
      cart: {
        id: cart.id,
      },
    });
  }

  async getCartWithItems(userId: string): Promise<Cart> {
    return this.findOrCreateCartByUser(userId);
  }
}
