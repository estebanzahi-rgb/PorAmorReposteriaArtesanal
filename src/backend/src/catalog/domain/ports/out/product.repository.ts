import { Product, ProductAvailabilityStatus } from '../../entities/product.entity';
import { Category } from '../../entities/category.entity';
import { ProductFilter } from '../in/get-products.use-case';
import { ProductStatus } from '../../value-objects/product-status.vo';

export interface ProductRepository {
  findAll(filter?: ProductFilter): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  findAllCategories(): Promise<Category[]>;
  save(product: Product): Promise<Product>;
  updateStatus(id: string, status: ProductStatus): Promise<Product>;
  updateAvailability(id: string, status: ProductAvailabilityStatus): Promise<Product>;
}
