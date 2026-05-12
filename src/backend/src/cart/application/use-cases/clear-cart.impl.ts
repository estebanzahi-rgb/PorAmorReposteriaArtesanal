import { Inject, Injectable } from '@nestjs/common';
import { ClearCartUseCase } from '../../domain/ports/in/clear-cart.use-case';
import { CartRepository } from '../../domain/ports/out/cart.repository';
import { CART_REPOSITORY } from '../../cart.tokens';

@Injectable()
export class ClearCartImpl implements ClearCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepo: CartRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.cartRepo.clearByUserId(userId);
  }
}
