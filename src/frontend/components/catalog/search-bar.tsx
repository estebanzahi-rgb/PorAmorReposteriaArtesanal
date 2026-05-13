'use client';
import { useProductSearch } from '../../hooks/useProductSearch';
import { ProductGrid } from './product-grid';
import type { ProductDto } from '@types-app/index';

interface Props {
  products: ProductDto[];
}

export function SearchBar({ products }: Props) {
  const { query, setQuery, filtered } = useProductSearch(products);

  return (
    <>
      <div className="relative mb-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar productos..."
          aria-label="Buscar productos"
          className="w-full md:w-96 rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
        />
      </div>
      {query && (
        <p aria-live="polite" className="text-sm text-muted-foreground mb-4">
          {filtered.length === 0
            ? 'No se encontraron productos'
            : `${filtered.length} producto${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
        </p>
      )}
      <ProductGrid products={filtered} />
    </>
  );
}
