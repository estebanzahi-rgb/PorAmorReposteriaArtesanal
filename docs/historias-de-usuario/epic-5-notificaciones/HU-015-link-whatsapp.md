# HU-015: Generar link WhatsApp con resumen del pedido

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-015 |
| **Epic** | EPIC 5 — Notificaciones |
| **Estado** | APROBADA |
| **Prioridad** | Media |
| **Dependencias** | HU-013 |
| **Bloquea** | Ninguna |

## Descripción

Yo como **sistema** quiero **generar un link de WhatsApp con el resumen del pedido precargado** para **que la dueña pueda abrir una conversación de WhatsApp con los detalles del pedido con un solo clic desde la pantalla de confirmación**.

## Notas de Arquitectura

- **Dominio:** Notification
- **Entidades / VOs involucrados:** `Order`, `WhatsAppLink`
- **Puerto de entrada:** `GenerateWhatsAppLinkUseCase(order: Order): string`
- **Puerto de salida:** Ninguno (generación de URL, no requiere llamada externa)
- **Capa Next.js:** Server-side en la página de confirmación; el link se renderiza como botón
- **Restricciones técnicas:** El link usa el formato `https://wa.me/[OWNER_PHONE]?text=[encoded_message]`. El número de teléfono de la dueña se configura como variable de entorno `OWNER_WHATSAPP`. El mensaje se URL-encode para caracteres especiales. Longitud máxima del mensaje de WhatsApp: ~4096 caracteres; si el pedido es muy largo, se trunca con nota "Ver detalles completos en el email".

## Criterios de Aceptación

### Escenario 1: Link generado correctamente en la confirmación del pedido

```gherkin
Dado que el pedido fue confirmado exitosamente
Cuando la pantalla de confirmación carga
Entonces veo un botón "Notificar por WhatsApp"
Y al hacer clic el botón abre WhatsApp (web o app) con un mensaje precargado dirigido al número de la dueña
```

### Escenario 2: Contenido del mensaje precargado

```gherkin
Dado que el link de WhatsApp fue generado para el pedido PAM-2026-0001
Cuando la dueña abre el link
Entonces el mensaje precargado contiene:
  | 🎂 Nuevo pedido: PAM-2026-0001          |
  | Cliente: [nombre] - [teléfono]          |
  | Productos: [lista resumida]             |
  | Total: $[monto] - Pago: [método]       |
  | Entrega: [Recogida / Domicilio: dirección] |
```

### Escenario 3: Pedido con mensaje largo truncado

```gherkin
Dado que el pedido tiene muchos ítems y el mensaje supera 4096 caracteres
Cuando se genera el link
Entonces el mensaje se trunca y termina con: "...Ver detalles completos en el email enviado."
Y el link sigue siendo funcional
```

## Edge Cases

- `OWNER_WHATSAPP` no configurado → ocultar el botón de WhatsApp y registrar advertencia en logs al iniciar la app
- Caracteres especiales en nombres de productos o mensajes de tortas → URL-encode correcto

## Fuera de alcance

- Envío automático del mensaje sin intervención de la dueña (requeriría WhatsApp Business API)
- Seguimiento de si la dueña abrió el link

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Contenido del mensaje explicitado. Escenario de truncado documentado |
| 2026-05-08 | Arquitecto | Formato wa.me documentado. OWNER_WHATSAPP como variable de entorno. Límite de 4096 chars con truncado |
