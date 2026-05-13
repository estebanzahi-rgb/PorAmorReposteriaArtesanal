import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/interfaces/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/interfaces/http/types/authenticated-user';
import { GET_PRODUCT_REVIEWS_USE_CASE, CREATE_REVIEW_USE_CASE } from '../../review.tokens';
import { GetProductReviewsUseCase } from '../../domain/ports/in/get-product-reviews.use-case';
import { CreateReviewUseCase } from '../../domain/ports/in/create-review.use-case';

class CreateReviewDto {
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsString() @IsOptional() comment?: string;
}

@ApiTags('reviews')
@Controller('products/:productId/reviews')
export class ReviewController {
  constructor(
    @Inject(GET_PRODUCT_REVIEWS_USE_CASE)
    private readonly getReviews: GetProductReviewsUseCase,
    @Inject(CREATE_REVIEW_USE_CASE)
    private readonly createReview: CreateReviewUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener reseñas de un producto' })
  async getProductReviews(@Param('productId') productId: string) {
    const reviews = await this.getReviews.execute(productId);
    return reviews.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.userName,
      rating: r.rating.value,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear reseña de un producto (requiere compra previa)' })
  async createProductReview(
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const review = await this.createReview.execute({
      productId,
      userId: user.id,
      rating: dto.rating,
      comment: dto.comment,
    });
    return {
      id: review.id,
      userId: review.userId,
      userName: review.userName,
      rating: review.rating.value,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    };
  }
}
