# HU-014: Enviar email a la dueña al recibir un pedido

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-014 |
| **Epic** | EPIC 5 — Notificaciones |
| **Estado** | APROBADA |
| **Prioridad** | Alta |
| **Dependencias** | HU-013 |
| **Bloquea** | Ninguna |

## Descripción

Yo como **sistema** quiero **enviar un email automático a la dueña cuando se confirma un pedido** para **que tenga todos los detalles del pedido en su correo y pueda comenzar a prepararlo**.

## Notas de Arquitectura

- **Dominio:** Notification
- **Entidades / VOs involucrados:** `OrderPlacedEvent`, `EmailNotification`
- **Puerto de entrada:** `NotifyOwnerByEmailUseCase(order: Order)`
- **Puerto de salida:** `EmailPort` (interfaz — implementada con Resend en infraestructura)
- **Capa Next.js:** N/A — ejecutado en el backend NestJS como handler del `OrderPlacedEvent`
- **Restricciones técnicas:** El email de destino se configura como variable de entorno `OWNER_EMAIL`. El envío es asíncrono y no bloquea la confirmación al cliente. Si el envío falla, se registra en logs pero el pedido ya está confirmado (no se revierte).

## Criterios de Aceptación

### Escenario 1: Email enviado con éxito al confirmar pedido

```gherkin
Dado que un pedido fue confirmado con pago aprobado
Cuando el sistema procesa el evento de pedido confirmado
Entonces la dueña recibe un email con asunto: "Nuevo pedido PAM-[AÑO]-XXXX - PorAmor Repostería"
Y el email contiene:
  | Número de pedido              |
  | Nombre y teléfono del cliente |
  | Lista de productos y cantidades |
  | Descripción de configuraciones de torta si aplica |
  | Subtotal, costo de envío y total |
  | Método de pago seleccionado   |
  | Tipo de entrega (recogida o domicilio) |
  | Dirección de domicilio si aplica |
  | Fecha y hora del pedido       |
```

### Escenario 2: Fallo en el envío del email

```gherkin
Dado que el servicio de email no está disponible al momento del pedido
Cuando el sistema intenta enviar el email de notificación
Entonces el pedido permanece en estado "Recibido" sin cambios
Y el error se registra en los logs del sistema con el ID del pedido
Y el cliente no ve ningún error relacionado con el email
```

## Edge Cases

- Pedido con múltiples configuraciones de torta → el email lista cada configuración con todos sus detalles (tamaño, sabor, relleno, cubierta, mensaje, dibujo, topper)
- Email de la dueña mal configurado en variables de entorno → registrar error en logs al iniciar la aplicación

## Fuera de alcance

- Email de confirmación al cliente (puede ser una HU futura)
- Reintentos automáticos de envío de email
- Plantillas de email editables por el admin

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Contenido del email explicitado como tabla. Escenario de fallo documentado |
| 2026-05-08 | Arquitecto | EmailPort como interfaz documentado. Envío asíncrono no bloqueante. OWNER_EMAIL como variable de entorno |
