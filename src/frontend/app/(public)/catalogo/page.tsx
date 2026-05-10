import { Suspense } from 'react';
import { ProductGrid } from '@components/catalog/product-grid';
import { serverFetch } from '@lib/api';
import type { ProductDto } from '@types-app/index';

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

async function Products({ searchParams }: PageProps) {
  const { category, search } = await searchParams;
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (search) params.set('search', search);

  const products = await serverFetch<ProductDto[]>(`/catalog?${params.toString()}`);

  return <ProductGrid products={products} />;
}

export default function CatalogoPage({ searchParams }: PageProps) {
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
