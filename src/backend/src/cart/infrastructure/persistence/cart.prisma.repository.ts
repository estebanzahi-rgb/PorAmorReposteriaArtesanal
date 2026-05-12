import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { CartRepository } from '../../domain/ports/out/cart.repository';
import { Cart } from '../../domain/entities/cart.entity';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { Money } from '../../../shared/domain/value-objects/money.vo';

const INCLUDE = {
  items: {
    include: {
      product: { select: { name: true, images: true } },
      variant: { select: { name: true } },
    },
  },
} as const;

@Injectable()
export class CartPrismaRepository implements CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(cartId: string): Promise<Cart | null> {
    const record = await this.prisma.cart.findUnique({ where: { id: cartId }, include: INCLUDE });
    return record ? this.toDomain(record) : null;
  }

  async findByUserId(userId: string): Promise<Cart | null> {
    const record = await this.prisma.cart.findUnique({ where: { userId }, include: INCLUDE });
    return record ? this.toDomain(record) : null;
  }

  async save(cart: Cart): Promise<Cart> {
    const existingItems = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      select: { id: true },
    });
    const existingIds = new Set(existingItems.map((i) => i.id));
    const newIds = new Set(cart.items.map((i) => i.id));
    const toDelete = [...existingIds].filter((id) => !newIds.has(id));

    await this.prisma.$transaction(async (tx) => {
      await tx.cart.upsert({
        where: { id: cart.id },
        create: { id: cart.id, userId: cart.userId },
        update: {},
      });

      if (toDelete.length > 0) {
        await tx.cartItem.deleteMany({ where: { id: { in: toDelete } } });
      }

      for (const item of cart.items) {
        await tx.cartItem.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            cartId: item.cartId,
            productId: item.productId,
            variantId: item.variantId,
            cakeConfig: item.cakeConfig ?? undefined,
            quantity: item.quantity,
            unitPrice: item.unitPrice.amount,
          },
          update: { quantity: item.quantity },
        });
      }
    });

    return (await this.findById(cart.id))!;
  }

  async deleteById(cartId: string): Promise<void> {
    await this.prisma.cart.delete({ where: { id: cartId } });
  }

  async clearByUserId(userId: string): Promise<void> {
    await this.prisma.cart.deleteMany({ where: { userId } });
  }

  private toDomain(record: {
    id: string;
    userId: string | null;
    items: Array<{
      id: string;
      cartId: string;
      productId: string;
      variantId: string | null;
      cakeConfig: unknown;
      quantity: number;
      unitPrice: number | { toNumber(): number } | string;
      product: { name: string; images: string[] };
      variant: { name: string } | null;
    }>;
  }): Cart {
    const items = record.items.map(
      (i) =>
        new CartItem(
          i.id,
          i.cartId,
          i.productId,
          i.product.name,
          i.variantId,
          i.variant?.name ?? null,
          (i.cakeConfig as Record<string, string> | null) ?? null,
          i.quantity,
          Money.of(Number(i.unitPrice)),
          i.product.images[0] ?? null,
        ),
    );
    return new Cart(record.id, record.userId, items);
  }
}
