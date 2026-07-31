import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Crea la orden a partir del carrito del usuario; toda la lógica
  // transaccional (stock, snapshot, limpieza de carrito) vive en el service.
  @Post('from-cart/:userId')
  createFromCart(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<Order> {
    return this.ordersService.createFromCart(userId);
  }

  @Get()
  findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Order> {
    return this.ordersService.findOne(id);
  }
}
