import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/interfaces/http/guards/roles.guard';
import { Roles } from '../../../auth/interfaces/http/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/interfaces/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/interfaces/http/types/authenticated-user';
import { PlaceOrderDto } from './dtos/place-order.dto';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import {
  ORDER_REPOSITORY,
  PLACE_ORDER_USE_CASE,
  GET_ORDER_USE_CASE,
  GET_USER_ORDERS_USE_CASE,
  UPDATE_ORDER_STATUS_USE_CASE,
} from '../../order.tokens';
import { PlaceOrderUseCase } from '../../domain/ports/in/place-order.use-case';
import { GetOrderUseCase } from '../../domain/ports/in/get-order.use-case';
import { GetUserOrdersUseCase } from '../../domain/ports/in/get-user-orders.use-case';
import { UpdateOrderStatusUseCase } from '../../domain/ports/in/update-order-status.use-case';
import { OrderRepository } from '../../domain/ports/out/order.repository';
import { Order } from '../../domain/entities/order.entity';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(
    @Inject(PLACE_ORDER_USE_CASE) private readonly placeOrder: PlaceOrderUseCase,
    @Inject(GET_ORDER_USE_CASE) private readonly getOrder: GetOrderUseCase,
    @Inject(GET_USER_ORDERS_USE_CASE) private readonly getUserOrders: GetUserOrdersUseCase,
    @Inject(UPDATE_ORDER_STATUS_USE_CASE)
    private readonly updateStatus: UpdateOrderStatusUseCase,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear pedido desde checkout' })
  async checkout(@Body() dto: PlaceOrderDto, @CurrentUser() user: AuthenticatedUser) {
    const order = await this.placeOrder.execute({ ...dto, userId: user.id });
    return this.toResponse(order);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener pedidos del usuario autenticado' })
  async myOrders(@CurrentUser() user: AuthenticatedUser) {
    const orders = await this.getUserOrders.execute(user.id);
    return orders.map((o) => this.toResponse(o));
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Obtener pedido por número' })
  async getByNumber(@Param('orderNumber') orderNumber: string, @CurrentUser() user: AuthenticatedUser) {
    const order = await this.orderRepo.findByOrderNumber(orderNumber);
    if (!order) return null;
    if (user.role !== 'ADMIN' && order.userId !== user.id) return null;
    return this.toResponse(order);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener pedido por ID' })
  async getById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const order = await this.getOrder.execute(id, user.id, user.role === 'ADMIN');
    return this.toResponse(order);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[Admin] Actualizar estado de pedido' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const order = await this.updateStatus.execute({ orderId: id, newStatus: dto.status });
    return this.toResponse(order);
  }

  private toResponse(order: Order) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      deliveryType: order.deliveryType,
      paymentMethod: order.paymentMethod,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      deliveryStreet: order.deliveryStreet,
      deliveryCity: order.deliveryCity,
      deliveryNotes: order.deliveryNotes,
      couponCode: order.couponCode,
      subtotal: order.subtotal.amount,
      deliveryCost: order.deliveryCost.amount,
      discountAmount: order.discountAmount.amount,
      couponAmount: order.couponAmount.amount,
      total: order.total.amount,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        variantName: item.variantName,
        cakeConfig: item.cakeConfig,
        quantity: item.quantity,
        unitPrice: item.unitPrice.amount,
        discountedUnitPrice: item.discountedUnitPrice?.amount,
        subtotal: item.subtotal.amount,
        imageUrl: item.imageUrl,
      })),
      createdAt: order.createdAt.toISOString(),
    };
  }
}
