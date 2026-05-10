import { Money } from '../../../shared/domain/value-objects/money.vo';

export class OrderItem {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly productName: string,
    public readonly variantId: string | undefined,
    public readonly variantName: string | undefined,
    public readonly cakeConfig: Record<string, string> | undefined,
    public readonly quantity: number,
    public readonly unitPrice: Money,
    public readonly discountedUnitPrice: Money | undefined,
    public readonly imageUrl: string | undefined,
  ) {}

  get effectiveUnitPrice(): Money {
    return this.discountedUnitPrice ?? this.unitPrice;
  }

  get subtotal(): Money {
    return Money.of(this.effectiveUnitPrice.amount * this.quantity);
  }
}
