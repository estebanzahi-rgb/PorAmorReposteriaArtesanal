'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getAnonymousCart, clearAnonymousCart } from '@lib/cart-storage';
import { apiFetch } from '@lib/api';
import type { CartDto } from '@types-app/index';

interface CartContextValue {
  count: number;
  refresh: () => void;
}

const CartContext = createContext<CartContextValue>({ count: 0, refresh: () => {} });

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    if (session?.backendToken) {
      apiFetch<CartDto>('/cart', { token: session.backendToken })
        .then((cart) => setCount(cart.items.reduce((acc, i) => acc + i.quantity, 0)))
        .catch(() => setCount(0));
    } else {
      const items = getAnonymousCart();
      setCount(items.reduce((acc, i) => acc + i.quantity, 0));
    }
  }, [session]);

  useEffect(() => {
    if (!session?.backendToken) {
      refresh();
      return;
    }

    const anonItems = getAnonymousCart();
    if (anonItems.length > 0) {
      apiFetch<CartDto>('/cart/merge', {
        method: 'POST',
        token: session.backendToken,
        body: JSON.stringify({ anonymousItems: anonItems }),
      })
        .then(() => {
          clearAnonymousCart();
          refresh();
        })
        .catch(() => refresh());
    } else {
      refresh();
    }
  }, [refresh]);

  return <CartContext.Provider value={{ count, refresh }}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
