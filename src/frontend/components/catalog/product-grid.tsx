import { ProductCard } from './product-card';
import type { ProductDto } from '@types-app/index';

interface ProductGridProps {
  products: ProductDto[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <span className="text-5xl">🔍</span>
        <p className="text-lg">No encontramos productos con estos filtros.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
