import { Cart } from '../../entities/cart.entity';

export interface RemoveCartItemInput {
  userId: string;
  itemId: string;
}

export interface RemoveCartItemUseCase {
  execute(input: RemoveCartItemInput): Promise<Cart>;
}
