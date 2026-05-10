import { describe, it, expect } from 'vitest';
import { Order, OrderCreateParams } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Money } from '../../../shared/domain/value-objects/money.vo';

function baseParams(): OrderCreateParams {
  return {
    id: 'order-1',
    orderNumber: 'PAM-2025-ABCD',
    userId: 'user-1',
    deliveryType: 'PICKUP',
    customerName: 'Ana López',
    customerPhone: '3001234567',
    customerEmail: 'ana@example.com',
    subtotal: Money.of(100_000),
    deliveryCost: Money.zero(),
    discountAmount: Money.zero(),
    couponAmount: Money.zero(),
    total: Money.of(100_000),
    paymentMethod: 'PSE',
    items: [
      new OrderItem('i1', 'p1', 'Prod', undefined, undefined, undefined, 1, Money.of(100_000), undefined, undefined),
    ],
  };
}

describe('Order', () => {
  describe('create()', () => {
    it('sets status RECEIVED', () => {
      const order = Order.create(baseParams());
      expect(order.status).toBe('RECEIVED');
    });

    it('pushes exactly one OrderPlacedEvent', () => {
      const order = Order.create(baseParams());
      const events = order.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('order.placed');
    });

    it('pullDomainEvents clears the buffer', () => {
      const order = Order.create(baseParams());
      order.pullDomainEvents();
      expect(order.pullDomainEvents()).toHaveLength(0);
    });
  });

  describe('reconstitute()', () => {
    it('restores provided status without pushing events', () => {
      const order = Order.reconstitute({
        ...baseParams(),
        status: 'IN_PREPARATION',
        createdAt: new Date('2025-01-01'),
      });
      expect(order.status).toBe('IN_PREPARATION');
      expect(order.pullDomainEvents()).toHaveLength(0);
    });
  });

  describe('transitionTo()', () => {
    it('RECEIVED → IN_PREPARATION is valid', () => {
      const order = Order.create(baseParams());
      order.transitionTo('IN_PREPARATION');
      expect(order.status).toBe('IN_PREPARATION');
    });

    it('RECEIVED → DELIVERED is invalid and throws', () => {
      const order = Order.create(baseParams());
      expect(() => order.transitionTo('DELIVERED')).toThrow('Invalid transition');
    });

    it('DELIVERED → CANCELLED is invalid (terminal state)', () => {
      const order = Order.reconstitute({
        ...baseParams(),
        status: 'DELIVERED',
        createdAt: new Date(),
      });
      expect(() => order.transitionTo('CANCELLED')).toThrow('Invalid transition');
    });

    it('READY → SHIPPED throws for PICKUP orders', () => {
      const order = Order.reconstitute({
        ...baseParams(),
        deliveryType: 'PICKUP',
        status: 'READY',
        createdAt: new Date(),
      });
      expect(() => order.transitionTo('SHIPPED')).toThrow('SHIPPED is only valid for DELIVERY');
    });

    it('READY → SHIPPED succeeds for DELIVERY orders', () => {
      const order = Order.reconstitute({
        ...baseParams(),
        deliveryType: 'DELIVERY',
        status: 'READY',
        createdAt: new Date(),
      });
      order.transitionTo('SHIPPED');
      expect(order.status).toBe('SHIPPED');
    });

    it('RECEIVED → CANCELLED is valid', () => {
      const order = Order.create(baseParams());
      order.transitionTo('CANCELLED');
      expect(order.status).toBe('CANCELLED');
    });
  });
});
