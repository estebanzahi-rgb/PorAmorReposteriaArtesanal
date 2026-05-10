# HU-023: Ver precios con descuento activo en catálogo y carrito

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-023 |
| **Epic** | EPIC 9 — Descuentos |
| **Estado** | APROBADA |
| **Prioridad** | Media |
| **Dependencias** | HU-004, HU-005, HU-008, HU-026, HU-027 |
| **Bloquea** | Ninguna |

## Descripción

Yo como **visitante** quiero **ver claramente cuando un producto tiene un descuento activo, con el precio original tachado y el precio con descuento destacado** para **saber qué ofertas están disponibles**.

## Notas de Arquitectura

- **Dominio:** Discount
- **Entidades / VOs involucrados:** `ActiveDiscount { productId, type: PRODUCT_DISCOUNT | QUANTITY_DISCOUNT, discountedPrice, originalPrice, reason }`
- **Puerto de entrada:** `GetActiveDiscountForProductUseCase(productId, quantity?: number): ActiveDiscount | null`
- **Puerto de salida:** `DiscountRepository.findActiveForProduct(productId)`
- **Capa Next.js:** Server Component para catálogo y detalle; re-cálculo en cliente al cambiar cantidad en carrito
- **Restricciones técnicas:** El descuento se recalcula al momento del checkout, no al agregar al carrito. En el carrito, el descuento por cantidad solo se muestra si la cantidad del ítem alcanza el umbral. Si dos descuentos aplican, se muestra solo el mayor con la nota de aclaración.

## Criterios de Aceptación

### Escenario 1: Producto con descuento por producto en el catálogo

```gherkin
Dado que el producto "Trufas artesanales" tiene un descuento activo del 20%
Cuando veo ese producto en el catálogo
Entonces veo el precio original tachado ($X)
Y veo el precio con descuento destacado ($X × 0.80)
Y veo la etiqueta "20% OFF" sobre la imagen del producto
```

### Escenario 2: Descuento por cantidad aplicado en el carrito

```gherkin
Dado que existe la regla: comprar 3+ trufas da 15% de descuento
Y tengo 3 unidades de "Trufas artesanales" en mi carrito
Cuando veo el carrito
Entonces veo el precio por unidad con el 15% de descuento aplicado
Y veo la nota: "Compraste 3 o más unidades: 15% de descuento aplicado"
```

### Escenario 3: Descuento mayor gana con nota de aclaración

```gherkin
Dado que "Trufas artesanales" tiene descuento por producto del 20%
Y tengo 3 unidades cumpliendo la regla de cantidad del 15%
Cuando veo el carrito
Entonces veo aplicado el descuento del 20% (el mayor)
Y veo la nota: "Se aplicó el descuento de mayor valor disponible para este producto"
```

### Escenario 4: Descuento vencido no se muestra

```gherkin
Dado que el descuento por producto de "Trufas artesanales" venció a medianoche
Cuando accedo al catálogo al día siguiente
Entonces veo el precio original sin tachado ni etiqueta de descuento
```

## Edge Cases

- Descuento activo pero producto en carrito desde antes de que se activara → el descuento se recalcula al llegar al checkout, no retroactivamente al carrito
- Cambiar la cantidad de un ítem en el carrito de 2 a 3 cumpliendo el umbral → recalcular y mostrar el descuento por cantidad en tiempo real

## Fuera de alcance

- Historial de descuentos pasados
- Notificaciones push/email de descuentos activos

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenario 3 para descuento mayor con nota. Escenario 4 para descuento vencido |
| 2026-05-08 | Arquitecto | Recálculo en checkout, no en carrito. Re-cálculo reactivo en carrito al cambiar cantidad |
