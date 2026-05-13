# Arquitectura HU-09 — Reseñas

## Auditoría de código existente

| Artefacto | Ubicación | Estado |
|---|---|---|
| Modelo `User` | `src/backend/prisma/schema.prisma` | Existe — agregar relación `reviews` |
| Modelo `Product` | `src/backend/prisma/schema.prisma` | Existe — agregar relación `reviews` |
| Entidad `Product` | `src/backend/src/catalog/domain/entities/product.entity.ts` | Existe — sin campo de reseñas (no necesita cambio) |
| `OrderRepository.findAll()` con filtro | `src/backend/src/order/domain/ports/out/order.repository.ts` | Existe — la validación "usuario con pedido entregado" consulta la DB directamente |
| Dominio `review` | `src/backend/src/review/` | No existe — crear desde cero |
| Enum `DELIVERED` en `OrderStatus` | Schema y entidad `Order` | Existe — se usa para validar elegibilidad |

---

## Cambios al schema Prisma

### Nuevo modelo Review

```prisma
model Review {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  rating    Int      // 1-5, validado en dominio
  comment   String
  createdAt DateTime @default(now())

  @@unique([userId, productId])
  @@map("reviews")
}
```

### Relaciones a agregar en modelos existentes

```prisma
model Product {
  // ... campos existentes ...
  reviews  Review[]
}

model User {
  // ... campos existentes ...
  reviews  Review[]
}
```

**SQL de migración manual** (`migrations/YYYYMMDDHHMMSS_add_reviews/migration.sql`):

```sql
CREATE TABLE "reviews" (
    "id"        TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "rating"    INTEGER NOT NULL,
    "comment"   TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "reviews"
    ADD CONSTRAINT "reviews_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reviews"
    ADD CONSTRAINT "reviews_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "reviews_userId_productId_key" ON "reviews"("userId", "productId");
```

---

## Nuevas entidades / Value Objects

### Value Object Rating

```typescript
// src/backend/src/review/domain/value-objects/rating.vo.ts
export class Rating {
  private constructor(public readonly value: number) {}

  static of(value: number): Rating {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new Error('Rating must be an integer between 1 and 5');
    }
    return new Rating(value);
  }
}
```

### Entidad Review

```typescript
// src/backend/src/review/domain/entities/review.entity.ts
import { Rating } from '../value-objects/rating.vo';

export interface ReviewCreateParams {
  id: string;
  productId: string;
  userId: string;
  rating: Rating;
  comment: string;
}

export interface ReviewReconstituteParams extends ReviewCreateParams {
  createdAt: Date;
  userName?: string;    // desnormalizado para el listado público
}

export class Review {
  private constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly userId: string,
    public readonly rating: Rating,
    public readonly comment: string,
    public readonly createdAt: Date,
    public readonly userName?: string,
  ) {}

  static create(params: ReviewCreateParams): Review {
    return new Review(
      params.id,
      params.productId,
      params.userId,
      params.rating,
      params.comment,
      new Date(),
    );
  }

  static reconstitute(params: ReviewReconstituteParams): Review {
    return new Review(
      params.id,
      params.productId,
      params.userId,
      params.rating,
      params.comment,
      params.createdAt,
      params.userName,
    );
  }
}
```

---

## Ports nuevos o modificados

### Puertos de entrada

```typescript
// src/backend/src/review/domain/ports/in/create-review.use-case.ts
export interface CreateReviewCommand {
  productId: string;
  userId: string;
  rating: number;
  comment: string;
}

export interface CreateReviewUseCase {
  execute(command: CreateReviewCommand): Promise<Review>;
}
```

```typescript
// src/backend/src/review/domain/ports/in/get-product-reviews.use-case.ts
import { Review } from '../../entities/review.entity';

export interface GetProductReviewsUseCase {
  execute(productId: string): Promise<Review[]>;
}
```

### Puertos de salida

```typescript
// src/backend/src/review/domain/ports/out/review.repository.ts
import { Review } from '../../entities/review.entity';

export interface ReviewRepository {
  save(review: Review): Promise<Review>;
  findByProductId(productId: string): Promise<Review[]>;
  existsByUserAndProduct(userId: string, productId: string): Promise<boolean>;
}
```

```typescript
// src/backend/src/review/domain/ports/out/order-query.port.ts
// Puerto estrecho: el dominio review no importa nada del dominio order.
// Solo pregunta si el usuario tiene un pedido DELIVERED que incluye el producto.
export interface OrderQueryPort {
  hasDeliveredOrderForProduct(userId: string, productId: string): Promise<boolean>;
}
```

---

## Estructura de carpetas

```
src/backend/src/review/
  domain/
    entities/
      review.entity.ts
    value-objects/
      rating.vo.ts
    ports/
      in/
        create-review.use-case.ts
        get-product-reviews.use-case.ts
      out/
        review.repository.ts
        order-query.port.ts             ← puerto estrecho — sin dependencia de order domain
  application/
    use-cases/
      create-review.impl.ts
      get-product-reviews.impl.ts
    dtos/
      create-review.dto.ts              ← { productId, rating (1-5), comment }
  infrastructure/
    persistence/
      review.prisma.repository.ts
    adapters/
      order-query.prisma.adapter.ts     ← implementa OrderQueryPort con Prisma directo
  interfaces/
    http/
      review.controller.ts              ← POST /products/:productId/reviews
                                        ← GET  /products/:productId/reviews
  review.module.ts
  review.tokens.ts

src/backend/prisma/
  schema.prisma                         ← agregar modelo Review + relaciones en User y Product
  migrations/YYYYMMDDHHMMSS_add_reviews/
    migration.sql
```

---

## Variables de entorno nuevas

Ninguna.

---

## Notas de implementación

### 1. Validación de elegibilidad en CreateReviewImpl

```typescript
// create-review.impl.ts
async execute(command: CreateReviewCommand): Promise<Review> {
  // 1. Verificar que el usuario tiene un pedido DELIVERED con el producto
  const eligible = await this.orderQuery.hasDeliveredOrderForProduct(
    command.userId, command.productId
  );
  if (!eligible) {
    throw new ForbiddenException('Solo puedes reseñar productos que hayas recibido');
  }
  // 2. Verificar que no existe reseña previa (unique constraint como guard de dominio)
  const exists = await this.reviewRepo.existsByUserAndProduct(command.userId, command.productId);
  if (exists) {
    throw new ConflictException('Ya tienes una reseña para este producto');
  }
  // 3. Crear y persistir
  const review = Review.create({
    id: crypto.randomUUID(),
    productId: command.productId,
    userId: command.userId,
    rating: Rating.of(command.rating),
    comment: command.comment,
  });
  return this.reviewRepo.save(review);
}
```

### 2. OrderQueryPort — implementación con Prisma

```typescript
// order-query.prisma.adapter.ts
// Consulta directa sin importar el dominio order
async hasDeliveredOrderForProduct(userId: string, productId: string): Promise<boolean> {
  const count = await this.prisma.order.count({
    where: {
      userId,
      status: 'DELIVERED',
      items: { some: { productId } },
    },
  });
  return count > 0;
}
```

Este adaptador consulta las tablas `orders` y `order_items` via Prisma sin importar ningún tipo del módulo `order`. Así el dominio `review` es completamente agnóstico al dominio `order`.

### 3. Endpoints

```
GET  /products/:productId/reviews      → público, sin auth
POST /products/:productId/reviews      → requiere JWT (JwtAuthGuard)
     body: { rating: number, comment: string }
```

El `productId` viene del path param. El `userId` se extrae del JWT en el controller.

### 4. Promedio de calificación

El listado de productos (`GET /catalog/products`) puede incluir opcionalmente `averageRating` calculado en la query Prisma con `_avg`. Esto es un detalle de implementación que el desarrollador puede agregar en la segunda iteración.

### 5. Unicidad doble garantía

La restricción `@@unique([userId, productId])` en Prisma sirve como guarda de base de datos. El `existsByUserAndProduct()` en el use case sirve como guarda de dominio con mensaje de error claro. Ambas capas son necesarias.

### 6. Sin moderación en esta HU

Las reseñas se publican inmediatamente sin aprobación. Si en el futuro se requiere moderación, se agrega un campo `isApproved Boolean @default(false)` y un endpoint admin.
