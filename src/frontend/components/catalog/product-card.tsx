import Link from 'next/link';
import Image from 'next/image';
import { Price } from '@components/ui/price';
import type { ProductDto } from '@types-app/index';

interface ProductCardProps {
  product: ProductDto;
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images?.[0] ?? null;
  const discountedPrice = product.activeDiscountPercentage
    ? product.basePrice * (1 - product.activeDiscountPercentage / 100)
    : null;

  return (
    <Link href={`/catalogo/${product.slug}`} className="group block">
      <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
        <div className="relative aspect-square bg-muted">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl">
              🎂
            </div>
          )}
          {product.activeDiscountPercentage && (
            <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full">
              -{product.activeDiscountPercentage}%
            </span>
          )}
        </div>
        <div className="p-4">
          <p className="text-xs font-medium text-brand-teal mb-1">{product.category.name}</p>
          <h3 className="font-display font-semibold text-foreground line-clamp-2 mb-2">{product.name}</h3>
          <div className="flex items-center gap-2">
            {discountedPrice ? (
              <>
                <Price amount={discountedPrice} className="font-bold text-primary" />
                <Price amount={product.basePrice} className="text-sm text-muted-foreground line-through" />
              </>
            ) : (
              <span className="font-bold text-foreground">
                {product.isCake ? 'Desde ' : ''}
                <Price amount={product.basePrice} />
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
