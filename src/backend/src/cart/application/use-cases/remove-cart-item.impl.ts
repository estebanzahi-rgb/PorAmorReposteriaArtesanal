import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  RemoveCartItemUseCase,
  RemoveCartItemInput,
} from '../../domain/ports/in/remove-cart-item.use-case';
import { CartRepository } from '../../domain/ports/out/cart.repository';
import { Cart } from '../../domain/entities/cart.entity';
import { CART_REPOSITORY } from '../../cart.tokens';

@Injectable()
export class RemoveCartItemImpl implements RemoveCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepo: CartRepository,
  ) {}

  async execute(input: RemoveCartItemInput): Promise<Cart> {
    const cart = await this.cartRepo.findByUserId(input.userId);
    if (!cart) throw new NotFoundException('Carrito no encontrado');

    const itemExists = cart.items.some((i) => i.id === input.itemId);
    if (!itemExists) throw new NotFoundException(`Ítem ${input.itemId} no encontrado en el carrito`);

    const updatedCart = cart.removeItem(input.itemId);
    return this.cartRepo.save(updatedCart);
  }
}
