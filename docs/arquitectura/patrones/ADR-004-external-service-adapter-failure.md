# ADR-004: Manejo de fallos en adaptadores de servicios externos

## Estado
Adoptado — 2026-05-13

## Contexto

Los adaptadores de servicios externos (email, SMS, analytics) pueden fallar por distintas razones: API key ausente, red no disponible, límite de rate excedido, respuesta inesperada del proveedor. Sin un manejo explícito, estos fallos:
1. Silenciosamente no hacen nada (peor caso — sin visibilidad)
2. O lanzan excepciones que bloquean el flujo principal del negocio (también incorrecto — enviar un email no debe impedir confirmar un pedido)

## Decisión

Los adaptadores de servicios externos de notificación siguen este contrato:

### 1. API key ausente → WARN y retorno silencioso

```typescript
async send(notification: EmailNotification): Promise<void> {
  if (!this.apiKey) {
    this.logger.warn(
      `[EMAIL SKIPPED — RESEND_API_KEY not set] To: ${notification.to} | Subject: ${notification.subject}`,
    );
    return; // no lanzar excepción
  }
  // ...
}
```

### 2. Error de red/API → ERROR log, nunca relanzar al caller

```typescript
if (!res.ok) {
  const body = await res.json().catch(() => ({}));
  this.logger.error(
    `[EMAIL FAILED] To: ${notification.to} | Subject: ${notification.subject} | Error: ${JSON.stringify(body)}`,
  );
  // No throw — el flujo de negocio continúa
} else {
  this.logger.log(`[EMAIL SENT] To: ${notification.to} | Subject: ${notification.subject}`);
}
```

### 3. El caso de uso que llama al adaptador no depende del resultado

```typescript
// En el handler del evento:
async handle(event: OrderPlacedEvent): Promise<void> {
  await this.emailPort.send(notification).catch((err) =>
    this.logger.error(`Notification failed: ${err.message}`)
  );
  // El catch aquí es el último recurso; el adaptador ya no debe lanzar
}
```

## Niveles de log por escenario

| Escenario | Nivel | Formato |
|---|---|---|
| API key no configurada | `WARN` | `[EMAIL SKIPPED — VAR_NAME not set]` |
| Envío exitoso | `LOG` | `[EMAIL SENT]` |
| Error de API | `ERROR` | `[EMAIL FAILED] ... Resend error: {...}` |
| Error de red (timeout, etc.) | `ERROR` | `[EMAIL FAILED] Network error: ...` |

## Variables de entorno requeridas por servicio

| Servicio | Variable(s) |
|---|---|
| Email (Resend) | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `OWNER_EMAIL` |
| WhatsApp (link) | `OWNER_WHATSAPP` |
| MercadoPago | `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_SUCCESS_URL`, `MERCADOPAGO_FAILURE_URL`, `MERCADOPAGO_PENDING_URL` |

## Consecuencias

**Positivas:**
- Un email que falla nunca impide que el pedido se confirme.
- Los errores son visibles en logs de producción con suficiente contexto para diagnosticar.
- En desarrollo local sin credenciales, el servidor funciona completamente con solo warnings.

**Negativas:**
- Si el email falla silenciosamente en producción y nadie monitorea logs, el dueño de la tienda no se entera de los pedidos. Mitigación: configurar alertas en el proveedor de logs para el patrón `[EMAIL FAILED]`.

## Aplicación en nuevas tiendas

Al implementar cualquier adaptador de servicio externo de notificación:
1. Chequear la API key en el constructor (guardar como propiedad)
2. Retornar silenciosamente con WARN si falta
3. Log ERROR en fallo de red/API, sin relanzar
4. Log LOG en éxito
