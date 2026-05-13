import { Suspense } from 'react';
import { SearchBar } from '@components/catalog/search-bar';
import { serverFetch } from '@lib/api';
import type { ProductDto } from '@types-app/index';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catálogo de productos',
  description: 'Explora nuestra selección de tortas personalizadas, postres artesanales y repostería.',
  openGraph: {
    title: 'Catálogo — PorAmor Repostería Artesanal',
    description: 'Tortas personalizadas y postres artesanales para todos los momentos.',
    type: 'website',
  },
};

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

async function Products({ searchParams }: PageProps) {
  const { category } = await searchParams;
  const params = new URLSearchParams();
  if (category) params.set('category', category);

  try {
    const products = await serverFetch<ProductDto[]>(`/catalog?${params.toString()}`);
    return <SearchBar products={products} />;
  } catch {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-muted-foreground">No se pudieron cargar los productos.</p>
        <p className="text-sm text-muted-foreground/70">
          El servidor está iniciando — espera unos segundos y{' '}
          <a href="/catalogo" className="underline hover:text-foreground transition-colors">
            recarga la página
          </a>
          .
        </p>
      </div>
    );
  }
}

export default function CatalogoPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-4xl font-bold mb-2 text-brand-teal-dark">Catálogo</h1>
        <p className="font-serif italic text-brand-teal/80 mb-8">Productos artesanales hechos con amor</p>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-muted animate-pulse aspect-[3/4]" />
              ))}
            </div>
          }
        >
          <Products searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
