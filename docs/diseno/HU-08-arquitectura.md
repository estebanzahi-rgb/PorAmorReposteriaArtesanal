# Arquitectura HU-08 — MercadoPago

## Auditoría de código existente

| Artefacto | Ubicación | Estado |
|---|---|---|
| Enum `MERCADOPAGO` en `PaymentMethod` | `src/backend/prisma/schema.prisma` | Existe — ya en el enum |
| Tipo `PaymentMethod` en entidad `Order` | `src/backend/src/order/domain/entities/order.entity.ts` | Existe — `'MERCADOPAGO'` ya incluido |
| `PaymentGatewayPort` (charge síncrono) | `src/backend/src/payment/domain/ports/out/payment-gateway.port.ts` | Existe — NO reusar: MP es flujo asíncrono (preference → webhook) |
| `MockPaymentGateway` | `src/backend/src/payment/infrastructure/adapters/mock-payment.adapter.ts` | Existe — continúa activo para BANK_TRANSFER/PSE/CARD |
| `PlaceOrderImpl` | usa `PaymentGatewayPort.charge()` | Existe — para MP, el `charge()` del mock retorna `success:true` inmediatamente (el pago real llega por webhook) |
| `UpdateOrderStatusImpl` | `src/backend/src/order/application/use-cases/update-order-status.impl.ts` | Existe — el webhook lo usa para transicionar la orden |
| `OrderRepository` | exportado desde `OrderModule` | Existe — importar en `MercadoPagoModule` |
| `EventEmitter2` | en `PlaceOrderImpl` | Patrón a seguir en el procesador de webhook |

---

## Cambios al schema Prisma

Ninguno. `MERCADOPAGO` ya está en el enum `PaymentMethod`. No se requiere nueva tabla para las preferencias (son efímeras).

---

## Nuevas entidades / Value Objects

### VO MercadoPagoPreference (resultado de la llamada a la API de MP)

No es una entidad persistida — es solo un DTO de transferencia interno:

```typescript
// src/backend/src/mercadopago/domain/value-objects/mp-preference.vo.ts
export class MpPreference {
  constructor(
    public readonly id: string,
    public readonly initPoint: string,          // URL producción
    public readonly sandboxInitPoint: string,   // URL sandbox
  ) {}
}
```

---

## Ports nuevos o modificados

### Puertos de entrada

```typescript
// src/backend/src/mercadopago/domain/ports/in/create-preference.use-case.ts
export interface CreatePreferenceCommand {
  orderId: string;
  userId: string;   // para verificar que el pedido pertenece al usuario
}

export interface CreatePreferenceResult {
  initPoint: string;
  preferenceId: string;
}

export interface CreatePreferenceUseCase {
  execute(command: CreatePreferenceCommand): Promise<CreatePreferenceResult>;
}
```

```typescript
// src/backend/src/mercadopago/domain/ports/in/process-webhook.use-case.ts
export interface MpWebhookPayload {
  action: string;        // 'payment.created' | 'payment.updated'
  data: { id: string };  // payment ID en MP
}

export interface ProcessWebhookUseCase {
  execute(payload: MpWebhookPayload, signature: string, requestId: string): Promise<void>;
}
```

### Puerto de salida — MP API Gateway

```typescript
// src/backend/src/mercadopago/domain/ports/out/mp-gateway.port.ts
export interface MpItem {
  title: string;
  quantity: number;
  unitPrice: number;  // en pesos COP
}

export interface CreatePreferenceParams {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  items: MpItem[];
  totalAmount: number;
}

export interface MpPaymentInfo {
  id: string;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled';
  externalReference: string;  // orderId
}

export interface MpGatewayPort {
  createPreference(params: CreatePreferenceParams): Promise<MpPreference>;
  getPayment(paymentId: string): Promise<MpPaymentInfo>;
}
```

---

## Estructura de carpetas

```
src/backend/src/mercadopago/
  domain/
    value-objects/
      mp-preference.vo.ts
    ports/
      in/
        create-preference.use-case.ts
        process-webhook.use-case.ts
      out/
        mp-gateway.port.ts
  application/
    use-cases/
      create-preference.impl.ts
      process-webhook.impl.ts
    dtos/
      create-preference.dto.ts            ← { orderId: string }
  infrastructure/
    adapters/
      mp-gateway.adapter.ts               ← implementa MpGatewayPort con SDK de MP
  interfaces/
    http/
      mercadopago.controller.ts           ← POST /payments/mercadopago/create-preference
                                          ← POST /payments/mercadopago/webhook
  mercadopago.module.ts
  mercadopago.tokens.ts
```

---

## Variables de entorno nuevas

Estas variables van en Render (backend):

| Variable | Descripción | Ejemplo |
|---|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | Access token de producción (o sandbox) de la app MP | `APP_USR-xxx-yyy` — desde MP Developers → Credenciales |
| `MERCADOPAGO_WEBHOOK_SECRET` | Clave secreta para validar firma HMAC de webhooks | Generado en MP → Webhooks → Clave secreta |
| `MERCADOPAGO_SUCCESS_URL` | URL a la que MP redirige tras pago exitoso | `https://poramor.vercel.app/checkout/success` |
| `MERCADOPAGO_FAILURE_URL` | URL a la que MP redirige tras pago fallido | `https://poramor.vercel.app/checkout/failure` |
| `MERCADOPAGO_PENDING_URL` | URL a la que MP redirige cuando el pago queda pendiente | `https://poramor.vercel.app/checkout/pending` |

---

## Notas de implementación

### 1. Flujo completo MercadoPago

```
1. Usuario elige MERCADOPAGO en checkout → Frontend llama POST /api/place-order
2. PlaceOrderImpl: MockPaymentGateway.charge() → success:true (el pago real llega después)
3. Order creada con status PENDING_PAYMENT, paymentMethod=MERCADOPAGO
4. Frontend llama POST /payments/mercadopago/create-preference { orderId }
5. CreatePreferenceImpl:
   a. Verifica que order.userId == userId autenticado
   b. Llama MpGatewayAdapter.createPreference(...)
   c. Retorna { initPoint, preferenceId }
6. Frontend redirige usuario a initPoint (URL de MercadoPago)
7. Usuario paga en MP → MP llama POST /payments/mercadopago/webhook
8. ProcessWebhookImpl:
   a. Valida firma HMAC con MERCADOPAGO_WEBHOOK_SECRET
   b. Llama MpGatewayAdapter.getPayment(paymentId)
   c. Si status=='approved': transiciona orden a RECEIVED (via OrderRepository + transitionTo())
   d. Emite OrderStatusChangedEvent (HU-02 lo maneja → email al cliente)
9. MP redirige usuario a SUCCESS_URL / FAILURE_URL / PENDING_URL
```

### 2. Instalación del SDK

```bash
# En src/backend/
npm install mercadopago
```

La versión SDK v2 (`@mercadopago/sdk-node` o el SDK oficial `mercadopago`) usa `new MercadoPagoConfig({ accessToken })`.

### 3. Validación de firma HMAC en webhook

MercadoPago envía headers `x-signature` y `x-request-id`. La firma se calcula sobre `ts=${timestamp};v1=${hash_del_body}`:

```typescript
// En ProcessWebhookImpl o en el controller (pre-validación):
function validateSignature(
  secret: string,
  xSignature: string,
  xRequestId: string,
  body: Record<string, unknown>,
): boolean {
  const [tsPart, v1Part] = xSignature.split(',');
  const ts   = tsPart.split('=')[1];
  const v1   = v1Part.split('=')[1];
  const manifest = `id:${body.data?.id};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');
  return expected === v1;
}
```

Si la firma no es válida, responder `400` inmediatamente.

### 4. Idempotencia del webhook

MP puede enviar el mismo webhook más de una vez. El `ProcessWebhookImpl` debe tolerar esto: si la orden ya está en `RECEIVED` (o posterior), `order.transitionTo('RECEIVED')` lanzará `BadRequestException` (transición inválida) — capturar y retornar `200 OK` para que MP no reintente.

### 5. Autenticación del endpoint create-preference

`POST /payments/mercadopago/create-preference` requiere JWT del usuario (`JwtAuthGuard`). El `orderId` del body debe pertenecer al `userId` del token.

`POST /payments/mercadopago/webhook` es **público** (sin auth) — validado solo por firma HMAC.

### 6. Activación en UI de checkout

El enum `MERCADOPAGO` ya existe en `PaymentMethod`. En el frontend, agregar la opción en el selector de métodos de pago del checkout y el flujo de redirección a `initPoint`.

### 7. Credenciales de sandbox para desarrollo

Durante desarrollo usar `APP_USR-xxx-yyy-TEST` (token de prueba). El `MERCADOPAGO_ACCESS_TOKEN` en el `.env` local apunta al sandbox. En producción (Render) se usa el token real.
