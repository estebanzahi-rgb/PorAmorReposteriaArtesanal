# HU-08 — Integración de MercadoPago Colombia como método de pago

**Como** cliente  
**Quiero** poder pagar mi pedido con MercadoPago Colombia (tarjeta de crédito/débito o PSE)  
**Para** completar mi compra de forma rápida y segura sin tener que hacer transferencias bancarias manuales

---

## Criterios de Aceptación

### Escenario 1: El cliente elige MercadoPago y completa el pago exitosamente
**Dado** que el cliente ha completado el formulario de checkout con todos los campos requeridos  
**Y** ha seleccionado "MercadoPago" como método de pago  
**Cuando** el cliente hace clic en "Pagar con MercadoPago"  
**Entonces** el sistema crea una preferencia de pago en la API de MercadoPago, redirige al cliente al flujo de pago externo de MercadoPago, y al completar el pago exitosamente el cliente es redirigido a la página de confirmación del pedido mostrando el número de pedido y el estado "En proceso"

### Escenario 2: El sistema recibe el webhook de pago aprobado y actualiza el pedido
**Dado** que el cliente ha completado el pago para el pedido PAM-2026-0042 en MercadoPago  
**Cuando** MercadoPago envía el evento `payment` con `status: approved` al endpoint de webhook del backend  
**Y** la firma `x-signature` del header es válida  
**Entonces** el sistema actualiza el pedido PAM-2026-0042 al estado `RECEIVED` y el registro `Payment` asociado al estado `APPROVED`

### Escenario 3: El pago de MercadoPago es rechazado o cancelado por el cliente
**Dado** que el cliente intentó pagar con MercadoPago y el pago fue rechazado o el cliente lo canceló  
**Cuando** MercadoPago redirige al cliente de vuelta al portal con parámetro de estado fallido o cancelado  
**Entonces** el cliente ve la página con el mensaje "Tu pago no pudo procesarse. Puedes intentarlo nuevamente o elegir transferencia bancaria" y el pedido permanece en estado `PENDING_PAYMENT`

### Escenario 4: El endpoint de webhook recibe una solicitud con firma inválida
**Dado** que el endpoint `/webhooks/mercadopago` del backend recibe una solicitud  
**Cuando** el valor del header `x-signature` no coincide con la firma HMAC-SHA256 calculada con `MERCADOPAGO_WEBHOOK_SECRET`  
**Entonces** el endpoint retorna HTTP 401 y no modifica ningún pedido ni registro de pago

### Escenario 5: El mismo evento de webhook llega más de una vez (idempotencia)
**Dado** que el pedido PAM-2026-0042 ya tiene estado `RECEIVED` y el Payment está `APPROVED`  
**Cuando** MercadoPago reenvía el mismo evento `payment approved` para ese pedido  
**Entonces** el sistema retorna HTTP 200 al webhook pero no vuelve a modificar el pedido ni envía un segundo email de confirmación

---

## Edge Cases Identificados
- El webhook de MercadoPago puede llegar antes de que el cliente sea redirigido al portal; el pedido debe actualizarse igualmente aunque el cliente no haya vuelto al sitio aún
- MercadoPago puede tardar varios minutos en enviar el webhook; el cliente puede ver su pedido en estado `PENDING_PAYMENT` temporalmente hasta que el webhook llegue
- La preferencia de pago de MercadoPago expira; el cliente debe saber que el enlace de pago tiene una vigencia limitada (informar en la UI antes de redirigir)
- El `orderId` debe incluirse en los metadatos de la preferencia de MercadoPago para poder asociar el webhook al pedido correcto

---

## Fuera de Alcance
- Reembolsos o devoluciones desde el portal (se gestionan directamente en el panel de MercadoPago)
- Pagos en cuotas
- Checkout Pro embebido (en esta fase se usa redirección externa a la plataforma de MercadoPago)
- Otras pasarelas de pago (PayU, PayPal)
- Gestión de disputas o contracargos

---

## Definición de Done
- [ ] La opción "MercadoPago" aparece en el checkout como método de pago seleccionable
- [ ] Al seleccionarla y confirmar, el sistema crea una preferencia en MercadoPago y redirige al cliente al `init_point` retornado
- [ ] El endpoint del backend `/webhooks/mercadopago` valida la firma `x-signature` antes de procesar el evento
- [ ] Un webhook con `status: approved` y firma válida actualiza el pedido a `RECEIVED` y el Payment a `APPROVED`
- [ ] Un pago rechazado redirige al cliente con el mensaje exacto definido y el pedido permanece en `PENDING_PAYMENT`
- [ ] La idempotencia del webhook está implementada: no modifica un pedido ya en `RECEIVED`
- [ ] Las variables de entorno están documentadas en `.env.example`
- [ ] Test de integración cubre: webhook con firma válida → pedido actualizado; webhook con firma inválida → HTTP 401; webhook duplicado → HTTP 200 sin cambios

---

## Revisión DoR (Refinador)

- ✅ 5 escenarios cubriendo: pago exitoso, webhook aprobado, pago rechazado, firma inválida e idempotencia
- ✅ Número de pedido concreto en Escenarios 2 y 5 (PAM-2026-0042) para testeabilidad
- ✅ El enum `PaymentMethod.MERCADOPAGO` ya existe en Prisma — sin cambios de schema bloqueantes
- ✅ La idempotencia del webhook cubierta en Escenario 5 y en DoD
- ✅ Fuera de alcance delimita correctamente (sin reembolsos, sin cuotas, sin Checkout Pro embebido)
- ✅ Implementable en menos de 5 días

---

## Notas de Arquitectura

- **Dominio:** `payment` (extensión del dominio existente)
- **Entidades / VOs involucrados:** `Payment` (ya existe), `MercadoPagoPreference` (Value Object — `preferenceId: string`, `initPoint: string`), `MercadoPagoWebhookPayload` (Value Object — `paymentId`, `status`, `externalReference` = orderId)
- **Puerto de entrada:** `ICreateMercadoPagoPreferenceUseCase(orderId: string): Promise<{ initPoint: string }>`, `IProcessMercadoPagoWebhookUseCase(payload: MercadoPagoWebhookPayload, signature: string): Promise<void>`
- **Puerto de salida:** `IPaymentGatewayPort.createPreference(order: Order, backUrls: BackUrls): Promise<MercadoPagoPreference>`
- **Adaptador de salida:** `MercadoPagoAdapter` en `payment/infrastructure/adapters/` usando el SDK oficial `mercadopago` de npm
- **Capa Next.js:** Server Action (invocar el UseCase de creación de preferencia y retornar `initPoint` para redirigir) + Páginas de retorno (`/checkout/success`, `/checkout/failure`, `/checkout/pending`) como Server Components
- **Schema Prisma:** Sin cambios. El enum `PaymentMethod` ya incluye `MERCADOPAGO`; el modelo `Payment` ya existe. Considerar agregar campo `gatewayPaymentId String?` a `Payment` para guardar el ID de pago de MercadoPago (decisión de Fase 2).
- **Variables de entorno nuevas:** `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `MERCADOPAGO_SUCCESS_URL`, `MERCADOPAGO_FAILURE_URL`, `MERCADOPAGO_PENDING_URL`
- **Restricciones técnicas:**
  - El endpoint de webhook **debe ser un NestJS Controller** en el backend Render (`/webhooks/mercadopago`) — los Route Handlers de Vercel no son adecuados para este endpoint ya que el webhook debe apuntar a una URL estable con dominio propio (Render), no al frontend Vercel
  - La validación de la firma HMAC usa el header `x-signature` y `x-request-id` de MercadoPago; el body del request debe leerse como texto plano antes de parsear como JSON para que la verificación sea correcta
  - El `external_reference` de la preferencia MercadoPago debe ser el `orderNumber` (ej. PAM-2026-0042) para poder asociar el webhook al pedido sin ambigüedad
  - El código comentado con referencias a PSE/CARD en el codebase debe revisarse antes de implementar para reutilizar la estructura existente

**Estado: APROBADA**
