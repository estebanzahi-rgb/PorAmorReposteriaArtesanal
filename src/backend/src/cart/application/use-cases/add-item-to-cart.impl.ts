import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  AddItemToCartUseCase,
  AddItemInput,
} from '../../domain/ports/in/add-item-to-cart.use-case';
import { CartRepository } from '../../domain/ports/out/cart.repository';
import { ProductAvailabilityPort } from '../../domain/ports/out/product-availability.port';
import { Cart } from '../../domain/entities/cart.entity';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { CART_REPOSITORY, PRODUCT_AVAILABILITY_PORT } from '../../cart.tokens';

@Injectable()
export class AddItemToCartImpl implements AddItemToCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepo: CartRepository,
    @Inject(PRODUCT_AVAILABILITY_PORT)
    private readonly availabilityPort: ProductAvailabilityPort,
  ) {}

  async execute(input: AddItemInput): Promise<Cart> {
    const available = await this.availabilityPort.isAvailable(input.productId);
    if (!available) {
      throw new BadRequestException('Este producto no está disponible para la venta');
    }

    let cart = await this.cartRepo.findByUserId(input.userId);
    if (!cart) {
      cart = new Cart(crypto.randomUUID(), input.userId, []);
    }

    const cartId = cart.id;
    const newItem = new CartItem(
      crypto.randomUUID(),
      cartId,
      input.productId,
      input.productName,
      input.variantId ?? null,
      input.variantName ?? null,
      input.cakeConfig ?? null,
      input.quantity,
      Money.of(input.unitPrice),
      input.imageUrl ?? null,
    );

    const updatedCart = cart.addItem(newItem);
    return this.cartRepo.save(updatedCart);
  }
}
