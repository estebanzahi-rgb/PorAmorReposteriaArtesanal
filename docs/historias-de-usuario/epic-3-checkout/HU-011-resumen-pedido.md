# HU-011: Ver resumen del pedido antes de pagar

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-011 |
| **Epic** | EPIC 3 — Checkout |
| **Estado** | APROBADA |
| **Prioridad** | Alta |
| **Dependencias** | HU-010 |
| **Bloquea** | HU-012 |

## Descripción

Yo como **usuario autenticado en proceso de checkout** quiero **ver un resumen completo de mi pedido antes de pagar** para **verificar que todo esté correcto antes de confirmar**.

## Notas de Arquitectura

- **Dominio:** Order
- **Entidades / VOs involucrados:** `OrderSummary { items[], subtotal, deliveryCost, discountAmount?, couponAmount?, total }`, `OrderDraft`
- **Puerto de entrada:** `GetOrderSummaryUseCase(draftId): OrderSummary`
- **Puerto de salida:** `OrderDraftRepository.findById(draftId)`
- **Capa Next.js:** Server Component (el resumen se genera en el servidor para evitar manipulación de precios en el cliente)
- **Restricciones técnicas:** El `total` mostrado aquí es el que se usará para el pago — se firma o se guarda en el servidor para evitar que el cliente lo modifique antes de confirmar. Si hay descuento activo, se calcula y aplica aquí (ver EPIC 9).

## Criterios de Aceptación

### Escenario 1: Ver resumen sin descuentos ni domicilio

```gherkin
Dado que completé mis datos y elegí "Recoger en el local"
Cuando avanzo al resumen
Entonces veo la lista de ítems con nombre, cantidad y precio unitario
Y veo el subtotal (suma de todos los ítems)
Y veo el costo de envío como $0
Y veo el total final igual al subtotal
```

### Escenario 2: Ver resumen con domicilio

```gherkin
Dado que completé mis datos y elegí "Envío a domicilio"
Cuando avanzo al resumen
Entonces veo el subtotal de los ítems
Y veo el costo de envío con el valor configurado por el admin
Y veo el total final = subtotal + costo de envío
```

### Escenario 3: Ver resumen con descuento aplicado

```gherkin
Dado que uno de mis productos tiene un descuento activo del 15%
Cuando avanzo al resumen
Entonces veo el precio original del producto tachado y el precio con descuento aplicado
Y veo una línea "Descuento aplicado: -$X"
Y veo el total final con el descuento descontado
```

### Escenario 4: Volver al carrito para modificar pedido

```gherkin
Dado que estoy en la pantalla de resumen
Cuando hago clic en "Modificar pedido"
Entonces soy redirigido a /carrito con todos mis ítems intactos
Y el proceso de checkout se puede retomar desde el carrito
```

## Edge Cases

- Precio de un ítem cambió entre que el usuario agregó al carrito y llegó al resumen → mostrar aviso: "El precio de [producto] ha cambiado. El precio actualizado es $Y." y recalcular el total
- Total es $0 (todos los ítems tienen descuento del 100%) → flujo de pago se omite y el pedido se confirma directamente

## Fuera de alcance

- Aplicación de cupón (se hace en la pantalla de pago, HU-024)
- Selección de fecha/hora de entrega

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenarios con totales concretos. Escenario 4 agregado para modificación |
| 2026-05-08 | Arquitecto | Total firmado en servidor para evitar manipulación. Edge case de cambio de precio documentado |
