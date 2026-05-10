import { Inject, Injectable } from '@nestjs/common';
import {
  CreateProductUseCase,
  CreateProductInput,
} from '../../domain/ports/in/create-product.use-case';
import { ProductRepository } from '../../domain/ports/out/product.repository';
import { Product } from '../../domain/entities/product.entity';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { ProductStatus } from '../../domain/value-objects/product-status.vo';
import { PRODUCT_REPOSITORY } from '../../catalog.tokens';

@Injectable()
export class CreateProductImpl implements CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
  ) {}

  execute(input: CreateProductInput): Promise<Product> {
    const now = new Date();
    const product = new Product(
      crypto.randomUUID(),
      input.name,
      Product.generateSlug(input.name),
      input.description,
      Money.of(input.basePrice),
      ProductStatus.INACTIVE,
      input.isCake,
      input.imageUrls ?? [],
      input.categoryId,
      null,
      [],
      undefined,
      now,
      now,
    );
    return this.productRepo.save(product);
  }
}
