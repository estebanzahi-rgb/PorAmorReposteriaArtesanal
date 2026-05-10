import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GetProductByIdUseCase } from '../../domain/ports/in/get-product-by-id.use-case';
import { ProductRepository } from '../../domain/ports/out/product.repository';
import { Product } from '../../domain/entities/product.entity';
import { PRODUCT_REPOSITORY } from '../../catalog.tokens';

@Injectable()
export class GetProductByIdImpl implements GetProductByIdUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(idOrSlug: string): Promise<Product> {
    const byId = await this.productRepo.findById(idOrSlug);
    if (byId) return byId;

    const bySlug = await this.productRepo.findBySlug(idOrSlug);
    if (bySlug) return bySlug;

    throw new NotFoundException(`Producto no encontrado: ${idOrSlug}`);
  }
}
