# HU-013: Procesar pago mock y confirmar pedido

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-013 |
| **Epic** | EPIC 4 — Pagos (Mock) |
| **Estado** | APROBADA |
| **Prioridad** | Alta |
| **Dependencias** | HU-012 |
| **Bloquea** | HU-014, HU-015 |

## Descripción

Yo como **usuario autenticado que seleccionó un método de pago** quiero **que mi pago sea procesado y recibir la confirmación de mi pedido** para **saber que mi compra quedó registrada exitosamente**.

## Notas de Arquitectura

- **Dominio:** Order + Payment
- **Entidades / VOs involucrados:** `Order { id, orderNumber, status: RECEIVED, items[], total, paymentMethod, deliveryType, createdAt }`, `Payment { id, orderId, method, status: APPROVED, amount }`
- **Puerto de entrada:** `ConfirmOrderUseCase(orderId, paymentMethod)`
- **Puerto de salida:** `PaymentGatewayPort.charge(intent)`, `OrderRepository.save(order)`, `NotificationPort.notifyOwner(order)` (dispara HU-014 y HU-015)
- **Capa Next.js:** Server Action
- **Restricciones técnicas:** El `MockPaymentAdapter` siempre retorna `APPROVED`. El `orderNumber` es un identificador legible (ej. `PAM-2026-0001`). El carrito se vacía solo después de confirmar el pago exitoso. El dominio dispara un `OrderPlacedEvent` que activa las notificaciones.

## Criterios de Aceptación

### Escenario 1: Pago mock exitoso y pedido confirmado

```gherkin
Dado que seleccioné un método de pago y hago clic en "Pagar"
Cuando el mock de pago procesa la transacción
Entonces soy redirigido a /pedido/[orderNumber]/confirmacion
Y veo el mensaje: "¡Pedido confirmado! Tu número de pedido es PAM-2026-XXXX"
Y veo el resumen del pedido: ítems, total pagado, método de pago y tipo de entrega
Y mi carrito queda vacío
```

### Escenario 2: Pago mock fallido (escenario de prueba)

```gherkin
Dado que el mock está configurado para simular un fallo (flag de testing)
Cuando proceso el pago
Entonces veo el mensaje: "No fue posible procesar tu pago. Intenta de nuevo o elige otro método."
Y soy redirigido a la pantalla de selección de método de pago
Y el pedido no se crea
Y el carrito permanece intacto
```

### Escenario 3: Número de pedido legible generado

```gherkin
Dado que el pago fue aprobado
Cuando se crea el pedido
Entonces el número de pedido sigue el formato PAM-[AÑO]-[SECUENCIAL]
Y ese número es único y aparece en la pantalla de confirmación
Y el pedido es visible en /mis-pedidos
```

### Escenario 4: Confirmación visible en historial de pedidos

```gherkin
Dado que el pedido fue confirmado exitosamente
Cuando accedo a /mis-pedidos
Entonces veo el pedido recién creado con estado "Recibido"
Y veo el número de pedido, fecha, total y tipo de entrega
```

## Edge Cases

- Doble clic en "Pagar" → idempotencia: el servidor solo procesa el pago una vez por `orderId`
- Cierre del navegador después de aprobar el pago pero antes de ver la confirmación → el pedido ya fue creado; al acceder a /mis-pedidos el usuario lo encontrará

## Fuera de alcance

- Integración con pasarelas de pago reales (PSE, Stripe, MercadoPago)
- Reembolsos
- Factura electrónica

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenario de fallo documentado. Número de pedido con formato explícito |
| 2026-05-08 | Arquitecto | Idempotencia de pago documentada. OrderPlacedEvent para notificaciones. Carrito vaciado condicionado al pago exitoso |
