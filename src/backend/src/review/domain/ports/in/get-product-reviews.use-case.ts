import { Review } from '../../entities/review.entity';

export interface GetProductReviewsUseCase {
  execute(productId: string): Promise<Review[]>;
}
