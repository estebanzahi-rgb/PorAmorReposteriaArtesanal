import type { ReviewDto } from '../../types/review';

interface Props {
  reviews: ReviewDto[];
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= value ? 'text-yellow-400' : 'text-muted-foreground/30'}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ReviewList({ reviews }: Props) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Aún no hay reseñas. ¡Sé el primero en opinar!
      </p>
    );
  }

  const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold">{avg.toFixed(1)}</span>
        <div>
          <StarRating value={Math.round(avg)} />
          <p className="text-xs text-muted-foreground">{reviews.length} reseña{reviews.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="border border-border rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm">{review.userName}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <StarRating value={review.rating} />
            {review.comment && <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
