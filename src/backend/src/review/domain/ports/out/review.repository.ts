import { Review } from '../../entities/review.entity';

export interface ReviewRepository {
  findByProductId(productId: string): Promise<Review[]>;
  save(review: Review): Promise<Review>;
  existsByUserAndProduct(userId: string, productId: string): Promise<boolean>;
}
