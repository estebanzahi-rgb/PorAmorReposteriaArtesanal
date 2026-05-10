import { Cart } from '../../entities/cart.entity';

export interface GetCartUseCase {
  execute(userId: string): Promise<Cart>;
}
