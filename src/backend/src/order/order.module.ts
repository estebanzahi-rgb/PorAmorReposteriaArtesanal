import { Module } from '@nestjs/common';
import { PaymentModule } from '../payment/payment.module';
import { DiscountModule } from '../discount/discount.module';
import { OrderPrismaRepository } from './infrastructure/persistence/order.prisma.repository';
import { DeliveryRatePrismaRepository } from './infrastructure/persistence/delivery-rate.prisma.repository';
import { PlaceOrderImpl } from './application/use-cases/place-order.impl';
import { GetOrderImpl } from './application/use-cases/get-order.impl';
import { GetUserOrdersImpl } from './application/use-cases/get-user-orders.impl';
import { UpdateOrderStatusImpl } from './application/use-cases/update-order-status.impl';
import { OrderController } from './interfaces/http/order.controller';
import { DeliveryRateController } from './interfaces/http/delivery-rate.controller';
import { AdminOrderController } from './interfaces/http/admin-order.controller';
import {
  ORDER_REPOSITORY,
  DELIVERY_RATE_REPOSITORY,
  PLACE_ORDER_USE_CASE,
  GET_ORDER_USE_CASE,
  GET_USER_ORDERS_USE_CASE,
  UPDATE_ORDER_STATUS_USE_CASE,
} from './order.tokens';

@Module({
  imports: [PaymentModule, DiscountModule],
  providers: [
    { provide: ORDER_REPOSITORY, useClass: OrderPrismaRepository },
    { provide: DELIVERY_RATE_REPOSITORY, useClass: DeliveryRatePrismaRepository },
    { provide: PLACE_ORDER_USE_CASE, useClass: PlaceOrderImpl },
    { provide: GET_ORDER_USE_CASE, useClass: GetOrderImpl },
    { provide: GET_USER_ORDERS_USE_CASE, useClass: GetUserOrdersImpl },
    { provide: UPDATE_ORDER_STATUS_USE_CASE, useClass: UpdateOrderStatusImpl },
  ],
  controllers: [OrderController, DeliveryRateController, AdminOrderController],
  exports: [ORDER_REPOSITORY],
})
export class OrderModule {}
