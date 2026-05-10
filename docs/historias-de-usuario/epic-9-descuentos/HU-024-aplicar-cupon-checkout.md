# HU-024: Aplicar cupón en el checkout

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-024 |
| **Epic** | EPIC 9 — Descuentos |
| **Estado** | APROBADA |
| **Prioridad** | Media |
| **Dependencias** | HU-012, HU-028 |
| **Bloquea** | HU-025 |

## Descripción

Yo como **usuario autenticado en el paso de pago** quiero **ingresar un código de cupón para obtener un descuento adicional** para **aprovechar los beneficios que me dio la repostería**.

## Notas de Arquitectura

- **Dominio:** Discount
- **Entidades / VOs involucrados:** `Coupon { code, type: PERCENTAGE | FIXED_VALUE, value, usageLimit?, usageCount, isActive, expiresAt? }`
- **Puerto de entrada:** `ApplyCouponUseCase(orderId, couponCode): CouponApplication`
- **Puerto de salida:** `CouponRepository.findByCode(code)`, `CouponRepository.incrementUsage(couponId)`
- **Capa Next.js:** Client Component + Server Action
- **Restricciones técnicas:** El cupón se valida y aplica en el servidor. El descuento del cupón es adicional al descuento regular (si existe). Solo un cupón por pedido. El `usageCount` se incrementa solo al confirmar el pago, no al aplicar el cupón en pantalla.

## Criterios de Aceptación

### Escenario 1: Aplicar cupón de porcentaje válido

```gherkin
Dado que estoy en la pantalla de pago con un total de $100.000
Cuando ingreso el código "CUMPLE10" (cupón de 10% válido y con usos disponibles)
Y hago clic en "Aplicar"
Entonces veo la línea: "Cupón CUMPLE10: -$10.000"
Y el total se actualiza a $90.000
Y el botón "Pagar" muestra el nuevo monto
```

### Escenario 2: Aplicar cupón de valor fijo válido

```gherkin
Dado que estoy en la pantalla de pago con un total de $80.000
Cuando ingreso el código "REGALO20" (cupón de $20.000 de descuento)
Y hago clic en "Aplicar"
Entonces veo la línea: "Cupón REGALO20: -$20.000"
Y el total se actualiza a $60.000
```

### Escenario 3: Cupón inválido o inexistente

```gherkin
Dado que estoy en la pantalla de pago
Cuando ingreso el código "INVALIDO123" y hago clic en "Aplicar"
Entonces veo el mensaje de error: "El código ingresado no es válido"
Y el total del pedido no cambia
```

### Escenario 4: Cupón de uso único ya utilizado

```gherkin
Dado que el cupón "UNICOUSE" tiene límite de 1 uso y ya fue usado
Cuando ingreso ese código y hago clic en "Aplicar"
Entonces veo el mensaje: "Este cupón ya fue utilizado"
Y el total no cambia
```

### Escenario 5: Cupón coexistiendo con descuento regular

```gherkin
Dado que hay un descuento regular del 15% ya aplicado al pedido
Cuando aplico el cupón "EXTRA5" (5% adicional)
Entonces veo el descuento regular (-15%) y el cupón (-5%) como líneas separadas en el resumen
Y el total refleja ambos descuentos aplicados
```

## Edge Cases

- Cupón aplicado pero pago falla → el `usageCount` no se incrementó (se incrementa solo al confirmar), así que el cupón sigue válido para reintento
- Total después del cupón resulta en $0 o negativo → el total se fija en $0, no puede ser negativo

## Fuera de alcance

- Múltiples cupones en un mismo pedido (solo 1 cupón por pedido)
- Cupones vinculados a un usuario específico

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenario 5 para coexistencia con descuento regular. Mensajes exactos de error |
| 2026-05-08 | Arquitecto | usageCount incrementado solo al confirmar pago, no al aplicar. Total mínimo $0 |
