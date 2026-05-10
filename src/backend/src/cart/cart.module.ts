import { Module } from '@nestjs/common';
import { CartController } from './interfaces/http/cart.controller';
import { GetCartImpl } from './application/use-cases/get-cart.impl';
import { AddItemToCartImpl } from './application/use-cases/add-item-to-cart.impl';
import { UpdateCartItemImpl } from './application/use-cases/update-cart-item.impl';
import { RemoveCartItemImpl } from './application/use-cases/remove-cart-item.impl';
import { MergeCartsImpl } from './application/use-cases/merge-carts.impl';
import { CartPrismaRepository } from './infrastructure/persistence/cart.prisma.repository';
import {
  CART_REPOSITORY,
  ADD_ITEM_TO_CART_USE_CASE,
  GET_CART_USE_CASE,
  UPDATE_CART_ITEM_USE_CASE,
  REMOVE_CART_ITEM_USE_CASE,
  MERGE_CARTS_USE_CASE,
} from './cart.tokens';

@Module({
  controllers: [CartController],
  providers: [
    { provide: CART_REPOSITORY, useClass: CartPrismaRepository },
    { provide: GET_CART_USE_CASE, useClass: GetCartImpl },
    { provide: ADD_ITEM_TO_CART_USE_CASE, useClass: AddItemToCartImpl },
    { provide: UPDATE_CART_ITEM_USE_CASE, useClass: UpdateCartItemImpl },
    { provide: REMOVE_CART_ITEM_USE_CASE, useClass: RemoveCartItemImpl },
    { provide: MERGE_CARTS_USE_CASE, useClass: MergeCartsImpl },
  ],
})
export class CartModule {}
