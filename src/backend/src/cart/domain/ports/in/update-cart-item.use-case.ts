import { Cart } from '../../entities/cart.entity';

export interface UpdateCartItemInput {
  userId: string;
  itemId: string;
  quantity: number;
}

export interface UpdateCartItemUseCase {
  execute(input: UpdateCartItemInput): Promise<Cart>;
}
