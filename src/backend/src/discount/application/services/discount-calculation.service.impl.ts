import { Inject, Injectable } from '@nestjs/common';
import {
  DiscountCalculationService,
  DiscountableItem,
  DiscountLine,
  DiscountResult,
} from '../../domain/services/discount-calculation.service';
import { DISCOUNT_DATA_REPOSITORY } from '../../discount.tokens';
import { DiscountDataRepository } from '../../domain/ports/out/discount-data.repository';
import { Money } from '../../../shared/domain/value-objects/money.vo';

@Injectable()
export class DiscountCalculationServiceImpl implements DiscountCalculationService {
  constructor(
    @Inject(DISCOUNT_DATA_REPOSITORY)
    private readonly repo: DiscountDataRepository,
  ) {}

  async calculate(items: DiscountableItem[], couponCode?: string): Promise<DiscountResult> {
    const productIds = [...new Set(items.map((i) => i.productId))];
    const [productDiscounts, quantityRules] = await Promise.all([
      this.repo.findActiveProductDiscounts(productIds),
      this.repo.findActiveQuantityRules(productIds),
    ]);

    const lines: DiscountLine[] = [];
    let regularDiscount = Money.zero();

    for (const item of items) {
      const pd = productDiscounts.find((d) => d.productId === item.productId);
      const qr = quantityRules.find(
        (r) => r.productId === item.productId && item.quantity >= r.minQuantity,
      );

      const pdAmount = pd
        ? Money.of(item.unitPrice.multiplyByPercent(pd.percentage).amount * item.quantity)
        : Money.zero();
      const qrAmount = qr
        ? Money.of(item.unitPrice.multiplyByPercent(qr.percentage).amount * item.quantity)
        : Money.zero();

      if (pdAmount.amount > 0 || qrAmount.amount > 0) {
        if (pdAmount.amount >= qrAmount.amount) {
          lines.push({
            description: `${pd!.percentage}% descuento en producto`,
            amount: pdAmount,
            type: 'PRODUCT_DISCOUNT',
          });
          regularDiscount = regularDiscount.add(pdAmount);
        } else {
          lines.push({
            description: `${qr!.percentage}% descuento por volumen (${item.quantity}+ uds.)`,
            amount: qrAmount,
            type: 'QUANTITY_DISCOUNT',
          });
          regularDiscount = regularDiscount.add(qrAmount);
        }
      }
    }

    let couponDiscount = Money.zero();

    if (couponCode) {
      const coupon = await this.repo.findActiveCoupon(couponCode.toUpperCase());
      if (coupon) {
        const subtotal = items.reduce(
          (acc, i) => acc.add(Money.of(i.unitPrice.amount * i.quantity)),
          Money.zero(),
        );
        const discountedSubtotal = subtotal.subtract(regularDiscount);

        couponDiscount =
          coupon.type === 'PERCENTAGE'
            ? discountedSubtotal.multiplyByPercent(coupon.value)
            : Money.of(coupon.value);

        lines.push({
          description: `Cupón ${couponCode.toUpperCase()}`,
          amount: couponDiscount,
          type: 'COUPON',
        });

        await this.repo.incrementCouponUsage(couponCode.toUpperCase());
      }
    }

    return {
      lines,
      regularDiscount,
      couponDiscount,
      total: regularDiscount.add(couponDiscount),
    };
  }
}
