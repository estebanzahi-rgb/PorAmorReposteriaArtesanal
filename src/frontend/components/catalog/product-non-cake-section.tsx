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
  quantityDiscountMinQty?: number;
  quantityDiscountPercentage?: number;
  availabilityStatus?: 'AVAILABLE' | 'OUT_OF_STOCK';
}

export function ProductNonCakeSection({
  productId,
  productName,
  imageUrl,
  basePrice,
  discountedPrice,
  variants,
  quantityDiscountMinQty,
  quantityDiscountPercentage,
  availabilityStatus = 'AVAILABLE',
}: Props) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantDto | null>(null);
  const [quantity, setQuantity] = useState(1);

  const isOutOfStock = availabilityStatus === 'OUT_OF_STOCK';

  const effectiveBase = discountedPrice ?? basePrice;
  const finalPrice = selectedVariant ? effectiveBase + selectedVariant.priceModifier : effectiveBase;

  return (
    <div className="space-y-6">
      {isOutOfStock && (
        <div className="flex items-center gap-2 text-sm bg-muted border border-border text-muted-foreground rounded-xl px-4 py-3">
          <span className="font-semibold">Producto agotado</span>
          <span>— Actualmente no está disponible para la venta.</span>
        </div>
      )}
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

      {quantityDiscountMinQty && quantityDiscountPercentage && (
        <div className="flex items-center gap-2 text-sm bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2">
          <span>🏷️</span>
          <span>
            Lleva <strong>{quantityDiscountMinQty}+</strong> unidades y obtén{' '}
            <strong>{quantityDiscountPercentage}% de descuento</strong>
          </span>
        </div>
      )}

      {variants.length > 0 && (
        <VariantSelector
          variants={variants}
          selectedId={selectedVariant?.id ?? null}
          basePrice={effectiveBase}
          onSelect={setSelectedVariant}
        />
      )}

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Cantidad</span>
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-lg font-medium hover:bg-muted transition-colors"
          >
            −
          </button>
          <span className="px-4 py-2 text-sm font-semibold min-w-[2.5rem] text-center">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="px-3 py-2 text-lg font-medium hover:bg-muted transition-colors"
          >
            +
          </button>
        </div>
        {quantity > 1 && (
          <span className="text-sm text-muted-foreground">= {formatCOP(finalPrice * quantity)}</span>
        )}
      </div>

      <AddToCartButton
        productId={productId}
        productName={productName}
        variantId={selectedVariant?.id}
        variantName={selectedVariant?.name}
        unitPrice={finalPrice}
        imageUrl={imageUrl}
        quantity={quantity}
        disabled={isOutOfStock}
      />
    </div>
  );
}
