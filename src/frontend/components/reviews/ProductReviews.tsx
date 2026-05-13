'use client';
import { useState } from 'react';
import { ReviewForm } from './ReviewForm';
import { ReviewList } from './ReviewList';
import type { ReviewDto } from '../../types/review';

interface Props {
  productId: string;
  initialReviews: ReviewDto[];
}

export function ProductReviews({ productId, initialReviews }: Props) {
  const [reviews, setReviews] = useState<ReviewDto[]>(initialReviews);

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold">Reseñas del producto</h2>
      <ReviewList reviews={reviews} />
      <ReviewForm
        productId={productId}
        onReviewAdded={(review) => setReviews((prev) => [review, ...prev])}
      />
    </section>
  );
}
