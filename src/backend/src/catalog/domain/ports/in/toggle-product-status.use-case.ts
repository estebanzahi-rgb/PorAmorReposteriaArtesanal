import { Product } from '../../entities/product.entity';

export interface ToggleProductStatusUseCase {
  execute(id: string): Promise<Product>;
}
