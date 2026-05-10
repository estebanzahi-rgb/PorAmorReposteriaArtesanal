import { Injectable } from '@nestjs/common';
import type {
  Product as PrismaProduct,
  ProductVariant as PrismaVariant,
  Category as PrismaCategory,
  ProductDiscount as PrismaDiscount,
} from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { ProductRepository } from '../../domain/ports/out/product.repository';
import { ProductFilter } from '../../domain/ports/in/get-products.use-case';
import { Product } from '../../domain/entities/product.entity';
import { ProductVariant } from '../../domain/entities/product-variant.entity';
import { Category } from '../../domain/entities/category.entity';
import { ProductStatus } from '../../domain/value-objects/product-status.vo';
import { Money } from '../../../shared/domain/value-objects/money.vo';

type ProductWithRelations = PrismaProduct & {
  category: PrismaCategory;
  variants: PrismaVariant[];
  productDiscount: PrismaDiscount | null;
};

const INCLUDE = {
  category: true,
  variants: { where: { isActive: true } },
  productDiscount: {
    where: {
      isActive: true,
      startsAt: { lte: new Date() },
      endsAt: { gte: new Date() },
    },
  },
} as const;

@Injectable()
export class ProductPrismaRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter?: ProductFilter): Promise<Product[]> {
    const records = await this.prisma.product.findMany({
      where: {
        ...(filter?.showInactive ? {} : { status: 'ACTIVE' }),
        ...(filter?.category ? { category: { slug: filter.category } } : {}),
        ...(filter?.search
          ? {
              OR: [
                { name: { contains: filter.search, mode: 'insensitive' } },
                { description: { contains: filter.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findById(id: string): Promise<Product | null> {
    const record = await this.prisma.product.findUnique({ where: { id }, include: INCLUDE });
    return record ? this.toDomain(record) : null;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const record = await this.prisma.product.findUnique({ where: { slug }, include: INCLUDE });
    return record ? this.toDomain(record) : null;
  }

  async save(product: Product): Promise<Product> {
    const record = await this.prisma.product.upsert({
      where: { id: product.id },
      create: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        basePrice: product.basePrice.amount,
        status: product.status,
        isCake: product.isCake,
        images: product.images,
        categoryId: product.categoryId,
      },
      update: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        basePrice: product.basePrice.amount,
        images: product.images,
        categoryId: product.categoryId,
        updatedAt: product.updatedAt,
      },
      include: INCLUDE,
    });
    return this.toDomain(record);
  }

  async updateStatus(id: string, status: ProductStatus): Promise<Product> {
    const record = await this.prisma.product.update({
      where: { id },
      data: { status },
      include: INCLUDE,
    });
    return this.toDomain(record);
  }

  private toDomain(record: ProductWithRelations): Product {
    const activeDiscount = record.productDiscount
      ? record.productDiscount.percentage
      : undefined;

    return new Product(
      record.id,
      record.name,
      record.slug,
      record.description,
      Money.of(Number(record.basePrice)),
      record.status as ProductStatus,
      record.isCake,
      record.images,
      record.categoryId,
      new Category(record.category.id, record.category.name, record.category.slug),
      record.variants.map(
        (v) => new ProductVariant(v.id, v.productId, v.name, Number(v.priceModifier), v.isActive),
      ),
      activeDiscount ?? undefined,
      record.createdAt,
      record.updatedAt,
    );
  }
}
