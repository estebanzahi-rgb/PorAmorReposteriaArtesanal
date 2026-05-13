# Arquitectura HU-05 — Antelación mínima

## Auditoría de código existente

| Artefacto | Ubicación | Estado |
|---|---|---|
| Dominio `store-config` | `src/backend/src/` | No existe — crear desde cero |
| Modelo `StoreSettings` en Prisma | `src/backend/prisma/schema.prisma` | No existe — agregar |
| Patrón singleton en DB | `DeliveryRate` (un único registro con `id` generado por cuid) | Referencia — `StoreSettings` usará `id="singleton"` explícito |
| `PlaceOrderCommand.scheduledAt` | HU-01 — nuevo campo | Depende de HU-01 |
| `ScheduledAtPicker` frontend | HU-01 — nuevo componente | Consume `GET /admin/store-settings` para `minDate` |

No existe ningún módulo de configuración de tienda actualmente.

---

## Cambios al schema Prisma

```prisma
model StoreSettings {
  id            String   @id @default("singleton")
  leadTimeHours Int      @default(24)
  updatedAt     DateTime @updatedAt
  updatedBy     String   // email del admin que hizo el último cambio

  @@map("store_settings")
}
```

**SQL de migración manual** (`migrations/YYYYMMDDHHMMSS_add_store_settings/migration.sql`):

```sql
CREATE TABLE "store_settings" (
    "id"            TEXT NOT NULL DEFAULT 'singleton',
    "leadTimeHours" INTEGER NOT NULL DEFAULT 24,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    "updatedBy"     TEXT NOT NULL,
    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- Insertar fila inicial para que GET siempre devuelva un valor
INSERT INTO "store_settings" ("id", "leadTimeHours", "updatedAt", "updatedBy")
VALUES ('singleton', 24, NOW(), 'system');
```

---

## Nuevas entidades / Value Objects

### Entidad StoreSettings

```typescript
// src/backend/src/store-config/domain/entities/store-settings.entity.ts
import { LeadTimeHours } from '../value-objects/lead-time-hours.vo';

export class StoreSettings {
  constructor(
    public readonly id: string,                   // siempre 'singleton'
    public readonly leadTime: LeadTimeHours,
    public readonly updatedAt: Date,
    public readonly updatedBy: string,
  ) {}

  static create(leadTimeHours: number, updatedBy: string): StoreSettings {
    return new StoreSettings(
      'singleton',
      LeadTimeHours.of(leadTimeHours),
      new Date(),
      updatedBy,
    );
  }

  withLeadTime(hours: number, updatedBy: string): StoreSettings {
    return new StoreSettings(
      this.id,
      LeadTimeHours.of(hours),
      new Date(),
      updatedBy,
    );
  }
}
```

### Value Object LeadTimeHours

```typescript
// src/backend/src/store-config/domain/value-objects/lead-time-hours.vo.ts
export class LeadTimeHours {
  private constructor(public readonly value: number) {}

  static of(hours: number): LeadTimeHours {
    if (!Number.isInteger(hours) || hours < 0) {
      throw new Error('LeadTimeHours must be a non-negative integer');
    }
    if (hours > 720) { // máximo 30 días
      throw new Error('LeadTimeHours cannot exceed 720 (30 days)');
    }
    return new LeadTimeHours(hours);
  }
}
```

---

## Ports nuevos o modificados

### Puertos de entrada

```typescript
// src/backend/src/store-config/domain/ports/in/get-store-settings.use-case.ts
import { StoreSettings } from '../../entities/store-settings.entity';

export interface GetStoreSettingsUseCase {
  execute(): Promise<StoreSettings>;
}
```

```typescript
// src/backend/src/store-config/domain/ports/in/update-store-settings.use-case.ts
import { StoreSettings } from '../../entities/store-settings.entity';

export interface UpdateStoreSettingsCommand {
  leadTimeHours: number;
  updatedBy: string;      // email del admin autenticado
}

export interface UpdateStoreSettingsUseCase {
  execute(command: UpdateStoreSettingsCommand): Promise<StoreSettings>;
}
```

### Puerto de salida

```typescript
// src/backend/src/store-config/domain/ports/out/store-settings.repository.ts
import { StoreSettings } from '../../entities/store-settings.entity';

export interface StoreSettingsRepository {
  find(): Promise<StoreSettings | null>;
  save(settings: StoreSettings): Promise<StoreSettings>;
}
```

---

## Estructura de carpetas

```
src/backend/src/store-config/
  domain/
    entities/
      store-settings.entity.ts
    value-objects/
      lead-time-hours.vo.ts
    ports/
      in/
        get-store-settings.use-case.ts
        update-store-settings.use-case.ts
      out/
        store-settings.repository.ts
  application/
    use-cases/
      get-store-settings.impl.ts
      update-store-settings.impl.ts
    dtos/
      update-store-settings.dto.ts          ← { leadTimeHours: number }
  infrastructure/
    persistence/
      store-settings.prisma.repository.ts
  interfaces/
    http/
      admin-store-settings.controller.ts    ← GET /admin/store-settings, PUT /admin/store-settings
  store-config.module.ts
  store-config.tokens.ts

src/backend/prisma/
  schema.prisma                             ← agregar modelo StoreSettings
  migrations/YYYYMMDDHHMMSS_add_store_settings/
    migration.sql
```

---

## Variables de entorno nuevas

Ninguna.

---

## Notas de implementación

### 1. Endpoints

```
GET  /admin/store-settings   → requiere rol ADMIN
PUT  /admin/store-settings   → requiere rol ADMIN, body: { leadTimeHours: number }
```

`GET /admin/store-settings` también es consumido por el **frontend del checkout** (usuario autenticado) para calcular la `minDate` del `ScheduledAtPicker`. Evaluar si abrir como `GET /store-settings` sin restricción de admin, o exponer un endpoint separado más liviano.

**Decisión de diseño:** Exponer `GET /store-settings` como endpoint público (sin auth) para que el checkout lo consuma sin necesitar token. El `PUT` sigue siendo solo ADMIN.

### 2. Patrón upsert en repositorio

```typescript
// store-settings.prisma.repository.ts
async save(settings: StoreSettings): Promise<StoreSettings> {
  const raw = await this.prisma.storeSettings.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      leadTimeHours: settings.leadTime.value,
      updatedBy: settings.updatedBy,
    },
    update: {
      leadTimeHours: settings.leadTime.value,
      updatedBy: settings.updatedBy,
    },
  });
  return this.toDomain(raw);
}
```

### 3. Manejo de fila inicial inexistente

`GetStoreSettingsImpl.execute()` hace `find()`. Si retorna `null` (primer deploy sin migration INSERT), devuelve un `StoreSettings` con valores por defecto `leadTimeHours=24` sin persistir. La migración incluye el INSERT inicial para evitar este caso.

### 4. Dependencia con HU-01

El `ScheduledAtPicker` de HU-01 llama `GET /store-settings` al montar el componente. Si la fila singleton no existe, recibe 404 o valor por defecto. La lógica de fallback en el frontend: `const leadTime = storeSettings?.leadTimeHours ?? 24`.

### 5. Registro en AppModule

```typescript
// src/backend/src/app.module.ts — agregar a imports:
StoreConfigModule
```
