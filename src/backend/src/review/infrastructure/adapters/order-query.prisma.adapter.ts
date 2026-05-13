import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { OrderQueryPort } from '../../domain/ports/out/order-query.port';

const PURCHASED_STATUSES = ['RECEIVED', 'IN_PREPARATION', 'READY', 'SHIPPED', 'DELIVERED'] as const;

@Injectable()
export class OrderQueryPrismaAdapter implements OrderQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async hasPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    const count = await this.prisma.order.count({
      where: {
        userId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: { in: PURCHASED_STATUSES as any },
        items: { some: { productId } },
      },
    });
    return count > 0;
  }
}
