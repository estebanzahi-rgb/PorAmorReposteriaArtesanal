'use client';

import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { formatCOP } from '@lib/utils';
import type { CartItemDto } from '@types-app/index';

interface CartItemProps {
  item: CartItemDto;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const cakeLabel = item.cakeConfig
    ? Object.entries(item.cakeConfig)
        .filter(([k]) => !k.endsWith('Id'))
        .map(([, v]) => v)
        .join(' · ')
    : null;

  return (
    <div className="flex gap-4 py-4 border-b border-border last:border-0">
      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🎂</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{item.productName}</p>
        {item.variantName && (
          <p className="text-sm text-muted-foreground">{item.variantName}</p>
        )}
        {cakeLabel && (
          <p className="text-xs text-muted-foreground line-clamp-1">{cakeLabel}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              className="px-2 py-1 text-sm hover:bg-muted transition-colors"
            >
              −
            </button>
            <span className="px-3 py-1 text-sm">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="px-2 py-1 text-sm hover:bg-muted transition-colors"
            >
              +
            </button>
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="font-semibold">{formatCOP(item.subtotal)}</p>
        {item.quantity > 1 && (
          <p className="text-xs text-muted-foreground">{formatCOP(item.unitPrice)} c/u</p>
        )}
      </div>
    </div>
  );
}
