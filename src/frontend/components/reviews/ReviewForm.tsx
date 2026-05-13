'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@lib/api';
import type { ReviewDto } from '../../types/review';

interface Props {
  productId: string;
  onReviewAdded: (review: ReviewDto) => void;
}

export function ReviewForm({ productId, onReviewAdded }: Props) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError('Selecciona una calificación'); return; }
    setSubmitting(true);
    setError('');
    try {
      const review = await apiFetch<ReviewDto>(`/products/${productId}/reviews`, {
        method: 'POST',
        token: session.backendToken,
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      onReviewAdded(review);
      setRating(0);
      setComment('');
    } catch (err) {
      setError((err as Error).message ?? 'Error al guardar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-muted/30 rounded-xl p-4 border border-border">
      <p className="font-medium text-sm">Escribe tu reseña</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
            className="text-2xl transition-transform hover:scale-110"
          >
            <span className={(hovered || rating) >= star ? 'text-yellow-400' : 'text-muted-foreground/30'}>
              ★
            </span>
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Cuéntanos tu experiencia (opcional)"
        rows={3}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {submitting ? 'Enviando...' : 'Publicar reseña'}
      </button>
    </form>
  );
}
