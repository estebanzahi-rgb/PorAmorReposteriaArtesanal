'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ShoppingBag } from 'lucide-react';
import { getAnonymousCart } from '@lib/cart-storage';
import { apiFetch } from '@lib/api';
import type { CartDto } from '@types-app/index';

export function CartIcon() {
  const { data: session } = useSession();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (session?.backendToken) {
      apiFetch<CartDto>('/cart', { token: session.backendToken })
        .then((cart) => setCount(cart.items.reduce((acc, i) => acc + i.quantity, 0)))
        .catch(() => setCount(0));
    } else {
      const items = getAnonymousCart();
      setCount(items.reduce((acc, i) => acc + i.quantity, 0));
    }
  }, [session]);

  return (
    <Link href="/carrito" className="relative inline-flex items-center p-2">
      <ShoppingBag className="w-6 h-6" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
