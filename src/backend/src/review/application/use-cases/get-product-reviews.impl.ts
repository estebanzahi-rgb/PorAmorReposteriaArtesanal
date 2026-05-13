import { Injectable, Inject } from '@nestjs/common';
import { Review } from '../../domain/entities/review.entity';
import { GetProductReviewsUseCase } from '../../domain/ports/in/get-product-reviews.use-case';
import { REVIEW_REPOSITORY } from '../../review.tokens';
import { ReviewRepository } from '../../domain/ports/out/review.repository';

@Injectable()
export class GetProductReviewsImpl implements GetProductReviewsUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviewRepo: ReviewRepository,
  ) {}

  execute(productId: string): Promise<Review[]> {
    return this.reviewRepo.findByProductId(productId);
  }
}
