import { describe, it, expect } from 'vitest';
import { OrderItem } from './order-item.entity';
import { Money } from '../../../shared/domain/value-objects/money.vo';

function makeItem(overrides: Partial<ConstructorParameters<typeof OrderItem>[number]> = {}) {
  return new OrderItem(
    'item-1',
    'prod-1',
    'Torta de chocolate',
    undefined,
    undefined,
    undefined,
    (overrides as any).quantity ?? 2,
    (overrides as any).unitPrice ?? Money.of(50_000),
    (overrides as any).discountedUnitPrice ?? undefined,
    undefined,
  );
}

describe('OrderItem', () => {
  it('effectiveUnitPrice returns unitPrice when no discount', () => {
    const item = new OrderItem('id', 'p', 'Prod', undefined, undefined, undefined, 1, Money.of(1000), undefined, undefined);
    expect(item.effectiveUnitPrice.amount).toBe(1000);
  });

  it('effectiveUnitPrice returns discountedUnitPrice when set', () => {
    const item = new OrderItem('id', 'p', 'Prod', undefined, undefined, undefined, 1, Money.of(1000), Money.of(800), undefined);
    expect(item.effectiveUnitPrice.amount).toBe(800);
  });

  it('subtotal = effectiveUnitPrice × quantity', () => {
    const item = new OrderItem('id', 'p', 'Prod', undefined, undefined, undefined, 3, Money.of(10_000), undefined, undefined);
    expect(item.subtotal.amount).toBe(30_000);
  });

  it('subtotal uses discounted price when available', () => {
    const item = new OrderItem('id', 'p', 'Prod', undefined, undefined, undefined, 3, Money.of(10_000), Money.of(8_000), undefined);
    expect(item.subtotal.amount).toBe(24_000);
  });
});
