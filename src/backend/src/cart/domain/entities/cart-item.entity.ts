import { Money } from '../../../shared/domain/value-objects/money.vo';

export class CartItem {
  constructor(
    public readonly id: string,
    public readonly cartId: string,
    public readonly productId: string,
    public readonly productName: string,
    public readonly variantId: string | null,
    public readonly variantName: string | null,
    public readonly cakeConfig: Record<string, string> | null,
    public readonly quantity: number,
    public readonly unitPrice: Money,
    public readonly imageUrl: string | null,
  ) {}

  get subtotal(): Money {
    return Money.of(this.unitPrice.amount * this.quantity);
  }

  isSameRegularItem(productId: string, variantId: string | null): boolean {
    return (
      this.cakeConfig === null &&
      this.productId === productId &&
      this.variantId === variantId
    );
  }

  withQuantity(quantity: number): CartItem {
    return new CartItem(
      this.id,
      this.cartId,
      this.productId,
      this.productName,
      this.variantId,
      this.variantName,
      this.cakeConfig,
      quantity,
      this.unitPrice,
      this.imageUrl,
    );
  }
}
