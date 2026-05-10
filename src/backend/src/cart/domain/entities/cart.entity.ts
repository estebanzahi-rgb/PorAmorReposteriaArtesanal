import { Money } from '../../../shared/domain/value-objects/money.vo';
import { CartItem } from './cart-item.entity';

export class Cart {
  constructor(
    public readonly id: string,
    public readonly userId: string | null,
    public readonly items: CartItem[],
  ) {}

  get total(): Money {
    return this.items.reduce((acc, item) => acc.add(item.subtotal), Money.zero());
  }

  get itemCount(): number {
    return this.items.reduce((acc, item) => acc + item.quantity, 0);
  }

  addItem(newItem: CartItem): Cart {
    const existingIdx = this.items.findIndex((i) =>
      i.isSameRegularItem(newItem.productId, newItem.variantId),
    );

    if (existingIdx >= 0) {
      const existing = this.items[existingIdx];
      const updated = existing.withQuantity(existing.quantity + newItem.quantity);
      const updatedItems = this.items.map((item, idx) => (idx === existingIdx ? updated : item));
      return new Cart(this.id, this.userId, updatedItems);
    }

    return new Cart(this.id, this.userId, [...this.items, newItem]);
  }

  removeItem(itemId: string): Cart {
    return new Cart(this.id, this.userId, this.items.filter((i) => i.id !== itemId));
  }

  updateItemQuantity(itemId: string, quantity: number): Cart {
    const updatedItems = this.items.map((i) => (i.id === itemId ? i.withQuantity(quantity) : i));
    return new Cart(this.id, this.userId, updatedItems);
  }
}
