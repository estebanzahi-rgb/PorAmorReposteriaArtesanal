'use client';

import { useState } from 'react';
import { VariantSelector } from './variant-selector';
import { AddToCartButton } from '@components/cart/add-to-cart-button';
import { formatCOP } from '@lib/utils';
import type { ProductVariantDto } from '@types-app/index';

interface Props {
  productId: string;
  productName: string;
  imageUrl?: string;
  basePrice: number;
  discountedPrice: number | null;
  variants: ProductVariantDto[];
}

export function ProductNonCakeSection({
  productId,
  productName,
  imageUrl,
  basePrice,
  discountedPrice,
  variants,
}: Props) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantDto | null>(null);

  const effectiveBase = discountedPrice ?? basePrice;
  const finalPrice = selectedVariant ? effectiveBase + selectedVariant.priceModifier : effectiveBase;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {discountedPrice ? (
          <>
            <span className="text-3xl font-bold text-primary">{formatCOP(finalPrice)}</span>
            <span className="text-lg text-muted-foreground line-through">{formatCOP(basePrice + (selectedVariant?.priceModifier ?? 0))}</span>
          </>
        ) : (
          <span className="text-3xl font-bold text-foreground">{formatCOP(finalPrice)}</span>
        )}
      </div>

      {variants.length > 0 && (
        <VariantSelector
          variants={variants}
          selectedId={selectedVariant?.id ?? null}
          basePrice={effectiveBase}
          onSelect={setSelectedVariant}
        />
      )}

      <AddToCartButton
        productId={productId}
        productName={productName}
        variantId={selectedVariant?.id}
        variantName={selectedVariant?.name}
        unitPrice={finalPrice}
        imageUrl={imageUrl}
      />
    </div>
  );
}
