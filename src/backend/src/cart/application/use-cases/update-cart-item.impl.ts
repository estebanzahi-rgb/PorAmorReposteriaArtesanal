import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  UpdateCartItemUseCase,
  UpdateCartItemInput,
} from '../../domain/ports/in/update-cart-item.use-case';
import { CartRepository } from '../../domain/ports/out/cart.repository';
import { Cart } from '../../domain/entities/cart.entity';
import { CART_REPOSITORY } from '../../cart.tokens';

@Injectable()
export class UpdateCartItemImpl implements UpdateCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepo: CartRepository,
  ) {}

  async execute(input: UpdateCartItemInput): Promise<Cart> {
    if (input.quantity < 1) throw new BadRequestException('La cantidad debe ser al menos 1');

    const cart = await this.cartRepo.findByUserId(input.userId);
    if (!cart) throw new NotFoundException('Carrito no encontrado');

    const itemExists = cart.items.some((i) => i.id === input.itemId);
    if (!itemExists) throw new NotFoundException(`Ítem ${input.itemId} no encontrado en el carrito`);

    const updatedCart = cart.updateItemQuantity(input.itemId, input.quantity);
    return this.cartRepo.save(updatedCart);
  }
}
