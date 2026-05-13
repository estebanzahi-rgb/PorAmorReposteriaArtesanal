import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/interfaces/http/guards/roles.guard';
import { Roles } from '../../../auth/interfaces/http/decorators/roles.decorator';
import { ORDER_REPOSITORY, UPDATE_ORDER_STATUS_USE_CASE } from '../../order.tokens';
import { OrderRepository } from '../../domain/ports/out/order.repository';
import { UpdateOrderStatusUseCase } from '../../domain/ports/in/update-order-status.use-case';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { Order } from '../../domain/entities/order.entity';

@ApiTags('admin-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/orders')
export class AdminOrderController {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    @Inject(UPDATE_ORDER_STATUS_USE_CASE) private readonly updateStatus: UpdateOrderStatusUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: '[Admin] Listar todos los pedidos' })
  async listAll(
    @Query('status') status?: string,
    @Query('deliveryType') deliveryType?: string,
    @Query('q') q?: string,
  ) {
    const orders = await this.orderRepo.findAll({
      ...(status ? { status: status as Order['status'] } : {}),
      ...(deliveryType ? { deliveryType: deliveryType as Order['deliveryType'] } : {}),
      ...(q ? { customerName: q } : {}),
    });
    return orders.map((o) => this.toResponse(o));
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] Obtener pedido por ID' })
  async getById(@Param('id') id: string) {
    const order = await this.orderRepo.findById(id);
    return order ? this.toResponse(order) : null;
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '[Admin] Actualizar estado de pedido' })
  async updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
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
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.amount,
        subtotal: item.subtotal.amount,
      })),
      createdAt: order.createdAt.toISOString(),
    };
  }
}
