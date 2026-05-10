'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import { CartIcon } from '@components/cart/cart-icon';

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-teal/30 bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="hover:opacity-80 transition-opacity flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="PorAmor Repostería Artesanal"
            width={44}
            height={44}
            className="rounded-full object-cover"
            priority
          />
          <span className="hidden sm:block font-display font-semibold text-brand-teal-dark text-lg leading-tight">
            PorAmor
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/catalogo"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Catálogo
          </Link>
          {session && (
            <Link
              href="/mis-pedidos"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Mis pedidos
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <CartIcon />

          {session ? (
            <div className="flex items-center gap-2">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? 'avatar'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="text-sm px-3 py-1.5 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Ingresar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
