import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ToggleProductStatusUseCase } from '../../domain/ports/in/toggle-product-status.use-case';
import { ProductRepository } from '../../domain/ports/out/product.repository';
import { Product } from '../../domain/entities/product.entity';
import { ProductStatus } from '../../domain/value-objects/product-status.vo';
import { PRODUCT_REPOSITORY } from '../../catalog.tokens';

@Injectable()
export class ToggleProductStatusImpl implements ToggleProductStatusUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(id: string): Promise<Product> {
    const existing = await this.productRepo.findById(id);
    if (!existing) throw new NotFoundException(`Producto no encontrado: ${id}`);

    const next =
      existing.status === ProductStatus.ACTIVE ? ProductStatus.INACTIVE : ProductStatus.ACTIVE;

    return this.productRepo.updateStatus(id, next);
  }
}
