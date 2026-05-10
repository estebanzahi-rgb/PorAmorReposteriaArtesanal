import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/interfaces/http/guards/roles.guard';
import { Roles } from '../../../auth/interfaces/http/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/interfaces/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/interfaces/http/types/authenticated-user';
import { DISCOUNT_DATA_REPOSITORY } from '../../discount.tokens';
import { DiscountDataRepository } from '../../domain/ports/out/discount-data.repository';
import {
  SetProductDiscountDto,
  SetQuantityRuleDto,
  CreateCouponDto,
} from './dtos/admin-discount.dto';

@ApiTags('admin-discounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/discounts')
export class AdminDiscountController {
  constructor(
    @Inject(DISCOUNT_DATA_REPOSITORY)
    private readonly repo: DiscountDataRepository,
  ) {}

  // ─── Product Discounts ───────────────────────────────────────────────────

  @Get('products')
  @ApiOperation({ summary: 'Listar todos los descuentos de productos' })
  async listProductDiscounts() {
    return this.repo.findAllProductDiscounts();
  }

  @Post('products/:productId')
  @ApiOperation({ summary: 'Crear o actualizar descuento de producto' })
  async setProductDiscount(
    @Param('productId') productId: string,
    @Body() dto: SetProductDiscountDto,
  ) {
    return this.repo.saveProductDiscount({
      productId,
      percentage: dto.percentage,
      startsAt: new Date(dto.startsAt),
      endsAt: new Date(dto.endsAt),
    });
  }

  @Delete('products/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar descuento de producto' })
  async deactivateProductDiscount(@Param('productId') productId: string) {
    await this.repo.deactivateProductDiscount(productId);
  }

  // ─── Quantity Rules ──────────────────────────────────────────────────────

  @Get('quantity-rules')
  @ApiOperation({ summary: 'Listar todas las reglas de descuento por volumen' })
  async listQuantityRules() {
    return this.repo.findAllQuantityRules();
  }

  @Post('quantity-rules/:productId')
  @ApiOperation({ summary: 'Crear o actualizar regla de descuento por volumen' })
  async setQuantityRule(
    @Param('productId') productId: string,
    @Body() dto: SetQuantityRuleDto,
  ) {
    return this.repo.saveQuantityRule({
      productId,
      minQuantity: dto.minQuantity,
      percentage: dto.percentage,
    });
  }

  @Delete('quantity-rules/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar regla de volumen' })
  async deactivateQuantityRule(@Param('productId') productId: string) {
    await this.repo.deactivateQuantityRule(productId);
  }

  // ─── Coupons ─────────────────────────────────────────────────────────────

  @Get('coupons')
  @ApiOperation({ summary: 'Listar todos los cupones' })
  async listCoupons() {
    return this.repo.findAllCoupons();
  }

  @Post('coupons')
  @ApiOperation({ summary: 'Crear cupón de descuento' })
  async createCoupon(
    @Body() dto: CreateCouponDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.repo.saveCoupon({
      code: dto.code.toUpperCase(),
      type: dto.type,
      value: dto.value,
      usageLimit: dto.usageLimit,
      createdBy: user.email,
    });
  }

  @Patch('coupons/:code/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar o desactivar cupón' })
  async toggleCoupon(@Param('code') code: string) {
    return this.repo.toggleCoupon(code.toUpperCase());
  }
}
