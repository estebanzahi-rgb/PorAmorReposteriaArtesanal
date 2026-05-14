# ADR-005: Precio total en configuradores = precio base + suma de modificadores

## Estado
Adoptado — 2026-05-13

## Contexto

Los configuradores de productos con opciones (tortas, combos personalizables) calculan un precio total sumando los modificadores de precio de cada opción seleccionada. El error común es calcular el total como la **suma pura de modificadores**, ignorando el precio base del producto.

Este bug silencioso resulta en que el producto se muestra a $0 o a un precio irreal cuando ninguna opción tiene modificador (por ejemplo, el primer tamaño tiene priceModifier=0).

## Decisión

El `totalPrice` de cualquier configurador **siempre** empieza desde `basePrice` y acumula los modificadores:

```typescript
// CORRECTO
const totalPrice = useMemo(() => {
  const size    = selected.SIZE?.priceModifier    ?? 0;
  const flavor  = selected.FLAVOR?.priceModifier  ?? 0;
  const filling = selected.FILLING?.priceModifier ?? 0;
  const topping = selected.TOPPING?.priceModifier ?? 0;
  const topper  = selected.TOPPER?.priceModifier  ?? 0;
  return basePrice + size + flavor + filling + topping + topper;
}, [basePrice, selected]);

// INCORRECTO (precio base ignorado)
const totalPrice = useMemo(() => {
  return (selected.SIZE?.priceModifier ?? 0) + ...;
}, [selected]);
```

`basePrice` debe pasarse como **prop explícita** del componente configurador, nunca asumirse desde un estado global o contexto. El componente padre es responsable de calcular `basePrice` incluyendo descuentos activos:

```tsx
// page.tsx (padre)
const discountedPrice = product.activeDiscountPercentage
  ? product.basePrice * (1 - product.activeDiscountPercentage / 100)
  : null;

<CakeConfigurator
  basePrice={discountedPrice ?? product.basePrice}  // siempre explícito
  ...
/>
```

## Consecuencias

**Positivas:**
- El precio mostrado en el configurador siempre coincide con lo que se cobra en el pedido.
- Los descuentos del producto se propagan automáticamente al configurador.
- El contrato de la prop `basePrice` hace explícita la dependencia.

**Negativas:**
- El componente configurador necesita recibir el `basePrice` como prop en vez de calcularlo internamente, lo que requiere que el padre tenga acceso al producto y su descuento activo.

## Regla de verificación

Al testear un configurador:
1. Abrir el producto con la primera opción de cada dimensión seleccionada.
2. El precio debe ser ≥ `basePrice` del producto.
3. Si el primer tamaño tiene `priceModifier=0`, el total debe ser igual a `basePrice`, no $0.

## Aplicación en nuevas tiendas

Este patrón aplica para cualquier producto con configuración por opciones:
- Tortas personalizadas
- Combos armables
- Menús con extras
- Cualquier producto con variantes que tengan modificadores de precio

La regla es simple: **el precio base nunca se infiere de los modificadores; siempre viene como dato explícito del producto**.
