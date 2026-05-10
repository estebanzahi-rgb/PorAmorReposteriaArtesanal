import { Product } from '../../entities/product.entity';

export interface ProductFilter {
  category?: string;
  search?: string;
  showInactive?: boolean;
}

export interface GetProductsUseCase {
  execute(filter?: ProductFilter): Promise<Product[]>;
}
