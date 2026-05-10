'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CartItemRow } from '@components/cart/cart-item';
import { CartSummary } from '@components/cart/cart-summary';
import { apiFetch } from '@lib/api';
import {
  getAnonymousCart,
  saveAnonymousCart,
  AnonymousCartItem,
} from '@lib/cart-storage';
import type { CartDto, CartItemDto } from '@types-app/index';

export default function CarritoPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<CartItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!session?.backendToken;

  useEffect(() => {
    if (isAuthenticated) {
      apiFetch<CartDto>('/cart', { token: session!.backendToken })
        .then((cart) => setItems(cart.items))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    } else {
      const anonItems = getAnonymousCart();
      setItems(
        anonItems.map((i, idx) => ({
          id: `anon-${idx}`,
          productId: i.productId,
          productName: i.productName,
          variantId: i.variantId,
          variantName: i.variantName,
          cakeConfig: i.cakeConfig as Record<string, string> | undefined,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.unitPrice * i.quantity,
          imageUrl: i.imageUrl,
        })),
      );
      setLoading(false);
    }
  }, [isAuthenticated, session]);

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (isAuthenticated) {
      const cart = await apiFetch<CartDto>(`/cart/items/${itemId}`, {
        method: 'PATCH',
        token: session!.backendToken,
        body: JSON.stringify({ quantity }),
      });
      setItems(cart.items);
    } else {
      const anonItems = getAnonymousCart();
      const idx = parseInt(itemId.replace('anon-', ''));
      anonItems[idx].quantity = quantity;
      saveAnonymousCart(anonItems);
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity, subtotal: i.unitPrice * quantity } : i)),
      );
    }
  };

  const removeItem = async (itemId: string) => {
    if (isAuthenticated) {
      const cart = await apiFetch<CartDto>(`/cart/items/${itemId}`, {
        method: 'DELETE',
        token: session!.backendToken,
      });
      setItems(cart.items);
    } else {
      const idx = parseInt(itemId.replace('anon-', ''));
      const anonItems = getAnonymousCart();
      anonItems.splice(idx, 1);
      saveAnonymousCart(anonItems);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  };

  const total = items.reduce((acc, i) => acc + i.subtotal, 0);
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <span className="text-6xl">🛒</span>
        <h1 className="text-2xl font-bold">Tu carrito está vacío</h1>
        <p className="text-muted-foreground">Agrega productos del catálogo para continuar</p>
        <a
          href="/catalogo"
          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          Ver catálogo
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-[hsl(var(--brand-brown))]">Mi carrito</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>
          <div>
            <CartSummary total={total} itemCount={itemCount} />
          </div>
        </div>
      </div>
    </div>
  );
}
