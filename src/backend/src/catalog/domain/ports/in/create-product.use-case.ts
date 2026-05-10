import { Product } from '../../entities/product.entity';

export interface CreateProductInput {
  name: string;
  description: string;
  basePrice: number;
  isCake: boolean;
  categoryId: string;
  imageUrls?: string[];
}

export interface CreateProductUseCase {
  execute(input: CreateProductInput): Promise<Product>;
}
