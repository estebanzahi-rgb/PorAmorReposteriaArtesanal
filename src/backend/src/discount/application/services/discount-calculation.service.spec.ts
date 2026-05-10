import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiscountCalculationServiceImpl } from './discount-calculation.service.impl';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import type { DiscountDataRepository } from '../../domain/ports/out/discount-data.repository';
import type { DiscountableItem } from '../../domain/services/discount-calculation.service';

function makeRepo(overrides: Partial<DiscountDataRepository> = {}): DiscountDataRepository {
  return {
    findActiveProductDiscounts: vi.fn().mockResolvedValue([]),
    findActiveQuantityRules: vi.fn().mockResolvedValue([]),
    findActiveCoupon: vi.fn().mockResolvedValue(null),
    incrementCouponUsage: vi.fn().mockResolvedValue(undefined),
    findAllProductDiscounts: vi.fn().mockResolvedValue([]),
    findAllQuantityRules: vi.fn().mockResolvedValue([]),
    findAllCoupons: vi.fn().mockResolvedValue([]),
    saveProductDiscount: vi.fn(),
    deactivateProductDiscount: vi.fn(),
    saveQuantityRule: vi.fn(),
    deactivateQuantityRule: vi.fn(),
    saveCoupon: vi.fn(),
    toggleCoupon: vi.fn(),
    ...overrides,
  };
}

const item: DiscountableItem = {
  productId: 'prod-1',
  quantity: 2,
  unitPrice: Money.of(50_000),
};

describe('DiscountCalculationService', () => {
  describe('no discounts configured', () => {
    it('returns zeros for all fields', async () => {
      const svc = new DiscountCalculationServiceImpl(makeRepo());
      const result = await svc.calculate([item]);
      expect(result.regularDiscount.amount).toBe(0);
      expect(result.couponDiscount.amount).toBe(0);
      expect(result.total.amount).toBe(0);
      expect(result.lines).toHaveLength(0);
    });
  });

  describe('product discount only', () => {
    it('applies 10% product discount on 2 units of 50_000', async () => {
      const repo = makeRepo({
        findActiveProductDiscounts: vi.fn().mockResolvedValue([
          { id: 'd1', productId: 'prod-1', percentage: 10, startsAt: new Date(), endsAt: new Date(), isActive: true },
        ]),
      });
      const svc = new DiscountCalculationServiceImpl(repo);
      const result = await svc.calculate([item]);
      // 50_000 × 10% × 2 = 10_000
      expect(result.regularDiscount.amount).toBe(10_000);
      expect(result.lines[0].type).toBe('PRODUCT_DISCOUNT');
    });
  });

  describe('quantity rule only', () => {
    it('applies 15% quantity rule when minQuantity met', async () => {
      const repo = makeRepo({
        findActiveQuantityRules: vi.fn().mockResolvedValue([
          { id: 'qr1', productId: 'prod-1', minQuantity: 2, percentage: 15, isActive: true },
        ]),
      });
      const svc = new DiscountCalculationServiceImpl(repo);
      const result = await svc.calculate([item]);
      // 50_000 × 15% × 2 = 15_000
      expect(result.regularDiscount.amount).toBe(15_000);
      expect(result.lines[0].type).toBe('QUANTITY_DISCOUNT');
    });

    it('does NOT apply quantity rule when minQuantity not met', async () => {
      const singleUnit: DiscountableItem = { ...item, quantity: 1 };
      const repo = makeRepo({
        findActiveQuantityRules: vi.fn().mockResolvedValue([
          { id: 'qr1', productId: 'prod-1', minQuantity: 2, percentage: 15, isActive: true },
        ]),
      });
      const svc = new DiscountCalculationServiceImpl(repo);
      const result = await svc.calculate([singleUnit]);
      expect(result.regularDiscount.amount).toBe(0);
    });
  });

  describe('greatest-wins logic', () => {
    it('picks product discount when it is greater than quantity rule', async () => {
      const repo = makeRepo({
        findActiveProductDiscounts: vi.fn().mockResolvedValue([
          { id: 'd1', productId: 'prod-1', percentage: 20, startsAt: new Date(), endsAt: new Date(), isActive: true },
        ]),
        findActiveQuantityRules: vi.fn().mockResolvedValue([
          { id: 'qr1', productId: 'prod-1', minQuantity: 2, percentage: 10, isActive: true },
        ]),
      });
      const svc = new DiscountCalculationServiceImpl(repo);
      const result = await svc.calculate([item]);
      // PD: 50_000×20%×2=20_000  vs  QR: 50_000×10%×2=10_000 → PD wins
      expect(result.lines[0].type).toBe('PRODUCT_DISCOUNT');
      expect(result.regularDiscount.amount).toBe(20_000);
    });

    it('picks quantity rule when it is greater than product discount', async () => {
      const repo = makeRepo({
        findActiveProductDiscounts: vi.fn().mockResolvedValue([
          { id: 'd1', productId: 'prod-1', percentage: 5, startsAt: new Date(), endsAt: new Date(), isActive: true },
        ]),
        findActiveQuantityRules: vi.fn().mockResolvedValue([
          { id: 'qr1', productId: 'prod-1', minQuantity: 2, percentage: 20, isActive: true },
        ]),
      });
      const svc = new DiscountCalculationServiceImpl(repo);
      const result = await svc.calculate([item]);
      // QR: 50_000×20%×2=20_000 vs PD: 50_000×5%×2=5_000 → QR wins
      expect(result.lines[0].type).toBe('QUANTITY_DISCOUNT');
      expect(result.regularDiscount.amount).toBe(20_000);
    });
  });

  describe('coupon PERCENTAGE', () => {
    it('applies coupon % on discounted subtotal', async () => {
      // subtotal = 100_000, regularDiscount = 0, coupon 10% → 10_000
      const repo = makeRepo({
        findActiveCoupon: vi.fn().mockResolvedValue({
          id: 'c1', code: 'SAVE10', type: 'PERCENTAGE', value: 10,
          usageLimit: null, usageCount: 0, isActive: true, createdAt: new Date(),
        }),
      });
      const svc = new DiscountCalculationServiceImpl(repo);
      const result = await svc.calculate([item], 'SAVE10');
      expect(result.couponDiscount.amount).toBe(10_000);
      expect(result.lines[0].type).toBe('COUPON');
    });

    it('increments coupon usage on success', async () => {
      const incrementSpy = vi.fn().mockResolvedValue(undefined);
      const repo = makeRepo({
        findActiveCoupon: vi.fn().mockResolvedValue({
          id: 'c1', code: 'SAVE10', type: 'PERCENTAGE', value: 10,
          usageLimit: null, usageCount: 0, isActive: true, createdAt: new Date(),
        }),
        incrementCouponUsage: incrementSpy,
      });
      const svc = new DiscountCalculationServiceImpl(repo);
      await svc.calculate([item], 'SAVE10');
      expect(incrementSpy).toHaveBeenCalledWith('SAVE10');
    });
  });

  describe('coupon FIXED_VALUE', () => {
    it('deducts fixed value from total', async () => {
      const repo = makeRepo({
        findActiveCoupon: vi.fn().mockResolvedValue({
          id: 'c2', code: 'OFF5000', type: 'FIXED_VALUE', value: 5_000,
          usageLimit: null, usageCount: 0, isActive: true, createdAt: new Date(),
        }),
      });
      const svc = new DiscountCalculationServiceImpl(repo);
      const result = await svc.calculate([item], 'OFF5000');
      expect(result.couponDiscount.amount).toBe(5_000);
    });
  });

  describe('invalid coupon', () => {
    it('returns zero coupon discount when coupon not found', async () => {
      const repo = makeRepo({
        findActiveCoupon: vi.fn().mockResolvedValue(null),
      });
      const svc = new DiscountCalculationServiceImpl(repo);
      const result = await svc.calculate([item], 'INVALID');
      expect(result.couponDiscount.amount).toBe(0);
    });
  });
});
