import { Rating } from '../value-objects/rating.vo';

export class Review {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly userId: string,
    public readonly userName: string,
    public readonly rating: Rating,
    public readonly comment: string | undefined,
    public readonly createdAt: Date,
  ) {}

  static create(params: {
    id: string;
    productId: string;
    userId: string;
    userName: string;
    rating: number;
    comment?: string;
  }): Review {
    return new Review(
      params.id,
      params.productId,
      params.userId,
      params.userName,
      new Rating(params.rating),
      params.comment,
      new Date(),
    );
  }
}
