'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { CartIcon } from '@components/cart/cart-icon';

export function Navbar() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN';
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-teal/30 bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="hover:opacity-80 transition-opacity flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
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

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
          <Link href="/catalogo" className="text-muted-foreground hover:text-foreground transition-colors">
            Catálogo
          </Link>
          {session && (
            <Link href="/mis-pedidos" className="text-muted-foreground hover:text-foreground transition-colors">
              Mis pedidos
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className="text-brand-teal font-semibold hover:text-brand-teal-dark transition-colors">
              Panel Admin
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <CartIcon />

          {session ? (
            <div className="hidden sm:flex items-center gap-2">
              {session.user?.image && (
                <Image src={session.user.image} alt={session.user.name ?? 'avatar'} width={32} height={32} className="rounded-full" />
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="hidden sm:block text-sm px-3 py-1.5 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Ingresar
            </button>
          )}

          {/* Hamburger */}
          <button
            className="sm:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menú"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border bg-background px-4 py-4 space-y-1">
          <Link href="/catalogo" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Catálogo
          </Link>
          {session && (
            <Link href="/mis-pedidos" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Mis pedidos
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-semibold text-brand-teal hover:text-brand-teal-dark transition-colors">
              Panel Admin
            </Link>
          )}
          <div className="pt-2 border-t border-border">
            {session ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {session.user?.image && (
                    <Image src={session.user.image} alt={session.user.name ?? 'avatar'} width={28} height={28} className="rounded-full" />
                  )}
                  <span className="text-sm text-muted-foreground">{session.user?.name}</span>
                </div>
                <button
                  onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/' }); }}
                  className="text-sm text-destructive hover:opacity-80 transition-opacity"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setMobileOpen(false); signIn('google'); }}
                className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Ingresar con Google
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
