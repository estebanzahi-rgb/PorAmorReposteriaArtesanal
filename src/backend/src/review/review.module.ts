import { Module } from '@nestjs/common';
import { ReviewPrismaRepository } from './infrastructure/persistence/review.prisma.repository';
import { OrderQueryPrismaAdapter } from './infrastructure/adapters/order-query.prisma.adapter';
import { GetProductReviewsImpl } from './application/use-cases/get-product-reviews.impl';
import { CreateReviewImpl } from './application/use-cases/create-review.impl';
import { ReviewController } from './interfaces/http/review.controller';
import {
  REVIEW_REPOSITORY,
  ORDER_QUERY_PORT,
  GET_PRODUCT_REVIEWS_USE_CASE,
  CREATE_REVIEW_USE_CASE,
} from './review.tokens';

@Module({
  controllers: [ReviewController],
  providers: [
    { provide: REVIEW_REPOSITORY, useClass: ReviewPrismaRepository },
    { provide: ORDER_QUERY_PORT, useClass: OrderQueryPrismaAdapter },
    { provide: GET_PRODUCT_REVIEWS_USE_CASE, useClass: GetProductReviewsImpl },
    { provide: CREATE_REVIEW_USE_CASE, useClass: CreateReviewImpl },
  ],
})
export class ReviewModule {}
