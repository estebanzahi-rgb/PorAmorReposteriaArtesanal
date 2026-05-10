# HU-021: Actualizar estado de un pedido (máquina de estados)

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-021 |
| **Epic** | EPIC 8 — Admin: Pedidos |
| **Estado** | APROBADA |
| **Prioridad** | Alta |
| **Dependencias** | HU-020 |
| **Bloquea** | Ninguna |

## Descripción

Yo como **administradora** quiero **actualizar el estado de un pedido siguiendo la secuencia de estados válidos** para **mantener informado al proceso de producción y entrega**.

## Notas de Arquitectura

- **Dominio:** Order (Admin)
- **Entidades / VOs involucrados:** `Order`, `OrderStatus`, `OrderStatusTransition`
- **Puerto de entrada:** `UpdateOrderStatusUseCase(orderId, newStatus: OrderStatus)`
- **Puerto de salida:** `OrderRepository.updateStatus(orderId, status)`
- **Capa Next.js:** Server Action
- **Restricciones técnicas:** La máquina de estados es: `RECEIVED → IN_PREPARATION → READY → SHIPPED (solo DELIVERY) → DELIVERED → CANCELLED (desde cualquier estado)`. Las transiciones inválidas deben ser rechazadas en el dominio. SHIPPED solo es una transición válida si `order.deliveryType = DELIVERY`.

## Máquina de estados

```
RECEIVED → IN_PREPARATION → READY ─┬─(PICKUP)──→ DELIVERED
                                     └─(DELIVERY)─→ SHIPPED → DELIVERED
Desde cualquier estado → CANCELLED
```

## Criterios de Aceptación

### Escenario 1: Avanzar estado en pedido de recogida

```gherkin
Dado que el pedido PAM-2026-0001 es de tipo "Recogida" y está en estado "Recibido"
Cuando selecciono el nuevo estado "En preparación" y confirmo
Entonces el estado del pedido cambia a "En preparación"
Y veo la confirmación: "Estado actualizado correctamente"
```

### Escenario 2: Pedido de domicilio pasa por estado "Enviado"

```gherkin
Dado que el pedido PAM-2026-0002 es de tipo "Domicilio" y está en estado "Listo"
Cuando selecciono el estado "Enviado"
Entonces el estado cambia a "Enviado"
```

### Escenario 3: Pedido de recogida no puede pasar a "Enviado"

```gherkin
Dado que el pedido PAM-2026-0003 es de tipo "Recogida" y está en estado "Listo"
Cuando el sistema genera las opciones de siguiente estado
Entonces la opción "Enviado" no está disponible
Y solo se muestra la opción "Entregado"
```

### Escenario 4: Cancelar pedido desde cualquier estado

```gherkin
Dado que el pedido PAM-2026-0004 está en estado "En preparación"
Cuando selecciono "Cancelar pedido" y confirmo
Entonces el estado cambia a "Cancelado"
Y el pedido aparece marcado visualmente como cancelado en el listado
```

### Escenario 5: Transición de estado inválida bloqueada

```gherkin
Dado que el pedido PAM-2026-0005 está en estado "Entregado"
Cuando intento cambiarlo a "En preparación" (transición inválida)
Entonces el sistema rechaza la acción con el mensaje: "Esta transición de estado no es válida"
Y el estado del pedido no cambia
```

## Edge Cases

- Admin intenta cambiar estado de pedido cancelado a cualquier otro → rechazado como transición inválida
- Actualización de estado concurrente (dos admins a la vez) → el segundo recibe error: "El estado del pedido fue actualizado por otra sesión. Recarga la página."

## Fuera de alcance

- Notificación automática al cliente cuando cambia el estado del pedido
- Historial de cambios de estado del pedido visible en el panel

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenario 5 para transición inválida. Diagrama de máquina de estados incluido |
| 2026-05-08 | Arquitecto | Restricción SHIPPED solo para DELIVERY documentada. Transiciones manejadas en capa de dominio |
