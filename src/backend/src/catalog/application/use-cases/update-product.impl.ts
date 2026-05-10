import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  UpdateProductUseCase,
  UpdateProductInput,
} from '../../domain/ports/in/update-product.use-case';
import { ProductRepository } from '../../domain/ports/out/product.repository';
import { Product } from '../../domain/entities/product.entity';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { PRODUCT_REPOSITORY } from '../../catalog.tokens';

@Injectable()
export class UpdateProductImpl implements UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(input: UpdateProductInput): Promise<Product> {
    const existing = await this.productRepo.findById(input.id);
    if (!existing) throw new NotFoundException(`Producto no encontrado: ${input.id}`);

    const updated = new Product(
      existing.id,
      input.name ?? existing.name,
      input.name ? Product.generateSlug(input.name) : existing.slug,
      input.description ?? existing.description,
      input.basePrice !== undefined ? Money.of(input.basePrice) : existing.basePrice,
      existing.status,
      existing.isCake,
      input.imageUrls ?? existing.images,
      input.categoryId ?? existing.categoryId,
      existing.category,
      existing.variants,
      existing.activeDiscountPercentage,
      existing.createdAt,
      new Date(),
    );

    return this.productRepo.save(updated);
  }
}
