import { Inject, Injectable } from '@nestjs/common';
import {
  MergeCartsUseCase,
  MergeCartsInput,
} from '../../domain/ports/in/merge-carts.use-case';
import { CartRepository } from '../../domain/ports/out/cart.repository';
import { Cart } from '../../domain/entities/cart.entity';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { CART_REPOSITORY } from '../../cart.tokens';

@Injectable()
export class MergeCartsImpl implements MergeCartsUseCase {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepo: CartRepository,
  ) {}

  async execute(input: MergeCartsInput): Promise<Cart> {
    let cart = await this.cartRepo.findByUserId(input.userId);
    if (!cart) {
      cart = new Cart(crypto.randomUUID(), input.userId, []);
    }

    for (const anonItem of input.anonymousItems) {
      const cartItem = new CartItem(
        crypto.randomUUID(),
        cart.id,
        anonItem.productId,
        anonItem.productName,
        anonItem.variantId ?? null,
        anonItem.variantName ?? null,
        anonItem.cakeConfig ?? null,
        anonItem.quantity,
        Money.of(anonItem.unitPrice),
        anonItem.imageUrl ?? null,
      );
      cart = cart.addItem(cartItem);
    }

    return this.cartRepo.save(cart);
  }
}
