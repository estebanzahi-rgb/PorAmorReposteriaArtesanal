import { Inject, Injectable } from '@nestjs/common';
import { GetCartUseCase } from '../../domain/ports/in/get-cart.use-case';
import { CartRepository } from '../../domain/ports/out/cart.repository';
import { Cart } from '../../domain/entities/cart.entity';
import { CART_REPOSITORY } from '../../cart.tokens';

@Injectable()
export class GetCartImpl implements GetCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepo: CartRepository,
  ) {}

  async execute(userId: string): Promise<Cart> {
    const cart = await this.cartRepo.findByUserId(userId);
    if (cart) return cart;

    const empty = new Cart(crypto.randomUUID(), userId, []);
    return this.cartRepo.save(empty);
  }
}
