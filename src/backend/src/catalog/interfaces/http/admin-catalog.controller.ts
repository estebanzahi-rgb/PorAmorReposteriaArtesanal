import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/interfaces/http/guards/roles.guard';
import { Roles } from '../../../auth/interfaces/http/decorators/roles.decorator';
import { GetProductsUseCase } from '../../domain/ports/in/get-products.use-case';
import { GetProductByIdUseCase } from '../../domain/ports/in/get-product-by-id.use-case';
import { CreateProductUseCase } from '../../domain/ports/in/create-product.use-case';
import { UpdateProductUseCase } from '../../domain/ports/in/update-product.use-case';
import { ToggleProductStatusUseCase } from '../../domain/ports/in/toggle-product-status.use-case';
import { CreateCakeOptionUseCase } from '../../domain/ports/in/create-cake-option.use-case';
import { ToggleCakeOptionUseCase } from '../../domain/ports/in/toggle-cake-option.use-case';
import { CakeOptionRepository } from '../../domain/ports/out/cake-option.repository';
import {
  GET_PRODUCTS_USE_CASE,
  GET_PRODUCT_BY_ID_USE_CASE,
  CREATE_PRODUCT_USE_CASE,
  UPDATE_PRODUCT_USE_CASE,
  TOGGLE_PRODUCT_STATUS_USE_CASE,
  CREATE_CAKE_OPTION_USE_CASE,
  TOGGLE_CAKE_OPTION_USE_CASE,
  CAKE_OPTION_REPOSITORY,
} from '../../catalog.tokens';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { CreateCakeOptionDto } from './dtos/create-cake-option.dto';
import { Product } from '../../domain/entities/product.entity';
import { CakeOption } from '../../domain/entities/cake-option.entity';

@ApiTags('admin-catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/catalog')
export class AdminCatalogController {
  constructor(
    @Inject(GET_PRODUCTS_USE_CASE) private readonly getProducts: GetProductsUseCase,
    @Inject(GET_PRODUCT_BY_ID_USE_CASE) private readonly getProductById: GetProductByIdUseCase,
    @Inject(CREATE_PRODUCT_USE_CASE) private readonly createProduct: CreateProductUseCase,
    @Inject(UPDATE_PRODUCT_USE_CASE) private readonly updateProduct: UpdateProductUseCase,
    @Inject(TOGGLE_PRODUCT_STATUS_USE_CASE) private readonly toggleStatus: ToggleProductStatusUseCase,
    @Inject(CREATE_CAKE_OPTION_USE_CASE) private readonly createCakeOption: CreateCakeOptionUseCase,
    @Inject(TOGGLE_CAKE_OPTION_USE_CASE) private readonly toggleCakeOption: ToggleCakeOptionUseCase,
    @Inject(CAKE_OPTION_REPOSITORY) private readonly cakeOptionRepo: CakeOptionRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: '[Admin] Listar todos los productos (incluye inactivos)' })
  async listAll() {
    const products = await this.getProducts.execute({ showInactive: true });
    return products.map((p) => this.toResponse(p));
  }

  @Get('cake-options')
  @ApiOperation({ summary: '[Admin] Listar todas las opciones de torta' })
  async listCakeOptions() {
    const options = await this.cakeOptionRepo.findAll();
    return options.map((o) => this.toCakeOptionResponse(o));
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] Obtener producto por ID' })
  async getById(@Param('id') id: string) {
    const product = await this.getProductById.execute(id).catch(() => null);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return this.toResponse(product);
  }

  @Post()
  @ApiOperation({ summary: 'Crear producto nuevo' })
  async create(@Body() dto: CreateProductDto) {
    const product = await this.createProduct.execute({
      name: dto.name,
      description: dto.description,
      basePrice: dto.basePrice,
      isCake: dto.isCake,
      categoryId: dto.categoryId,
      imageUrls: dto.imageUrls,
    });
    return this.toResponse(product);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar producto' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const product = await this.updateProduct.execute({ id, ...dto, imageUrls: dto.imageUrls });
    return this.toResponse(product);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar o desactivar producto' })
  async toggleProductStatus(@Param('id') id: string) {
    const product = await this.toggleStatus.execute(id);
    return this.toResponse(product);
  }

  @Post('cake-options')
  @ApiOperation({ summary: 'Crear opción de torta' })
  async createOption(@Body() dto: CreateCakeOptionDto) {
    const option = await this.createCakeOption.execute(dto);
    return this.toCakeOptionResponse(option);
  }

  @Patch('cake-options/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar o desactivar opción de torta' })
  async toggleOption(@Param('id') id: string) {
    const option = await this.toggleCakeOption.execute(id);
    return this.toCakeOptionResponse(option);
  }

  private toResponse(p: Product) {
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      basePrice: p.basePrice.amount,
      status: p.status,
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
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  private toCakeOptionResponse(o: CakeOption) {
    return {
      id: o.id,
      name: o.name,
      dimension: o.dimension,
      priceModifier: o.priceModifier,
      isActive: o.isActive,
    };
  }
}
