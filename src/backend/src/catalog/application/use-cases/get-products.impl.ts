import { Inject, Injectable } from '@nestjs/common';
import { GetProductsUseCase, ProductFilter } from '../../domain/ports/in/get-products.use-case';
import { ProductRepository } from '../../domain/ports/out/product.repository';
import { Product } from '../../domain/entities/product.entity';
import { PRODUCT_REPOSITORY } from '../../catalog.tokens';

@Injectable()
export class GetProductsImpl implements GetProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
  ) {}

  execute(filter?: ProductFilter): Promise<Product[]> {
    return this.productRepo.findAll(filter);
  }
}
