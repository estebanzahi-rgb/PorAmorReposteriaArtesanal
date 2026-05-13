# HU-02 — Email de confirmación de pago al cliente

**Como** administradora del negocio  
**Quiero** que el cliente reciba automáticamente un email de confirmación cuando su pedido pasa al estado "Recibido"  
**Para** que el cliente quede tranquilo de que su pago fue registrado y su pedido está en proceso de preparación

---

## Criterios de Aceptación

### Escenario 1: El pedido cambia a estado RECEIVED y el cliente recibe el email de confirmación
**Dado** que existe un pedido PAM-2026-0010 con estado `PENDING_PAYMENT` y el campo `customerEmail` es "maria@email.com"  
**Cuando** la administradora cambia el estado del pedido a `RECEIVED` desde el panel admin  
**Entonces** el sistema envía un email a "maria@email.com" con asunto "Tu pedido PAM-2026-0010 ha sido confirmado — PorAmor Repostería" que incluye: número de pedido, listado de productos con cantidades, total a pagar, tipo de entrega y fecha/hora de entrega programada

### Escenario 2: El servicio de email falla al enviar la confirmación
**Dado** que el servicio Resend retorna un error HTTP 500 al intentar enviar el email  
**Cuando** el sistema procesa el cambio de estado del pedido a `RECEIVED`  
**Entonces** el cambio de estado del pedido se completa correctamente de todas formas, el error de email se registra en los logs del sistema (nivel `error`) y la administradora no ve ningún mensaje de error en la UI del panel admin

### Escenario 3: El sistema intenta confirmar un pedido que ya fue confirmado previamente
**Dado** que el pedido PAM-2026-0010 ya tiene estado `RECEIVED` y el email de confirmación ya fue enviado  
**Cuando** el sistema procesa nuevamente el evento de cambio de estado para ese pedido (ej. por reintento de webhook o doble clic)  
**Entonces** el sistema no envía un segundo email de confirmación al cliente

### Escenario 4: El pedido cambia a un estado diferente de RECEIVED
**Dado** que existe un pedido con estado `RECEIVED`  
**Cuando** la administradora cambia el estado a `IN_PREPARATION`  
**Entonces** el sistema NO envía ningún email al cliente (el email de confirmación solo se dispara en la transición `PENDING_PAYMENT → RECEIVED`)

---

## Edge Cases Identificados
- El `customerEmail` del pedido puede ser diferente al email de la cuenta Google del usuario; se usa siempre `Order.customerEmail`
- El email debe incluir la fecha de entrega (`scheduledAt`) solo si existe; en pedidos anteriores a HU-01 el campo puede estar ausente
- El dominio del remitente debe estar verificado en Resend antes del despliegue a producción para evitar que el email caiga en spam

---

## Fuera de Alcance
- Emails para otros cambios de estado (IN_PREPARATION, READY, SHIPPED, DELIVERED)
- Email de notificación a la administradora cuando llega un pedido nuevo (ya existe en el sistema)
- Plantillas de email personalizables desde el panel admin
- Reenvío manual del email de confirmación desde el admin

---

## Definición de Done
- [ ] El email se envía automáticamente al cliente cuando el pedido cambia de `PENDING_PAYMENT` a `RECEIVED`
- [ ] El email incluye: número de pedido, productos con cantidades, total, tipo de entrega y fecha de entrega (si aplica)
- [ ] Si el envío falla, el estado del pedido se actualiza de todas formas y el error queda en los logs
- [ ] No se envía email duplicado si el pedido ya estaba en `RECEIVED`
- [ ] El asunto del email es exactamente "Tu pedido [orderNumber] ha sido confirmado — PorAmor Repostería"
- [ ] Test de integración verifica que el UseCase de cambio de estado invoca el puerto de email con los parámetros correctos
- [ ] Variables de entorno `RESEND_API_KEY` y `EMAIL_FROM` documentadas en `.env.example`

---

## Revisión DoR (Refinador)

- ✅ Tiene título claro y único
- ✅ Datos concretos en Escenario 1: número de pedido PAM-2026-0010, email "maria@email.com", asunto exacto
- ✅ El Escenario 2 especifica comportamiento exacto ante falla (no dice "maneja el error")
- ✅ Idempotencia cubierta en Escenario 3
- ✅ Dependencia con HU-01 (scheduledAt en el email) declarada en Edge Cases como opcional
- ✅ Fuera de alcance delimita correctamente: no cubre notificaciones para otros estados
- ✅ Implementable en menos de 5 días

---

## Notas de Arquitectura

- **Dominio:** `notification` (nuevo dominio transversal)
- **Entidades / VOs involucrados:** `EmailNotification` (Value Object — `to: string`, `subject: string`, `htmlBody: string`)
- **Puerto de entrada:** `ISendOrderConfirmationEmailUseCase(orderId: string): Promise<void>`
- **Puerto de salida:** `IEmailPort.send(notification: EmailNotification): Promise<void>`
- **Adaptador de salida:** `ResendEmailAdapter` en `notification/infrastructure/adapters/`
- **Capa Next.js:** N/A — el disparo del email ocurre en el backend NestJS, activado por un Domain Event `OrderStatusChanged` publicado en el UseCase de actualización de estado de Order
- **Schema Prisma:** Sin cambios. Una tabla `email_log` para auditoría es fuera de alcance de esta HU.
- **Variables de entorno nuevas:** `RESEND_API_KEY`, `EMAIL_FROM` (ej. `pedidos@poramorreposteria.com`)
- **Restricciones técnicas:**
  - El dominio `notification` NO importa del dominio `order` directamente; se comunica mediante el evento de dominio `OrderStatusChangedEvent { orderId, previousStatus, newStatus }` para mantener el desacoplamiento hexagonal
  - La transición de estado `PENDING_PAYMENT → RECEIVED` ya existe en el UseCase de Order; debe publicar el evento que el `OrderConfirmationEmailHandler` del dominio `notification` escucha
  - El handler de email debe ser asíncrono y no bloquear la respuesta HTTP de actualización de estado (usar `@OnEvent` de NestJS EventEmitter o equivalente)
  - Resend requiere verificación de dominio DNS antes de producción; documentar en el runbook de deployment

**Estado: APROBADA**
