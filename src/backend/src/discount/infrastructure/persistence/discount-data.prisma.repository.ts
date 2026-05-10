import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  DiscountDataRepository,
  ProductDiscountData,
  QuantityRuleData,
  CouponData,
  SaveProductDiscountParams,
  SaveQuantityRuleParams,
  SaveCouponParams,
} from '../../domain/ports/out/discount-data.repository';

@Injectable()
export class DiscountDataPrismaRepository implements DiscountDataRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveProductDiscounts(productIds: string[]): Promise<ProductDiscountData[]> {
    const now = new Date();
    const discounts = await this.prisma.productDiscount.findMany({
      where: {
        productId: { in: productIds },
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
    });
    return discounts.map(this.mapDiscount);
  }

  async findActiveQuantityRules(productIds: string[]): Promise<QuantityRuleData[]> {
    const rules = await this.prisma.quantityDiscountRule.findMany({
      where: { productId: { in: productIds }, isActive: true },
    });
    return rules.map(this.mapRule);
  }

  async findActiveCoupon(code: string): Promise<CouponData | null> {
    const coupon = await this.prisma.coupon.findFirst({
      where: { code: code.toUpperCase(), isActive: true },
    });
    if (!coupon) return null;
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) return null;
    return this.mapCoupon(coupon);
  }

  async incrementCouponUsage(code: string): Promise<void> {
    await this.prisma.coupon.update({
      where: { code: code.toUpperCase() },
      data: { usageCount: { increment: 1 } },
    });
  }

  async findAllProductDiscounts(): Promise<ProductDiscountData[]> {
    const discounts = await this.prisma.productDiscount.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return discounts.map(this.mapDiscount);
  }

  async findAllQuantityRules(): Promise<QuantityRuleData[]> {
    const rules = await this.prisma.quantityDiscountRule.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rules.map(this.mapRule);
  }

  async findAllCoupons(): Promise<CouponData[]> {
    const coupons = await this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    return coupons.map(this.mapCoupon);
  }

  async saveProductDiscount(params: SaveProductDiscountParams): Promise<ProductDiscountData> {
    const existing = await this.prisma.productDiscount.findUnique({
      where: { productId: params.productId },
    });
    const record = existing
      ? await this.prisma.productDiscount.update({
          where: { productId: params.productId },
          data: {
            percentage: params.percentage,
            startsAt: params.startsAt,
            endsAt: params.endsAt,
            isActive: true,
          },
        })
      : await this.prisma.productDiscount.create({
          data: {
            id: crypto.randomUUID(),
            productId: params.productId,
            percentage: params.percentage,
            startsAt: params.startsAt,
            endsAt: params.endsAt,
          },
        });
    return this.mapDiscount(record);
  }

  async deactivateProductDiscount(productId: string): Promise<void> {
    await this.prisma.productDiscount.updateMany({
      where: { productId },
      data: { isActive: false },
    });
  }

  async saveQuantityRule(params: SaveQuantityRuleParams): Promise<QuantityRuleData> {
    const existing = await this.prisma.quantityDiscountRule.findUnique({
      where: { productId: params.productId },
    });
    const record = existing
      ? await this.prisma.quantityDiscountRule.update({
          where: { productId: params.productId },
          data: {
            minQuantity: params.minQuantity,
            percentage: params.percentage,
            isActive: true,
          },
        })
      : await this.prisma.quantityDiscountRule.create({
          data: {
            id: crypto.randomUUID(),
            productId: params.productId,
            minQuantity: params.minQuantity,
            percentage: params.percentage,
          },
        });
    return this.mapRule(record);
  }

  async deactivateQuantityRule(productId: string): Promise<void> {
    await this.prisma.quantityDiscountRule.updateMany({
      where: { productId },
      data: { isActive: false },
    });
  }

  async saveCoupon(params: SaveCouponParams): Promise<CouponData> {
    const record = await this.prisma.coupon.create({
      data: {
        id: crypto.randomUUID(),
        code: params.code.toUpperCase(),
        type: params.type,
        value: params.value,
        usageLimit: params.usageLimit ?? null,
        createdBy: params.createdBy,
      },
    });
    return this.mapCoupon(record);
  }

  async toggleCoupon(code: string): Promise<CouponData> {
    const current = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    const record = await this.prisma.coupon.update({
      where: { code: code.toUpperCase() },
      data: { isActive: !current?.isActive },
    });
    return this.mapCoupon(record);
  }

  private mapDiscount(d: { id: string; productId: string; percentage: number; startsAt: Date; endsAt: Date; isActive: boolean }): ProductDiscountData {
    return { id: d.id, productId: d.productId, percentage: d.percentage, startsAt: d.startsAt, endsAt: d.endsAt, isActive: d.isActive };
  }

  private mapRule(r: { id: string; productId: string; minQuantity: number; percentage: number; isActive: boolean }): QuantityRuleData {
    return { id: r.id, productId: r.productId, minQuantity: r.minQuantity, percentage: r.percentage, isActive: r.isActive };
  }

  private mapCoupon(c: { id: string; code: string; type: string; value: unknown; usageLimit: number | null; usageCount: number; isActive: boolean; createdAt: Date }): CouponData {
    return {
      id: c.id,
      code: c.code,
      type: c.type as 'PERCENTAGE' | 'FIXED_VALUE',
      value: Number(c.value),
      usageLimit: c.usageLimit ?? undefined,
      usageCount: c.usageCount,
      isActive: c.isActive,
      createdAt: c.createdAt,
    };
  }
}
