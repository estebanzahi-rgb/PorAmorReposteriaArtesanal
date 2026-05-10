'use client';

import { cn, formatCOP } from '@lib/utils';
import type { ProductVariantDto } from '@types-app/index';

interface VariantSelectorProps {
  variants: ProductVariantDto[];
  selectedId: string | null;
  basePrice: number;
  onSelect: (variant: ProductVariantDto) => void;
}

export function VariantSelector({ variants, selectedId, basePrice, onSelect }: VariantSelectorProps) {
  if (variants.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Presentación</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const totalPrice = basePrice + v.priceModifier;
          return (
            <button
              key={v.id}
              onClick={() => onSelect(v)}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                selectedId === v.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background hover:border-primary/50',
              )}
            >
              {v.name}
              {v.priceModifier > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  (+{formatCOP(v.priceModifier)})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
