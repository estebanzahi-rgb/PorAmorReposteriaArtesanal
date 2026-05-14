# ADR-002: Inicialización lazy para gateways de servicios externos opcionales

## Estado
Adoptado — 2026-05-13

## Contexto

El adaptador de MercadoPago (`MpGatewayAdapter`) inyecta `ConfigService` en el constructor y llama `configService.getOrThrow('MERCADOPAGO_ACCESS_TOKEN')`. En entornos de staging donde el token no está configurado, NestJS lanza una excepción al arrancar la aplicación — impidiendo que el servidor levante aunque MercadoPago no sea necesario para las operaciones del día.

El mismo problema puede ocurrir con cualquier servicio externo opcional: pasarelas de pago alternativas, servicios SMS, integraciones de CRM, etc.

## Decisión

Los adaptadores de servicios externos **opcionales** deben usar inicialización lazy:

1. El constructor **no lanza** si la variable de entorno falta — solo asigna `null`.
2. Un método privado `getClient()` lanza solo cuando se intenta usar el servicio.
3. El gateway queda inoperativo pero el servidor arranca y sirve las demás rutas.

```typescript
@Injectable()
export class MpGatewayAdapter implements PaymentGatewayPort {
  private client: MercadoPagoConfig | null = null;

  constructor(private readonly config: ConfigService) {
    const token = config.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    if (token) {
      this.client = new MercadoPagoConfig({ accessToken: token });
    }
  }

  private getClient(): MercadoPagoConfig {
    if (!this.client) {
      throw new Error('MercadoPago not configured: MERCADOPAGO_ACCESS_TOKEN is missing');
    }
    return this.client;
  }

  async createPreference(orderId: string): Promise<string> {
    const client = this.getClient(); // lanza solo aquí
    // ...
  }
}
```

## Regla de clasificación

| Tipo de servicio | Inicialización |
|---|---|
| Base de datos principal | Eager — si falla, el servidor no debe arrancar |
| Email (Resend) | Lazy — opcional; si no está configurado, se logea WARN y retorna |
| Pasarela de pago | Lazy — puede estar deshabilitada en staging |
| Analytics | Lazy — nunca debe bloquear el arranque |
| Storage (Cloudinary) | Lazy — puede operar sin imágenes en dev |

## Consecuencias

**Positivas:**
- El servidor arranca en cualquier entorno aunque falten credenciales opcionales.
- El error es claro y visible en los logs cuando se intenta usar el servicio sin configurar.
- Facilita el desarrollo local sin necesidad de credenciales de todos los servicios.

**Negativas:**
- Un servicio mal configurado no falla hasta que se intenta usar en runtime, no en startup. Para servicios críticos esto es inaceptable — por eso la regla de clasificación es importante.

## Aplicación en nuevas tiendas

Al agregar una nueva integración de pago o servicio externo:
1. Clasificar como obligatorio u opcional.
2. Si es opcional, usar el patrón lazy con `getClient()`.
3. Documentar la variable de entorno en `docs/arquitectura/STACK-Y-VARIABLES-ENTORNO.md`.
