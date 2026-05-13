# Arquitectura HU-10 — Disponibilidad de productos

## Auditoría de código existente

| Artefacto | Ubicación | Estado |
|---|---|---|
| Modelo `Product` | `src/backend/prisma/schema.prisma` | Existe — agregar enum y dos campos |
| Enum `ProductStatus { ACTIVE, INACTIVE }` | Schema y entidad | Existe — ortogonal a `ProductAvailabilityStatus` |
| Entidad `Product` | `src/backend/src/catalog/domain/entities/product.entity.ts` | Existe — agregar `availability: ProductAvailability` |
| `ProductStatus` VO | `src/backend/src/catalog/domain/value-objects/product-status.vo.ts` | Existe — patrón a seguir para el nuevo VO |
| `AddItemToCartUseCase` | `src/backend/src/cart/domain/ports/in/add-item-to-cart.use-case.ts` | Existe — implementación a modificar |
| `AddItemToCartImpl` | `src/backend/src/cart/application/use-cases/add-item-to-cart.impl.ts` | Existe — modificar: verificar disponibilidad antes de agregar |
| `ProductRepository` (dominio catalog) | `src/backend/src/catalog/domain/ports/out/product.repository.ts` | Existe — NO importar directamente en cart |

---

## Cambios al schema Prisma

### Nuevo enum y campos en Product

```prisma
enum ProductAvailabilityStatus {
  AVAILABLE
  OUT_OF_STOCK
  COMING_SOON
}

model Product {
  // ... campos existentes sin modificar ...
  availabilityStatus ProductAvailabilityStatus @default(AVAILABLE)
  availableFrom      DateTime?  // solo relevante cuando status = COMING_SOON
}
```

**SQL de migración manual** (`migrations/YYYYMMDDHHMMSS_add_product_availability/migration.sql`):

```sql
CREATE TYPE "ProductAvailabilityStatus" AS ENUM ('AVAILABLE', 'OUT_OF_STOCK', 'COMING_SOON');

ALTER TABLE "products"
    ADD COLUMN "availabilityStatus" "ProductAvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE';

ALTER TABLE "products"
    ADD COLUMN "availableFrom" TIMESTAMP(3);
```

---

## Nuevas entidades / Value Objects

### Value Object ProductAvailability

```typescript
// src/backend/src/catalog/domain/value-objects/product-availability.vo.ts

export type ProductAvailabilityStatus = 'AVAILABLE' | 'OUT_OF_STOCK' | 'COMING_SOON';

export class ProductAvailability {
  private constructor(
    public readonly status: ProductAvailabilityStatus,
    public readonly availableFrom: Date | undefined,
  ) {}

  static of(status: ProductAvailabilityStatus, availableFrom?: Date): ProductAvailability {
    if (status === 'COMING_SOON' && !availableFrom) {
      throw new Error('availableFrom is required when status is COMING_SOON');
    }
    return new ProductAvailability(status, availableFrom);
  }

  static available(): ProductAvailability {
    return new ProductAvailability('AVAILABLE', undefined);
  }

  /**
   * Invariante de dominio: un producto es comprable si y solo si
   * está AVAILABLE, o es COMING_SOON y su fecha de disponibilidad ya pasó.
   */
  isAvailableAt(now: Date): boolean {
    switch (this.status) {
      case 'AVAILABLE':
        return true;
      case 'OUT_OF_STOCK':
        return false;
      case 'COMING_SOON':
        return this.availableFrom != null && now >= this.availableFrom;
    }
  }
}
```

### Cambio en la entidad Product

```typescript
// Agregar campo en constructor y class Product:
public readonly availability: ProductAvailability,

// isActive() ya existe; agregar:
isAvailableForPurchase(): boolean {
  return this.isActive() && this.availability.isAvailableAt(new Date());
}
```

---

## Ports nuevos o modificados

### Puerto de salida — nuevo en dominio cart

```typescript
// src/backend/src/cart/domain/ports/out/product-availability.port.ts

// Puerto estrecho: el dominio cart no importa nada del dominio catalog.
// Solo pregunta si el producto puede ser comprado ahora.
export interface ProductAvailabilityPort {
  isAvailableForPurchase(productId: string): Promise<boolean>;
}
```

### Cambio en AddItemToCartUseCase

El contrato de la interfaz no cambia. Solo cambia la implementación para inyectar `ProductAvailabilityPort`.

---

## Estructura de carpetas

Archivos nuevos:

```
src/backend/src/catalog/domain/value-objects/
  product-availability.vo.ts                           ← NUEVO

src/backend/src/cart/domain/ports/out/
  product-availability.port.ts                         ← NUEVO puerto estrecho

src/backend/src/cart/infrastructure/adapters/
  product-availability.prisma.adapter.ts               ← NUEVO implementa ProductAvailabilityPort

src/backend/prisma/
  migrations/YYYYMMDDHHMMSS_add_product_availability/
    migration.sql                                      ← NUEVO
```

Archivos existentes a modificar:

```
src/backend/src/catalog/domain/entities/product.entity.ts
  → agregar campo availability: ProductAvailability
  → agregar método isAvailableForPurchase()

src/backend/src/catalog/infrastructure/persistence/product.prisma.repository.ts
  → mapear availabilityStatus y availableFrom en toDomain()
  → incluir en create/update

src/backend/src/catalog/interfaces/http/dtos/create-product.dto.ts
  → agregar availabilityStatus opcional (default AVAILABLE)

src/backend/src/catalog/interfaces/http/dtos/update-product.dto.ts
  → agregar availabilityStatus y availableFrom opcionales

src/backend/src/cart/application/use-cases/add-item-to-cart.impl.ts
  → inyectar ProductAvailabilityPort
  → verificar disponibilidad antes de agregar item

src/backend/src/cart/cart.tokens.ts
  → agregar PRODUCT_AVAILABILITY_PORT token

src/backend/src/cart/cart.module.ts
  → registrar ProductAvailabilityPrismaAdapter

src/backend/prisma/schema.prisma
  → agregar enum ProductAvailabilityStatus y campos en Product
```

---

## Variables de entorno nuevas

Ninguna.

---

## Notas de implementación

### 1. Validación en AddItemToCartImpl

```typescript
// add-item-to-cart.impl.ts — agregar al inicio de execute():
const available = await this.productAvailabilityPort.isAvailableForPurchase(input.productId);
if (!available) {
  throw new BadRequestException('Este producto no está disponible para compra en este momento');
}
```

### 2. ProductAvailabilityPrismaAdapter

```typescript
// cart/infrastructure/adapters/product-availability.prisma.adapter.ts
// Consulta Prisma sin importar el dominio catalog
async isAvailableForPurchase(productId: string): Promise<boolean> {
  const product = await this.prisma.product.findUnique({
    where: { id: productId },
    select: { status: true, availabilityStatus: true, availableFrom: true },
  });
  if (!product || product.status !== 'ACTIVE') return false;
  if (product.availabilityStatus === 'OUT_OF_STOCK') return false;
  if (product.availabilityStatus === 'COMING_SOON') {
    return product.availableFrom != null && new Date() >= product.availableFrom;
  }
  return true; // AVAILABLE
}
```

La lógica duplica `ProductAvailability.isAvailableAt()` deliberadamente para evitar dependencia cross-domain. Es la misma regla de negocio, expresada en la capa de infraestructura sin importar el VO.

### 3. Relación entre ProductStatus y ProductAvailabilityStatus

Dos campos ortogonales:
- `ProductStatus` (`ACTIVE`/`INACTIVE`) controla si el producto es visible en el catálogo (gestión del admin).
- `ProductAvailabilityStatus` controla si el producto puede ser comprado (gestión de inventario/lanzamiento).

Un producto `ACTIVE` + `OUT_OF_STOCK` se muestra en el catálogo pero no puede agregarse al carrito. Un producto `INACTIVE` nunca se muestra ni se compra.

### 4. Frontend — indicadores de disponibilidad

En el catálogo y detalle de producto, mostrar:
- `AVAILABLE` → botón "Agregar al carrito" activo
- `OUT_OF_STOCK` → badge "Agotado", botón deshabilitado
- `COMING_SOON` + fecha futura → badge "Próximamente — disponible el {fecha}"
- `COMING_SOON` + fecha pasada → equivale a `AVAILABLE`, botón activo

### 5. Migración hacia atrás compatible

El campo `availabilityStatus` tiene `DEFAULT 'AVAILABLE'` en la migración. Todos los productos existentes quedan automáticamente como disponibles sin intervención del admin.

### 6. Panel admin — gestión de disponibilidad

Los DTOs `CreateProductDto` y `UpdateProductDto` reciben `availabilityStatus: 'AVAILABLE' | 'OUT_OF_STOCK' | 'COMING_SOON'` y `availableFrom?: string (ISO 8601)`. La validación de que `availableFrom` es requerida para `COMING_SOON` ocurre en el use case de catalog.
