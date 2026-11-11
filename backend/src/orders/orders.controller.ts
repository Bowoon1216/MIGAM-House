import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Auth()
  @Post('seasons/:id/orders')
  create(@CurrentUser() user: User, @Param('id') seasonId: string, @Body() dto: CreateOrderDto) {
    return this.orders.create(user, seasonId, dto);
  }

  @Auth()
  @Get('me/orders')
  mine(@CurrentUser() user: User) {
    return this.orders.mine(user);
  }

  @Auth(Role.ADMIN)
  @Get('admin/orders')
  adminList(@Query('status') status?: string) {
    return this.orders.adminList(status);
  }

  @Auth(Role.ADMIN)
  @Patch('admin/orders/:id')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.updateStatus(id, dto.status);
  }
}
