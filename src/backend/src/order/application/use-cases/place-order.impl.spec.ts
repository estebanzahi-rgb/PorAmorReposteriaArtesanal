import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlaceOrderImpl } from './place-order.impl';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import type { OrderRepository } from '../../domain/ports/out/order.repository';
import type { DeliveryRateRepository } from '../../domain/ports/out/delivery-rate.repository';
import type { PaymentGatewayPort } from '../../../payment/domain/ports/out/payment-gateway.port';
import type { DiscountCalculationService } from '../../../discount/domain/services/discount-calculation.service';
import type { PlaceOrderCommand } from '../../domain/ports/in/place-order.use-case';
import { Order } from '../../domain/entities/order.entity';

const noDiscount = {
  lines: [],
  regularDiscount: Money.zero(),
  couponDiscount: Money.zero(),
  total: Money.zero(),
};

function makeOrderRepo(): OrderRepository {
  return {
    save: vi.fn().mockImplementation((order: Order) => Promise.resolve(order)),
    findById: vi.fn(),
    findAll: vi.fn(),
    findByOrderNumber: vi.fn(),
  };
}

function makeDeliveryRepo(amount = 0): DeliveryRateRepository {
  return { findAmount: vi.fn().mockResolvedValue(Money.of(amount)) };
}

function makePaymentGateway(success = true): PaymentGatewayPort {
  return {
    charge: vi.fn().mockResolvedValue({
      success,
      transactionId: success ? 'MOCK-PSE-12345' : undefined,
      failureReason: success ? undefined : 'Card declined',
    }),
  };
}

function makeDiscountService(): DiscountCalculationService {
  return { calculate: vi.fn().mockResolvedValue(noDiscount) };
}

function makeEventEmitter() {
  return { emit: vi.fn() } as any;
}

const pickupCommand: PlaceOrderCommand = {
  userId: 'user-1',
  deliveryType: 'PICKUP',
  customerName: 'Ana López',
  customerPhone: '3001234567',
  customerEmail: 'ana@example.com',
  paymentMethod: 'PSE',
  items: [
    {
      productId: 'prod-1',
      productName: 'Torta de chocolate',
      quantity: 1,
      unitPrice: 80_000,
    },
  ],
};

describe('PlaceOrderImpl', () => {
  it('creates a RECEIVED order for PICKUP with no delivery cost', async () => {
    const orderRepo = makeOrderRepo();
    const useCase = new PlaceOrderImpl(
      orderRepo,
      makeDeliveryRepo(10_000),
      makePaymentGateway(),
      makeDiscountService(),
      makeEventEmitter(),
    );

    const result = await useCase.execute(pickupCommand);

    expect(result.status).toBe('RECEIVED');
    expect(result.deliveryCost.amount).toBe(0);
    expect(result.total.amount).toBe(80_000);
    expect(orderRepo.save).toHaveBeenCalledOnce();
  });

  it('adds delivery cost for DELIVERY orders', async () => {
    const deliveryCommand: PlaceOrderCommand = {
      ...pickupCommand,
      deliveryType: 'DELIVERY',
      deliveryStreet: 'Calle 1',
      deliveryCity: 'Bogotá',
    };
    const orderRepo = makeOrderRepo();
    const useCase = new PlaceOrderImpl(
      orderRepo,
      makeDeliveryRepo(12_000),
      makePaymentGateway(),
      makeDiscountService(),
      makeEventEmitter(),
    );

    const result = await useCase.execute(deliveryCommand);

    expect(result.deliveryCost.amount).toBe(12_000);
    expect(result.total.amount).toBe(92_000);
  });

  it('emits order.placed event after save', async () => {
    const emitter = makeEventEmitter();
    const useCase = new PlaceOrderImpl(
      makeOrderRepo(),
      makeDeliveryRepo(),
      makePaymentGateway(),
      makeDiscountService(),
      emitter,
    );

    await useCase.execute(pickupCommand);

    expect(emitter.emit).toHaveBeenCalledWith('order.placed', expect.objectContaining({ eventName: 'order.placed' }));
  });

  it('throws when payment gateway fails', async () => {
    const useCase = new PlaceOrderImpl(
      makeOrderRepo(),
      makeDeliveryRepo(),
      makePaymentGateway(false),
      makeDiscountService(),
      makeEventEmitter(),
    );

    await expect(useCase.execute(pickupCommand)).rejects.toThrow('Payment failed');
  });

  it('generates an orderNumber with PAM-year-XXXX format', async () => {
    const useCase = new PlaceOrderImpl(
      makeOrderRepo(),
      makeDeliveryRepo(),
      makePaymentGateway(),
      makeDiscountService(),
      makeEventEmitter(),
    );

    const result = await useCase.execute(pickupCommand);
    expect(result.orderNumber).toMatch(/^PAM-\d{4}-[A-Z0-9]{4}$/);
  });

  it('applies discounts when discount service returns values', async () => {
    const discountService: DiscountCalculationService = {
      calculate: vi.fn().mockResolvedValue({
        lines: [],
        regularDiscount: Money.of(8_000),
        couponDiscount: Money.zero(),
        total: Money.of(8_000),
      }),
    };
    const orderRepo = makeOrderRepo();
    const useCase = new PlaceOrderImpl(
      orderRepo,
      makeDeliveryRepo(),
      makePaymentGateway(),
      discountService,
      makeEventEmitter(),
    );

    const result = await useCase.execute(pickupCommand);

    // 80_000 - 8_000 discount = 72_000
    expect(result.discountAmount.amount).toBe(8_000);
    expect(result.total.amount).toBe(72_000);
  });
});
