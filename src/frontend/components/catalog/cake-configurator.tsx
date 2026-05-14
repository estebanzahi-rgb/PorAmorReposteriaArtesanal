'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { cn, formatCOP } from '@lib/utils';
import { addToAnonymousCart } from '@lib/cart-storage';
import { apiFetch } from '@lib/api';
import { useCart } from '@lib/cart-context';
import type { CakeConfiguratorOptionsDto, CakeOptionDto, CartDto } from '@types-app/index';

type CakeDimension = 'SIZE' | 'FLAVOR' | 'FILLING' | 'TOPPING' | 'TOPPER';
type ToppingType = 'NAKED' | 'VINTAGE';

const DIMENSION_LABELS: Record<CakeDimension, string> = {
  SIZE: 'Tamaño',
  FLAVOR: 'Sabor de bizcocho',
  FILLING: 'Relleno',
  TOPPING: 'Tipo de decoración',
  TOPPER: 'Topper',
};

interface CakeConfiguratorProps {
  productId: string;
  productName: string;
  productImage?: string;
  basePrice: number;
  options: CakeConfiguratorOptionsDto;
  onAddToCart?: () => void;
}

export function CakeConfigurator({
  productId,
  productName,
  productImage,
  basePrice,
  options,
  onAddToCart,
}: CakeConfiguratorProps) {
  const { data: session } = useSession();
  const { refresh } = useCart();
  const [selected, setSelected] = useState<Partial<Record<CakeDimension, CakeOptionDto>>>({});
  const [toppingType, setToppingType] = useState<ToppingType>('NAKED');
  const [toppingDescription, setToppingDescription] = useState('');
  const [message, setMessage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalPrice = useMemo(() => {
    const size = selected.SIZE?.priceModifier ?? 0;
    const flavor = selected.FLAVOR?.priceModifier ?? 0;
    const filling = selected.FILLING?.priceModifier ?? 0;
    const topping = selected.TOPPING?.priceModifier ?? 0;
    const topper = selected.TOPPER?.priceModifier ?? 0;
    return basePrice + size + flavor + filling + topping + topper;
  }, [basePrice, selected]);

  const isComplete = selected.SIZE && selected.FLAVOR && selected.FILLING;

  const handleAdd = async () => {
    if (!isComplete) return;
    if (toppingType === 'VINTAGE' && !toppingDescription.trim()) return;

    const cakeConfig = {
      sizeId: selected.SIZE!.id,
      flavorId: selected.FLAVOR!.id,
      fillingId: selected.FILLING!.id,
      toppingType,
      ...(toppingDescription ? { toppingDescription } : {}),
      ...(selected.TOPPING ? { toppingId: selected.TOPPING.id } : {}),
      ...(selected.TOPPER ? { topperId: selected.TOPPER.id } : {}),
      ...(message ? { message } : {}),
    };

    setLoading(true);
    try {
      if (session?.backendToken) {
        await apiFetch<CartDto>('/cart/items', {
          method: 'POST',
          token: session.backendToken,
          body: JSON.stringify({
            productId,
            productName,
            cakeConfig,
            quantity,
            unitPrice: totalPrice,
            imageUrl: productImage,
          }),
        });
      } else {
        addToAnonymousCart({
          productId,
          productName,
          cakeConfig,
          quantity,
          unitPrice: totalPrice,
          imageUrl: productImage,
        });
      }
      refresh();
      setAdded(true);
      onAddToCart?.();
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  const renderDimension = (dim: CakeDimension, dimOptions: CakeOptionDto[]) => {
    if (dimOptions.length === 0) return null;
    const isOptional = dim === 'TOPPER';

    return (
      <div key={dim} className="space-y-2">
        <p className="text-sm font-medium">
          {DIMENSION_LABELS[dim]}
          {isOptional && <span className="ml-1 text-muted-foreground text-xs">(opcional)</span>}
        </p>
        <div className="flex flex-wrap gap-2">
          {dimOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() =>
                setSelected((prev) =>
                  prev[dim]?.id === opt.id && isOptional
                    ? { ...prev, [dim]: undefined }
                    : { ...prev, [dim]: opt },
                )
              }
              className={cn(
                'px-3 py-1.5 rounded-lg border text-sm transition-colors',
                selected[dim]?.id === opt.id
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:border-primary/50',
              )}
            >
              {opt.name}
              {opt.priceModifier > 0 && dim !== 'SIZE' && (
                <span className="ml-1 text-xs text-muted-foreground">
                  +{formatCOP(opt.priceModifier)}
                </span>
              )}
              {dim === 'SIZE' && (
                <span className="ml-1 text-xs text-muted-foreground">{formatCOP(opt.priceModifier)}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderDimension('SIZE', options.sizes)}
      {renderDimension('FLAVOR', options.flavors)}
      {renderDimension('FILLING', options.fillings)}

      {/* Topping type */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Tipo de acabado</p>
        <div className="flex gap-2">
          {(['NAKED', 'VINTAGE'] as ToppingType[]).map((t) => (
            <button
              key={t}
              onClick={() => setToppingType(t)}
              className={cn(
                'px-3 py-1.5 rounded-lg border text-sm transition-colors',
                toppingType === t
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:border-primary/50',
              )}
            >
              {t === 'NAKED' ? 'Naked' : 'Vintage'}
            </button>
          ))}
        </div>
        {toppingType === 'VINTAGE' && (
          <input
            type="text"
            placeholder="Descripción del acabado vintage (requerido)"
            value={toppingDescription}
            onChange={(e) => setToppingDescription(e.target.value)}
            className="w-full mt-2 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
        )}
      </div>

      {renderDimension('TOPPING', options.toppings)}
      {renderDimension('TOPPER', options.toppers)}

      {/* Message */}
      <div className="space-y-1">
        <p className="text-sm font-medium">
          Mensaje en la torta
          <span className="ml-1 text-muted-foreground text-xs">(opcional, máx. 60 caracteres)</span>
        </p>
        <input
          type="text"
          maxLength={60}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ej: Feliz cumpleaños Sofía 🎂"
          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground text-right">{message.length}/60</p>
      </div>

      {/* Quantity + Add */}
      <div className="flex items-center gap-4 pt-2">
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-lg hover:bg-muted transition-colors"
          >
            −
          </button>
          <span className="px-4 py-2 text-sm font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="px-3 py-2 text-lg hover:bg-muted transition-colors"
          >
            +
          </button>
        </div>

        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Total estimado</p>
          <p className="text-xl font-bold text-primary">{formatCOP(totalPrice * quantity)}</p>
        </div>
      </div>

      <button
        onClick={handleAdd}
        disabled={!isComplete || (toppingType === 'VINTAGE' && !toppingDescription.trim()) || loading}
        className={cn(
          'w-full py-3 rounded-xl font-semibold text-white transition-all',
          isComplete && !(toppingType === 'VINTAGE' && !toppingDescription.trim()) && !loading
            ? added
              ? 'bg-green-500'
              : 'bg-primary hover:opacity-90'
            : 'bg-muted text-muted-foreground cursor-not-allowed',
        )}
      >
        {loading ? 'Agregando...' : added ? '¡Agregado al carrito! ✓' : 'Agregar al carrito'}
      </button>

      {!isComplete && (
        <p className="text-xs text-muted-foreground text-center">
          Selecciona tamaño, sabor y relleno para continuar
        </p>
      )}
    </div>
  );
}
