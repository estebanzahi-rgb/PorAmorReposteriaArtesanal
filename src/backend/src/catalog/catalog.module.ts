import { Module } from '@nestjs/common';
import { DiscountModule } from '../discount/discount.module';
import { CatalogController } from './interfaces/http/catalog.controller';
import { AdminCatalogController } from './interfaces/http/admin-catalog.controller';
import { GetProductsImpl } from './application/use-cases/get-products.impl';
import { GetProductByIdImpl } from './application/use-cases/get-product-by-id.impl';
import { GetCakeConfiguratorOptionsImpl } from './application/use-cases/get-cake-configurator-options.impl';
import { CreateProductImpl } from './application/use-cases/create-product.impl';
import { UpdateProductImpl } from './application/use-cases/update-product.impl';
import { ToggleProductStatusImpl } from './application/use-cases/toggle-product-status.impl';
import { CreateCakeOptionImpl } from './application/use-cases/create-cake-option.impl';
import { ToggleCakeOptionImpl } from './application/use-cases/toggle-cake-option.impl';
import { ProductPrismaRepository } from './infrastructure/persistence/product.prisma.repository';
import { CakeOptionPrismaRepository } from './infrastructure/persistence/cake-option.prisma.repository';
import {
  PRODUCT_REPOSITORY,
  CAKE_OPTION_REPOSITORY,
  GET_PRODUCTS_USE_CASE,
  GET_PRODUCT_BY_ID_USE_CASE,
  GET_CAKE_CONFIGURATOR_OPTIONS_USE_CASE,
  CREATE_PRODUCT_USE_CASE,
  UPDATE_PRODUCT_USE_CASE,
  TOGGLE_PRODUCT_STATUS_USE_CASE,
  CREATE_CAKE_OPTION_USE_CASE,
  TOGGLE_CAKE_OPTION_USE_CASE,
} from './catalog.tokens';

@Module({
  imports: [DiscountModule],
  controllers: [CatalogController, AdminCatalogController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: ProductPrismaRepository },
    { provide: CAKE_OPTION_REPOSITORY, useClass: CakeOptionPrismaRepository },
    { provide: GET_PRODUCTS_USE_CASE, useClass: GetProductsImpl },
    { provide: GET_PRODUCT_BY_ID_USE_CASE, useClass: GetProductByIdImpl },
    { provide: GET_CAKE_CONFIGURATOR_OPTIONS_USE_CASE, useClass: GetCakeConfiguratorOptionsImpl },
    { provide: CREATE_PRODUCT_USE_CASE, useClass: CreateProductImpl },
    { provide: UPDATE_PRODUCT_USE_CASE, useClass: UpdateProductImpl },
    { provide: TOGGLE_PRODUCT_STATUS_USE_CASE, useClass: ToggleProductStatusImpl },
    { provide: CREATE_CAKE_OPTION_USE_CASE, useClass: CreateCakeOptionImpl },
    { provide: TOGGLE_CAKE_OPTION_USE_CASE, useClass: ToggleCakeOptionImpl },
  ],
  exports: [GET_PRODUCTS_USE_CASE, GET_PRODUCT_BY_ID_USE_CASE, GET_CAKE_CONFIGURATOR_OPTIONS_USE_CASE],
})
export class CatalogModule {}
