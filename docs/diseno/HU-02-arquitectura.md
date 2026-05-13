# Arquitectura HU-02 — Email de confirmación al cliente

## Auditoría de código existente

| Artefacto | Ubicación | Estado |
|---|---|---|
| `EmailPort` | `src/backend/src/notification/domain/ports/out/email.port.ts` | Existe — reusar sin cambios |
| `ResendEmailAdapter` | `src/backend/src/notification/infrastructure/adapters/resend-email.adapter.ts` | Existe — reusar sin cambios |
| `SendOrderConfirmationUseCase` (port) | `src/backend/src/notification/domain/ports/in/send-order-confirmation.use-case.ts` | Existe — envía al OWNER (admin). No modificar |
| `SendOrderConfirmationImpl` | `src/backend/src/notification/application/use-cases/send-order-confirmation.impl.ts` | Existe — envía al OWNER. No modificar |
| `OrderPlacedHandler` | `src/backend/src/notification/application/event-handlers/order-placed.handler.ts` | Existe — escucha `order.placed`. No modificar |
| `OrderPlacedEvent` | `src/backend/src/order/domain/events/order-placed.event.ts` | Existe — patrón a seguir para nuevo evento |
| `UpdateOrderStatusImpl` | `src/backend/src/order/application/use-cases/update-order-status.impl.ts` | Existe — modificar: inyectar `EventEmitter2`, emitir evento tras transición |
| `DomainEvent` | `src/backend/src/shared/domain/events/domain-event.ts` | Existe — clase base a extender |
| `Order.transitionTo()` | `src/backend/src/order/domain/entities/order.entity.ts` | Existe — modificar: pushear `OrderStatusChangedEvent` a `_domainEvents` |

**Conclusión de auditoría:** El canal de notificación (EmailPort + ResendEmailAdapter) está completamente operativo. Solo se añaden:
- Un nuevo Domain Event en el dominio `order`
- Un nuevo port + use case en el módulo `notification` (envío al cliente, no al owner)
- Un nuevo event handler en `notification`
- Modificaciones menores en `Order.transitionTo()` y `UpdateOrderStatusImpl`

---

## Cambios al schema Prisma

Ninguno.

---

## Nuevas entidades / Value Objects

Ninguna entidad nueva. Solo un nuevo Domain Event en el dominio `order`:

```typescript
// src/backend/src/order/domain/events/order-status-changed.event.ts
import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { OrderStatus } from '../entities/order.entity';

export class OrderStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly newStatus: OrderStatus,
    public readonly order: unknown, // evita dependencia circular — se castea en el handler
  ) {
    super();
  }

  get eventName(): string {
    return 'order.status.changed';
  }
}
```

---

## Ports nuevos o modificados

### Puerto de entrada — nuevo

```typescript
// src/backend/src/notification/domain/ports/in/send-order-received-notification.use-case.ts
import { Order } from '../../../../order/domain/entities/order.entity';

// Envía email de confirmación al CLIENTE cuando el pedido pasa a RECEIVED
export interface SendOrderReceivedNotificationUseCase {
  execute(order: Order): Promise<void>;
}
```

### Modificación al puerto de entrada `UpdateOrderStatusUseCase`

El contrato (`UpdateOrderStatusCommand` e interfaz) no cambia. Solo cambia la implementación (`UpdateOrderStatusImpl`) para inyectar `EventEmitter2` y emitir los eventos del agregado `Order`.

---

## Estructura de carpetas

Solo archivos nuevos (las modificaciones a existentes se detallan en Notas):

```
src/backend/src/order/domain/events/
  order-status-changed.event.ts                                         ← NUEVO

src/backend/src/notification/domain/ports/in/
  send-order-received-notification.use-case.ts                          ← NUEVO

src/backend/src/notification/application/use-cases/
  send-order-received-notification.impl.ts                              ← NUEVO

src/backend/src/notification/application/event-handlers/
  order-status-changed.handler.ts                                       ← NUEVO
```

Archivos existentes a modificar:

```
src/backend/src/order/domain/entities/order.entity.ts
  → Order.transitionTo() pushea OrderStatusChangedEvent a _domainEvents

src/backend/src/order/application/use-cases/update-order-status.impl.ts
  → Inyectar EventEmitter2
  → Después de orderRepo.save(order), emitir order.pullDomainEvents()

src/backend/src/notification/notification.module.ts
  → Registrar SEND_ORDER_RECEIVED_NOTIFICATION_USE_CASE token
  → Registrar OrderStatusChangedHandler como provider
```

---

## Variables de entorno nuevas

Ninguna. El email del cliente viene del campo `order.customerEmail` (persistido en DB).

---

## Notas de implementación

### 1. Patrón de emisión de eventos (consistente con PlaceOrderImpl)

```typescript
// En Order.transitionTo() — agregar al final tras actualizar this.status:
this._domainEvents.push(
  new OrderStatusChangedEvent(this.id, this.orderNumber, newStatus, this)
);

// En UpdateOrderStatusImpl.execute() — inyectar EventEmitter2 y emitir:
const saved = await this.orderRepo.save(order);
for (const event of order.pullDomainEvents()) {
  this.eventEmitter.emit(event.eventName, event);
}
return saved;
```

### 2. Handler en notification — filtro por status RECEIVED

```typescript
// src/backend/src/notification/application/event-handlers/order-status-changed.handler.ts
@OnEvent('order.status.changed')
async handle(event: OrderStatusChangedEvent): Promise<void> {
  if (event.newStatus !== 'RECEIVED') return;   // solo notificar al confirmar pedido
  try {
    await this.sendNotification.execute(event.order as Order);
  } catch (err) {
    this.logger.error(`Failed to send received notification for ${event.orderNumber}: ...`);
  }
}
```

### 3. Contenido del email al cliente

`SendOrderReceivedNotificationImpl` envía a `order.customerEmail` (no al owner). El asunto sugiere:
```
"¡Tu pedido #{order.orderNumber} fue recibido! — PorAmor Repostería"
```

El cuerpo reutiliza la misma función `formatCOP` y la misma tabla de items que `SendOrderConfirmationImpl`, pero adaptado al cliente:
- Confirmación de recepción del pedido
- Resumen de items y totales
- Fecha/hora de entrega si `scheduledAt` está presente (HU-01)
- Enlace de WhatsApp al negocio para consultas

### 4. Token nuevo en notification.tokens.ts

```typescript
// Agregar a src/backend/src/notification/notification.tokens.ts
export const SEND_ORDER_RECEIVED_NOTIFICATION_USE_CASE =
  'SEND_ORDER_RECEIVED_NOTIFICATION_USE_CASE';
```

### 5. Circularidad de eventos

`OrderStatusChangedEvent.order` es `unknown` (mismo patrón que `OrderPlacedEvent.order`) para evitar que el módulo `notification` importe directamente de `order/domain/entities`. El handler castea a `Order` tras inyectar la dependencia.

### 6. Idempotencia

Si la transición RECEIVED se ejecuta dos veces (error de red + retry), el segundo `transitionTo()` lanzará `BadRequestException` porque la máquina de estados prohíbe `RECEIVED → RECEIVED`. No se enviarán emails duplicados.
