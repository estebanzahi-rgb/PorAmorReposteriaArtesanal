import { Cart } from '../../entities/cart.entity';

export interface AnonymousCartItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  cakeConfig?: Record<string, string>;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

export interface MergeCartsInput {
  userId: string;
  anonymousItems: AnonymousCartItem[];
}

export interface MergeCartsUseCase {
  execute(input: MergeCartsInput): Promise<Cart>;
}
