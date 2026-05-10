'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { cn } from '@lib/utils';
import { addToAnonymousCart } from '@lib/cart-storage';
import { apiFetch } from '@lib/api';
import type { CartDto } from '@types-app/index';

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  unitPrice: number;
  imageUrl?: string;
  quantity?: number;
  className?: string;
}

export function AddToCartButton({
  productId,
  productName,
  variantId,
  variantName,
  unitPrice,
  imageUrl,
  quantity = 1,
  className,
}: AddToCartButtonProps) {
  const { data: session } = useSession();
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    try {
      if (session?.backendToken) {
        await apiFetch<CartDto>('/cart/items', {
          method: 'POST',
          token: session.backendToken,
          body: JSON.stringify({ productId, productName, variantId, variantName, unitPrice, quantity, imageUrl }),
        });
      } else {
        addToAnonymousCart({ productId, productName, variantId, variantName, unitPrice, quantity, imageUrl });
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className={cn(
        'w-full py-3 rounded-xl font-semibold text-white transition-all',
        added ? 'bg-green-500' : 'bg-primary hover:opacity-90',
        loading && 'opacity-70 cursor-not-allowed',
        className,
      )}
    >
      {loading ? 'Agregando...' : added ? '¡Agregado! ✓' : 'Agregar al carrito'}
    </button>
  );
}
