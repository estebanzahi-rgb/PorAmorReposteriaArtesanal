import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { OrderRepository, OrderFilter } from '../../domain/ports/out/order.repository';
import { Order, OrderStatus, DeliveryType, PaymentMethod } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { Prisma } from '@prisma/client';

type PrismaOrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        product: { select: { name: true; images: true } };
        variant: { select: { name: true } };
      };
    };
  };
}>;

const INCLUDE = {
  items: {
    include: {
      product: { select: { name: true, images: true } },
      variant: { select: { name: true } },
    },
  },
} as const;

@Injectable()
export class OrderPrismaRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(order: Order): Promise<Order> {
    const data = {
      orderNumber: order.orderNumber,
      userId: order.userId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: order.status as any,
      deliveryType: order.deliveryType,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      deliveryStreet: order.deliveryStreet ?? null,
      deliveryCity: order.deliveryCity ?? null,
      deliveryNotes: order.deliveryNotes ?? null,
      subtotal: order.subtotal.amount,
      deliveryCost: order.deliveryCost.amount,
      discountAmount: order.discountAmount.amount,
      couponAmount: order.couponAmount.amount,
      total: order.total.amount,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      paymentMethod: order.paymentMethod as any,
      couponCode: order.couponCode ?? null,
      scheduledAt: order.scheduledAt ?? null,
    };

    const saved = await this.prisma.order.upsert({
      where: { id: order.id },
      create: {
        id: order.id,
        ...data,
        items: {
          createMany: {
            data: order.items.map((item) => ({
              id: item.id,
              productId: item.productId,
              variantId: item.variantId ?? null,
              cakeConfig: item.cakeConfig ?? Prisma.JsonNull,
              quantity: item.quantity,
              unitPrice: item.unitPrice.amount,
              discountedUnitPrice: item.discountedUnitPrice?.amount ?? null,
            })),
          },
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: { status: order.status as any },
      include: INCLUDE,
    });

    return this.toDomain(saved as any);
  }

  async findById(id: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: INCLUDE,
    });
    return order ? this.toDomain(order) : null;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: INCLUDE,
    });
    return order ? this.toDomain(order) : null;
  }

  async findAll(filter?: OrderFilter): Promise<Order[]> {
    const where: Prisma.OrderWhereInput = {};
    if (filter?.userId) where.userId = filter.userId;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (filter?.status) where.status = filter.status as any;
    if (filter?.deliveryType) where.deliveryType = filter.deliveryType;
    if (filter?.customerName) {
      where.customerName = { contains: filter.customerName, mode: 'insensitive' };
    }
    if (filter?.dateFrom || filter?.dateTo) {
      where.createdAt = {
        ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
        ...(filter.dateTo ? { lte: filter.dateTo } : {}),
      };
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.toDomain(o));
  }

  private toDomain(raw: PrismaOrderWithItems): Order {
    const items = raw.items.map(
      (i) =>
        new OrderItem(
          i.id,
          i.productId,
          i.product.name,
          i.variantId ?? undefined,
          i.variant?.name ?? undefined,
          (i.cakeConfig as Record<string, string> | null) ?? undefined,
          i.quantity,
          Money.of(Number(i.unitPrice)),
          i.discountedUnitPrice ? Money.of(Number(i.discountedUnitPrice)) : undefined,
          i.product.images[0] ?? undefined,
        ),
    );

    return Order.reconstitute({
      id: raw.id,
      orderNumber: raw.orderNumber,
      userId: raw.userId,
      status: raw.status as OrderStatus,
      deliveryType: raw.deliveryType as DeliveryType,
      customerName: raw.customerName,
      customerPhone: raw.customerPhone,
      customerEmail: raw.customerEmail,
      subtotal: Money.of(Number(raw.subtotal)),
      deliveryCost: Money.of(Number(raw.deliveryCost)),
      discountAmount: Money.of(Number(raw.discountAmount)),
      couponAmount: Money.of(Number(raw.couponAmount)),
      total: Money.of(Number(raw.total)),
      paymentMethod: raw.paymentMethod as PaymentMethod,
      items,
      deliveryStreet: raw.deliveryStreet ?? undefined,
      deliveryCity: raw.deliveryCity ?? undefined,
      deliveryNotes: raw.deliveryNotes ?? undefined,
      couponCode: raw.couponCode ?? undefined,
      scheduledAt: raw.scheduledAt ?? undefined,
      createdAt: raw.createdAt,
    });
  }
}
