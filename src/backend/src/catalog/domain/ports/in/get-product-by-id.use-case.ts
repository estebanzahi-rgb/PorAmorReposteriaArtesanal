import { Product } from '../../entities/product.entity';

export interface GetProductByIdUseCase {
  execute(idOrSlug: string): Promise<Product>;
}
