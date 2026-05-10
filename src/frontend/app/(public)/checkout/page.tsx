'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { CheckoutForm } from '@components/checkout/checkout-form';
import { apiFetch } from '@lib/api';
import { getAnonymousCart } from '@lib/cart-storage';
import type { CartDto, CartItemDto, DeliveryRateDto } from '@types-app/index';

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const [cartItems, setCartItems] = useState<CartItemDto[]>([]);
  const [deliveryRate, setDeliveryRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (session?.backendToken) {
          const [cart, rate] = await Promise.allSettled([
            apiFetch<CartDto>('/cart', { token: session.backendToken }),
            apiFetch<DeliveryRateDto>('/delivery-rate'),
          ]);
          if (cart.status === 'fulfilled') setCartItems(cart.value.items);
          if (rate.status === 'fulfilled') setDeliveryRate(rate.value.amount);
        }
      } finally {
        setLoading(false);
      }
    }

    if (status !== 'loading') load();
  }, [session, status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) {
    const anonItems = getAnonymousCart();
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4">
        <span className="text-5xl">🔐</span>
        <h1 className="text-2xl font-bold">Inicia sesión para continuar</h1>
        <p className="text-muted-foreground max-w-sm">
          Necesitas una cuenta para completar tu pedido.
          {anonItems.length > 0 && ' Tu carrito se guardará al iniciar sesión.'}
        </p>
        <button
          onClick={() => signIn('google', { callbackUrl: '/checkout' })}
          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          Continuar con Google
        </button>
        <Link href="/carrito" className="text-sm text-muted-foreground hover:text-foreground">
          ← Volver al carrito
        </Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <span className="text-5xl">🛒</span>
        <h1 className="text-2xl font-bold">Tu carrito está vacío</h1>
        <Link
          href="/catalogo"
          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-[hsl(var(--brand-brown))]">
          Finalizar pedido
        </h1>
        <CheckoutForm cartItems={cartItems} deliveryRate={deliveryRate} />
      </div>
    </div>
  );
}
