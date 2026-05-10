# HU-025: Cálculo y visualización del descuento en resumen del pedido

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-025 |
| **Epic** | EPIC 9 — Descuentos |
| **Estado** | APROBADA |
| **Prioridad** | Media |
| **Dependencias** | HU-011, HU-024 |
| **Bloquea** | HU-013 |

## Descripción

Yo como **usuario autenticado en el resumen del pedido** quiero **ver claramente qué descuentos se aplicaron y cómo afectan el total** para **entender exactamente lo que voy a pagar**.

## Notas de Arquitectura

- **Dominio:** Order + Discount
- **Entidades / VOs involucrados:** `OrderSummary`, `DiscountLine { type, description, amount }`
- **Puerto de entrada:** `GetOrderSummaryUseCase(draftId): OrderSummary` (ya definido en HU-011, se extiende con líneas de descuento)
- **Puerto de salida:** `DiscountRepository`
- **Capa Next.js:** Server Component — el cálculo final siempre en servidor
- **Restricciones técnicas:** Fórmula: `total = subtotal + deliveryCost - regularDiscount - couponDiscount`. El total nunca puede ser < $0. El resumen es de solo lectura; los descuentos no se modifican desde esta pantalla.

## Criterios de Aceptación

### Escenario 1: Resumen sin descuentos

```gherkin
Dado que ninguno de mis productos tiene descuento activo y no apliqué cupón
Cuando veo el resumen del pedido
Entonces veo: Subtotal, Envío y Total
Y no aparece ninguna línea de descuento
```

### Escenario 2: Resumen con descuento regular

```gherkin
Dado que tengo un producto con descuento activo del 20% ($15.000 de ahorro)
Cuando veo el resumen
Entonces veo la línea: "Descuento (20% off Trufas artesanales): -$15.000"
Y el total refleja el descuento restado del subtotal
```

### Escenario 3: Resumen con cupón aplicado

```gherkin
Dado que apliqué el cupón "CUMPLE10" con descuento de $10.000
Cuando veo el resumen
Entonces veo la línea: "Cupón CUMPLE10: -$10.000"
Y el total refleja el descuento del cupón
```

### Escenario 4: Resumen con descuento regular y cupón

```gherkin
Dado que hay un descuento regular de $15.000 y apliqué un cupón de $10.000
Cuando veo el resumen
Entonces veo ambas líneas separadas:
  | "Descuento (20% off Trufas): -$15.000" |
  | "Cupón CUMPLE10: -$10.000"             |
Y el total = subtotal + envío - $15.000 - $10.000
```

### Escenario 5: Dos descuentos regulares — solo el mayor aplicado con nota

```gherkin
Dado que aplican tanto un descuento por producto (20%) como uno por cantidad (15%)
Cuando veo el resumen
Entonces veo solo la línea del descuento del 20%
Y veo la nota: "Se aplicó el descuento de mayor valor disponible"
Y el descuento del 15% no aparece en el resumen
```

## Edge Cases

- Total después de descuentos resulta $0 → mostrar total como $0 con nota: "¡Tu pedido es completamente gratuito!"
- Descuento vence entre el resumen y la confirmación → el sistema recalcula al confirmar y muestra aviso si el descuento ya no aplica

## Fuera de alcance

- Desglose del descuento por ítem en el resumen (solo totales)

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenario 5 para descuento mayor. Fórmula de total explicitada |
| 2026-05-08 | Arquitecto | Cálculo siempre en servidor. Total mínimo $0. Recálculo al confirmar si descuento vence |
