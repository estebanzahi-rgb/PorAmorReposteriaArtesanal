# Arquitectura HU-01 — Fecha de entrega/recogida

## Auditoría de código existente

| Artefacto | Ubicación | Estado |
|---|---|---|
| Entidad `Order` | `src/backend/src/order/domain/entities/order.entity.ts` | Existe — sin campo `scheduledAt` |
| `OrderCreateParams` / `OrderReconstituteParams` | Mismo archivo | Existen — requieren campo nuevo |
| `PlaceOrderDto` | `src/backend/src/order/interfaces/http/dtos/place-order.dto.ts` | Existe — requiere campo nuevo |
| `OrderPrismaRepository.save()` | `src/backend/src/order/infrastructure/persistence/order.prisma.repository.ts` | Existe — requiere mapeo del campo nuevo |
| Schema Prisma `Order` | `src/backend/prisma/schema.prisma` | Existe — sin campo `scheduledAt` |

El frontend de checkout no fue auditado (fuera del backend), pero el DateTimePicker es nuevo.

---

## Cambios al schema Prisma

Agregar columna nullable a `orders`:

```prisma
model Order {
  // ... campos existentes sin modificar ...
  scheduledAt    DateTime?     // fecha y hora de entrega/recogida en UTC
  // ...
}
```

**SQL de migración manual** (`migrations/YYYYMMDDHHMMSS_add_scheduled_at_to_orders/migration.sql`):

```sql
ALTER TABLE "orders" ADD COLUMN "scheduledAt" TIMESTAMP(3);
```

---

## Nuevas entidades / Value Objects

No se requieren nuevas entidades ni VOs. La fecha es un tipo primitivo `Date` de dominio.

**Cambios en la entidad `Order`:**

```typescript
// Agregar a OrderCreateParams
export interface OrderCreateParams {
  // ... existente ...
  scheduledAt?: Date;
}

// Agregar a OrderReconstituteParams (hereda de OrderCreateParams, ya lo incluye)

// Agregar parámetro al constructor privado de Order:
// public readonly scheduledAt: Date | undefined,

// Propagar en Order.create() y Order.reconstitute()
```

---

## Ports nuevos o modificados

### Puerto de entrada — modificado

`PlaceOrderUseCase` recibe `PlaceOrderCommand`. Agregar campo opcional:

```typescript
// src/backend/src/order/domain/ports/in/place-order.use-case.ts
export interface PlaceOrderCommand {
  // ... existente ...
  scheduledAt?: Date;  // campo nuevo
}
```

---

## Estructura de carpetas

No se crean carpetas nuevas. Solo modificaciones de archivos existentes:

```
src/backend/src/order/
  domain/entities/order.entity.ts                         ← agregar scheduledAt
  domain/ports/in/place-order.use-case.ts                 ← agregar scheduledAt en Command
  interfaces/http/dtos/place-order.dto.ts                 ← agregar @IsISO8601() scheduledAt
  infrastructure/persistence/order.prisma.repository.ts   ← mapear scheduledAt en save() y toDomain()

src/backend/prisma/
  schema.prisma                                            ← agregar campo
  migrations/YYYYMMDDHHMMSS_add_scheduled_at_to_orders/
    migration.sql                                          ← ALTER TABLE

src/frontend/
  components/checkout/
    ScheduledAtPicker.tsx                                  ← nuevo Client Component
  app/(shop)/checkout/
    page.tsx                                               ← integrar ScheduledAtPicker
```

---

## Variables de entorno nuevas

Ninguna en backend. El frontend necesita zona horaria hardcoded (`America/Bogota`, UTC-5); no requiere variable de entorno.

**Dependencia de paquete frontend:**
```
date-fns-tz  (cálculo de minDate con zona horaria Colombia)
```

---

## Notas de implementación

1. **Almacenamiento en UTC:** `scheduledAt` se persiste en UTC. La conversión a hora Colombia (`America/Bogota`, UTC-5) ocurre solo en la capa de presentación (frontend y templates de email).

2. **Campo opcional:** `scheduledAt` es nullable tanto en Prisma como en la entidad. Pedidos sin fecha de entrega programada son válidos (flujo actual sin cambio).

3. **Validación en frontend:** El `ScheduledAtPicker` calcula `minDate = now + leadTimeHours` (HU-05 provee `leadTimeHours` vía endpoint `GET /admin/store-settings`). Si HU-05 no está implementada aún, usar `minDate = now + 24h` como fallback hardcoded.

4. **Sin validación en backend:** El backend acepta cualquier fecha futura válida. La responsabilidad de la restricción de antelación mínima reside en el frontend y en la entidad `StoreSettings` de HU-05. El backend no rechaza fechas pasadas (el admin puede crear pedidos manuales con fecha arbitraria).

5. **Mapeo en repositorio:** En `OrderPrismaRepository.save()`:
   ```typescript
   // en data:
   scheduledAt: order.scheduledAt ?? null,
   
   // en toDomain():
   scheduledAt: raw.scheduledAt ?? undefined,
   ```

6. **DTO de respuesta:** Los endpoints `GET /orders/:id` y `GET /admin/orders` ya retornan el objeto Order serializado. El campo `scheduledAt` se incluirá automáticamente al estar en la entidad.

7. **Dependencia con HU-05:** El DateTimePicker consume `GET /admin/store-settings` para obtener `leadTimeHours`. HU-01 debe desplegarse antes o simultáneamente con HU-05.
