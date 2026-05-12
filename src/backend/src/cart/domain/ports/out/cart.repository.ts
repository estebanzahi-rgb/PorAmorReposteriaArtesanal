import { Cart } from '../../entities/cart.entity';

export interface CartRepository {
  findById(cartId: string): Promise<Cart | null>;
  findByUserId(userId: string): Promise<Cart | null>;
  save(cart: Cart): Promise<Cart>;
  deleteById(cartId: string): Promise<void>;
  clearByUserId(userId: string): Promise<void>;
}
