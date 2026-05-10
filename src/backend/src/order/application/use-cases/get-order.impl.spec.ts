import { describe, it, expect, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetOrderImpl } from './get-order.impl';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import type { OrderRepository } from '../../domain/ports/out/order.repository';

function makeOrder(userId: string): Order {
  return Order.reconstitute({
    id: 'order-1',
    orderNumber: 'PAM-2025-TEST',
    userId,
    status: 'RECEIVED',
    deliveryType: 'PICKUP',
    customerName: 'Test',
    customerPhone: '3001234567',
    customerEmail: 'test@test.com',
    subtotal: Money.of(50_000),
    deliveryCost: Money.zero(),
    discountAmount: Money.zero(),
    couponAmount: Money.zero(),
    total: Money.of(50_000),
    paymentMethod: 'PSE',
    items: [
      new OrderItem('i1', 'p1', 'Prod', undefined, undefined, undefined, 1, Money.of(50_000), undefined, undefined),
    ],
    createdAt: new Date(),
  });
}

function makeRepo(order: Order | null): OrderRepository {
  return {
    save: vi.fn(),
    findById: vi.fn().mockResolvedValue(order),
    findAll: vi.fn().mockResolvedValue([]),
    findByOrderNumber: vi.fn().mockResolvedValue(order),
  };
}

describe('GetOrderImpl', () => {
  it('returns order for the owning user', async () => {
    const order = makeOrder('user-1');
    const useCase = new GetOrderImpl(makeRepo(order));
    const result = await useCase.execute('order-1', 'user-1');
    expect(result.id).toBe('order-1');
  });

  it('returns order for admin regardless of owner', async () => {
    const order = makeOrder('user-1');
    const useCase = new GetOrderImpl(makeRepo(order));
    const result = await useCase.execute('order-1', 'admin-99', true);
    expect(result.id).toBe('order-1');
  });

  it('throws NotFoundException when order does not exist', async () => {
    const useCase = new GetOrderImpl(makeRepo(null));
    await expect(useCase.execute('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException when non-owner non-admin requests', async () => {
    const order = makeOrder('user-1');
    const useCase = new GetOrderImpl(makeRepo(order));
    await expect(useCase.execute('order-1', 'other-user')).rejects.toThrow(ForbiddenException);
  });
});
