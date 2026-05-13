import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '../../catalog.tokens';
import { ProductRepository } from '../../domain/ports/out/product.repository';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GetProductsUseCase } from '../../domain/ports/in/get-products.use-case';
import { GetProductByIdUseCase } from '../../domain/ports/in/get-product-by-id.use-case';
import { GetCakeConfiguratorOptionsUseCase } from '../../domain/ports/in/get-cake-configurator-options.use-case';
import {
  GET_PRODUCTS_USE_CASE,
  GET_PRODUCT_BY_ID_USE_CASE,
  GET_CAKE_CONFIGURATOR_OPTIONS_USE_CASE,
} from '../../catalog.tokens';
import { DISCOUNT_DATA_REPOSITORY } from '../../../discount/discount.tokens';
import { DiscountDataRepository, QuantityRuleData } from '../../../discount/domain/ports/out/discount-data.repository';
import { Product } from '../../domain/entities/product.entity';
import { CakeOption } from '../../domain/entities/cake-option.entity';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(
    @Inject(GET_PRODUCTS_USE_CASE)
    private readonly getProducts: GetProductsUseCase,
    @Inject(GET_PRODUCT_BY_ID_USE_CASE)
    private readonly getProductById: GetProductByIdUseCase,
    @Inject(GET_CAKE_CONFIGURATOR_OPTIONS_USE_CASE)
    private readonly getCakeOptions: GetCakeConfiguratorOptionsUseCase,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
    @Inject(DISCOUNT_DATA_REPOSITORY)
    private readonly discountRepo: DiscountDataRepository,
  ) {}

  @Get('categories')
  @ApiOperation({ summary: 'Listar todas las categorías' })
  async categories() {
    const cats = await this.productRepo.findAllCategories();
    return cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos activos con filtros opcionales' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(@Query('category') category?: string, @Query('search') search?: string) {
    const products = await this.getProducts.execute({ category, search });
    const rules = await this.discountRepo.findActiveQuantityRules(products.map((p) => p.id));
    const rulesMap = new Map(rules.map((r) => [r.productId, r]));
    return products.map((p) => this.toResponse(p, rulesMap.get(p.id)));
  }

  @Get('cake-configurator')
  @ApiOperation({ summary: 'Opciones del configurador de tortas (activas)' })
  async cakeConfiguratorOptions() {
    const options = await this.getCakeOptions.execute();
    const mapOption = (o: CakeOption) => ({
      id: o.id,
      name: o.name,
      dimension: o.dimension,
      priceModifier: o.priceModifier,
      isActive: o.isActive,
    });
    return {
      sizes: options.SIZE.map(mapOption),
      flavors: options.FLAVOR.map(mapOption),
      fillings: options.FILLING.map(mapOption),
      toppings: options.TOPPING.map(mapOption),
      toppers: options.TOPPER.map(mapOption),
    };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Obtener producto por slug o ID' })
  async findOne(@Param('slug') slug: string) {
    const product = await this.getProductById.execute(slug);
    const rules = await this.discountRepo.findActiveQuantityRules([product.id]);
    return this.toResponse(product, rules[0]);
  }

  private toResponse(p: Product, quantityRule?: QuantityRuleData) {
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      basePrice: p.basePrice.amount,
      status: p.status,
      availabilityStatus: p.availabilityStatus,
      isCake: p.isCake,
      images: p.images,
      category: p.category
        ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
        : null,
      variants: p.variants.map((v) => ({
        id: v.id,
        name: v.name,
        priceModifier: v.priceModifier,
        isActive: v.isActive,
      })),
      activeDiscountPercentage: p.activeDiscountPercentage ?? null,
      quantityDiscount: quantityRule
        ? { minQuantity: quantityRule.minQuantity, percentage: quantityRule.percentage }
        : null,
    };
  }
}
