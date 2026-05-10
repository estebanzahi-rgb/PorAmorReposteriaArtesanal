import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import {
  PlaceOrderUseCase,
  PlaceOrderCommand,
} from '../../domain/ports/in/place-order.use-case';
import {
  ORDER_REPOSITORY,
  DELIVERY_RATE_REPOSITORY,
} from '../../order.tokens';
import { OrderRepository } from '../../domain/ports/out/order.repository';
import { DeliveryRateRepository } from '../../domain/ports/out/delivery-rate.repository';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { PAYMENT_GATEWAY } from '../../../payment/payment.tokens';
import { PaymentGatewayPort } from '../../../payment/domain/ports/out/payment-gateway.port';
import { DISCOUNT_CALCULATION_SERVICE } from '../../../discount/discount.tokens';
import { DiscountCalculationService } from '../../../discount/domain/services/discount-calculation.service';

@Injectable()
export class PlaceOrderImpl implements PlaceOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    @Inject(DELIVERY_RATE_REPOSITORY)
    private readonly deliveryRateRepo: DeliveryRateRepository,
    @Inject(PAYMENT_GATEWAY) private readonly paymentGateway: PaymentGatewayPort,
    @Inject(DISCOUNT_CALCULATION_SERVICE)
    private readonly discountService: DiscountCalculationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: PlaceOrderCommand): Promise<Order> {
    const discountables = command.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: Money.of(i.unitPrice),
    }));

    const [discountResult, deliveryCost] = await Promise.all([
      this.discountService.calculate(discountables, command.couponCode),
      command.deliveryType === 'DELIVERY'
        ? this.deliveryRateRepo.findAmount()
        : Promise.resolve(Money.zero()),
    ]);

    const items = command.items.map(
      (i) =>
        new OrderItem(
          crypto.randomUUID(),
          i.productId,
          i.productName,
          i.variantId,
          i.variantName,
          i.cakeConfig,
          i.quantity,
          Money.of(i.unitPrice),
          undefined,
          i.imageUrl,
        ),
    );

    const subtotal = items.reduce(
      (acc, i) => acc.add(i.subtotal),
      Money.zero(),
    );
    const total = subtotal
      .add(deliveryCost)
      .subtract(discountResult.regularDiscount)
      .subtract(discountResult.couponDiscount);

    const paymentResult = await this.paymentGateway.charge({
      orderId: 'pending',
      method: command.paymentMethod,
      amount: total,
    });

    if (!paymentResult.success) {
      throw new Error(`Payment failed: ${paymentResult.failureReason}`);
    }

    const year = new Date().getFullYear();
    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase();
    const orderNumber = `PAM-${year}-${suffix}`;

    const order = Order.create({
      id: crypto.randomUUID(),
      orderNumber,
      userId: command.userId,
      deliveryType: command.deliveryType,
      customerName: command.customerName,
      customerPhone: command.customerPhone,
      customerEmail: command.customerEmail,
      subtotal,
      deliveryCost,
      discountAmount: discountResult.regularDiscount,
      couponAmount: discountResult.couponDiscount,
      total,
      paymentMethod: command.paymentMethod,
      items,
      deliveryStreet: command.deliveryStreet,
      deliveryCity: command.deliveryCity,
      deliveryNotes: command.deliveryNotes,
      couponCode: command.couponCode,
    });

    const saved = await this.orderRepo.save(order);

    for (const event of order.pullDomainEvents()) {
      this.eventEmitter.emit(event.eventName, event);
    }

    return saved;
  }
}
