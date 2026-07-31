import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get(':userId')
  getCartWithItems(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<Cart> {
    return this.cartsService.getCartWithItems(userId);
  }

  @Post(':userId/items')
  addItem(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: AddCartItemDto,
  ): Promise<CartItem> {
    return this.cartsService.addItem(userId, dto.productId, dto.quantity);
  }

  @Patch(':userId/items/:productId')
  updateItemQuantity(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartsService.updateItemQuantity(
      userId,
      productId,
      dto.quantity,
    );
  }

  @Delete(':userId/items/:productId')
  removeItem(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.cartsService.removeItem(userId, productId);
  }

  @Delete(':userId')
  clearCart(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.cartsService.clearCart(userId);
  }
}
