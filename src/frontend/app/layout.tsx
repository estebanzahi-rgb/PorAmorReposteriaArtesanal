import type { Metadata } from 'next';
import { Inter, Playfair_Display, Lora } from 'next/font/google';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@lib/cart-context';
import { Navbar } from '@components/layout/navbar';
import { Analytics } from '@components/analytics/Analytics';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-serif',
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'PorAmor Repostería Artesanal',
    template: '%s | PorAmor',
  },
  description: 'Tortas y postres artesanales hechos con amor en Colombia',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable} ${lora.variable}`}>
      <body className="font-sans">
        <SessionProvider>
          <CartProvider>
            <Navbar />
            <main>{children}</main>
          </CartProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
