import { Injectable, Inject, ConflictException, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import { Review } from '../../domain/entities/review.entity';
import {
  CreateReviewUseCase,
  CreateReviewCommand,
} from '../../domain/ports/in/create-review.use-case';
import { REVIEW_REPOSITORY, ORDER_QUERY_PORT } from '../../review.tokens';
import { ReviewRepository } from '../../domain/ports/out/review.repository';
import { OrderQueryPort } from '../../domain/ports/out/order-query.port';

@Injectable()
export class CreateReviewImpl implements CreateReviewUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviewRepo: ReviewRepository,
    @Inject(ORDER_QUERY_PORT) private readonly orderQuery: OrderQueryPort,
  ) {}

  async execute(command: CreateReviewCommand): Promise<Review> {
    const hasPurchased = await this.orderQuery.hasPurchasedProduct(
      command.userId,
      command.productId,
    );
    if (!hasPurchased) {
      throw new ForbiddenException('You must purchase this product before reviewing it');
    }

    const alreadyReviewed = await this.reviewRepo.existsByUserAndProduct(
      command.userId,
      command.productId,
    );
    if (alreadyReviewed) {
      throw new ConflictException('You have already reviewed this product');
    }

    const review = Review.create({
      id: crypto.randomUUID(),
      productId: command.productId,
      userId: command.userId,
      userName: '',
      rating: command.rating,
      comment: command.comment,
    });

    return this.reviewRepo.save(review);
  }
}
