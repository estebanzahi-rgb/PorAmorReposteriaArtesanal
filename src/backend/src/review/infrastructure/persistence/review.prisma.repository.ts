import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { ReviewRepository } from '../../domain/ports/out/review.repository';
import { Review } from '../../domain/entities/review.entity';
import { Rating } from '../../domain/value-objects/rating.vo';

@Injectable()
export class ReviewPrismaRepository implements ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByProductId(productId: string): Promise<Review[]> {
    const rows = await this.prisma.review.findMany({
      where: { productId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => new Review(
      r.id,
      r.productId,
      r.userId,
      r.user.name,
      new Rating(r.rating),
      r.comment ?? undefined,
      r.createdAt,
    ));
  }

  async save(review: Review): Promise<Review> {
    const row = await this.prisma.review.create({
      data: {
        id: review.id,
        productId: review.productId,
        userId: review.userId,
        rating: review.rating.value,
        comment: review.comment ?? null,
      },
      include: { user: { select: { name: true } } },
    });
    return new Review(
      row.id,
      row.productId,
      row.userId,
      row.user.name,
      new Rating(row.rating),
      row.comment ?? undefined,
      row.createdAt,
    );
  }

  async existsByUserAndProduct(userId: string, productId: string): Promise<boolean> {
    const count = await this.prisma.review.count({ where: { userId, productId } });
    return count > 0;
  }
}
