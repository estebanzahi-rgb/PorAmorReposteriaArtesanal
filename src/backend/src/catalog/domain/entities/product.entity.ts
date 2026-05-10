import { Money } from '../../../shared/domain/value-objects/money.vo';
import { ProductStatus } from '../value-objects/product-status.vo';
import { ProductVariant } from './product-variant.entity';
import { Category } from './category.entity';

export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string,
    public readonly basePrice: Money,
    public readonly status: ProductStatus,
    public readonly isCake: boolean,
    public readonly images: string[],
    public readonly categoryId: string,
    public readonly category: Category | null,
    public readonly variants: ProductVariant[],
    public readonly activeDiscountPercentage: number | undefined,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  isActive(): boolean {
    return this.status === ProductStatus.ACTIVE;
  }

  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
