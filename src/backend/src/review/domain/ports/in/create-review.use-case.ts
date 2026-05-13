import { Review } from '../../entities/review.entity';

export interface CreateReviewCommand {
  productId: string;
  userId: string;
  rating: number;
  comment?: string;
}

export interface CreateReviewUseCase {
  execute(command: CreateReviewCommand): Promise<Review>;
}
