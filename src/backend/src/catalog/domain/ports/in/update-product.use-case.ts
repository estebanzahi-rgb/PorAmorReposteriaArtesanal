import { Product } from '../../entities/product.entity';

export interface UpdateProductInput {
  id: string;
  name?: string;
  description?: string;
  basePrice?: number;
  categoryId?: string;
  imageUrls?: string[];
}

export interface UpdateProductUseCase {
  execute(input: UpdateProductInput): Promise<Product>;
}
