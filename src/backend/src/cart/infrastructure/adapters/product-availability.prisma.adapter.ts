import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { ProductAvailabilityPort } from '../../domain/ports/out/product-availability.port';

@Injectable()
export class ProductAvailabilityPrismaAdapter implements ProductAvailabilityPort {
  constructor(private readonly prisma: PrismaService) {}

  async isAvailable(productId: string): Promise<boolean> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      select: { status: true, availabilityStatus: true } as any,
    });
    if (!product) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (product as any).status === 'ACTIVE' && (product as any).availabilityStatus === 'AVAILABLE';
  }
}
