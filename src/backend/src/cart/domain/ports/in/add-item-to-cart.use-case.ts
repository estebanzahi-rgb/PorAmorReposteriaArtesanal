import { Cart } from '../../entities/cart.entity';

export interface AddItemInput {
  userId: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  cakeConfig?: Record<string, string>;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

export interface AddItemToCartUseCase {
  execute(input: AddItemInput): Promise<Cart>;
}
