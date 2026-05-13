# HU-09 — Reseñas de productos por clientes

**Como** cliente autenticado que ha recibido un pedido que contiene un producto  
**Quiero** dejar una calificación de 1 a 5 estrellas y un comentario sobre ese producto  
**Para** ayudar a otros clientes a tomar mejores decisiones de compra y dar retroalimentación a la repostería

---

## Criterios de Aceptación

### Escenario 1: El cliente deja una reseña válida de un producto recibido
**Dado** que el cliente "juan@email.com" tiene un pedido en estado `DELIVERED` que contiene el producto "Torta Red Velvet"  
**Y** que ese cliente NO ha dejado previamente una reseña para "Torta Red Velvet"  
**Cuando** el cliente navega a la página de detalle de "Torta Red Velvet", selecciona 4 estrellas, escribe el comentario "Deliciosa, muy esponjosa" y hace clic en "Publicar reseña"  
**Entonces** la reseña se guarda, aparece inmediatamente en la sección de reseñas de la página del producto con el nombre del cliente, la calificación de 4 estrellas, el comentario y la fecha, y el promedio de calificación del producto se actualiza a reflejar la nueva reseña

### Escenario 2: El cliente intenta dejar una reseña sin haber comprado ni recibido el producto
**Dado** que el cliente "pedro@email.com" no tiene ningún pedido en estado `DELIVERED` que contenga el producto "Torta Red Velvet"  
**Cuando** el cliente navega a la página de detalle de "Torta Red Velvet"  
**Entonces** el formulario de nueva reseña no se muestra; en su lugar aparece el mensaje "Solo puedes reseñar productos que hayas recibido en un pedido"

### Escenario 3: El cliente intenta publicar una segunda reseña para el mismo producto
**Dado** que el cliente "juan@email.com" ya tiene una reseña publicada de 4 estrellas para "Torta Red Velvet"  
**Cuando** el cliente vuelve a la página de detalle de "Torta Red Velvet"  
**Entonces** no aparece el formulario de nueva reseña; se muestra la reseña existente del cliente con un botón "Editar mi reseña"

### Escenario 4: Un visitante no autenticado puede ver las reseñas de un producto
**Dado** que el producto "Torta Red Velvet" tiene 3 reseñas publicadas  
**Cuando** un visitante no autenticado accede a la página de detalle del producto  
**Entonces** las 3 reseñas se muestran públicamente con nombre del cliente, calificación en estrellas, comentario y fecha, pero no aparece el formulario para agregar una reseña

### Escenario 5: El cliente edita su reseña existente
**Dado** que el cliente "juan@email.com" tiene una reseña de 4 estrellas publicada para "Torta Red Velvet"  
**Cuando** el cliente hace clic en "Editar mi reseña", cambia la calificación a 5 estrellas, actualiza el texto a "Mejor torta que he probado" y hace clic en "Actualizar reseña"  
**Entonces** la reseña se actualiza con los nuevos valores, se muestra inmediatamente en la sección de reseñas y el promedio del producto se recalcula

### Escenario 6: El cliente publica una reseña solo con calificación (sin comentario de texto)
**Dado** que el cliente "ana@email.com" tiene un pedido `DELIVERED` con "Torta Red Velvet"  
**Cuando** el cliente selecciona 5 estrellas sin escribir ningún comentario y hace clic en "Publicar reseña"  
**Entonces** la reseña se guarda con la calificación de 5 estrellas y sin texto de comentario, y aparece en la sección de reseñas mostrando solo las estrellas

---

## Edge Cases Identificados
- Un cliente puede tener el mismo producto en múltiples pedidos entregados; aun así solo puede tener una reseña por producto
- El promedio de calificación se muestra con 1 decimal (ej. "4.3") y se recalcula en tiempo real al agregar/editar una reseña
- Si el producto no tiene ninguna reseña, la sección de reseñas muestra el mensaje "Aún no hay reseñas para este producto. ¡Sé el primero en opinar!"
- La calificación mínima es 1 estrella (no se puede enviar 0 estrellas)

---

## Fuera de Alcance
- Moderación de reseñas por parte del admin (todas se publican inmediatamente)
- Respuestas de la dueña a las reseñas
- Calificación de "útil / no útil" en reseñas de otros clientes
- Ordenamiento o filtrado de reseñas por calificación o fecha
- Paginación de reseñas (fuera de alcance en esta fase)

---

## Definición de Done
- [ ] El modelo `Review` existe en la base de datos con los campos: `id`, `userId`, `productId`, `orderId`, `rating` (1–5), `comment` (opcional), `createdAt`, `updatedAt`
- [ ] Constraint único `@@unique([userId, productId])` en la tabla `reviews`
- [ ] Solo clientes con al menos un pedido en estado `DELIVERED` que incluya el producto pueden crear reseñas
- [ ] Un cliente solo puede tener una reseña por producto; el backend rechaza intentos duplicados
- [ ] Las reseñas se muestran en la página de detalle del producto para todos los visitantes (autenticados o no)
- [ ] El promedio de calificación y el número total de reseñas se muestran en la página del producto
- [ ] Los clientes con compra verificada pueden editar su propia reseña
- [ ] El comentario es opcional; la calificación (1–5) es obligatoria
- [ ] Test de integración verifica que el UseCase rechaza la creación de reseña cuando no hay pedido `DELIVERED` con ese producto
- [ ] Test E2E cubre el happy path de publicar una reseña (seleccionar estrellas, escribir comentario, publicar, verificar que aparece en la página)

---

## Revisión DoR (Refinador)

- ✅ 6 escenarios cubriendo: happy path, sin compra verificada, duplicado, visitante anónimo, edición y reseña sin comentario
- ✅ Datos concretos en todos los escenarios: emails, nombre del producto, valores de calificación, texto exacto
- ✅ Mensajes de UI exactos definidos en Escenarios 2 y 4
- ✅ Constraint de unicidad (1 reseña por cliente por producto) documentado en DoD y en Edge Cases
- ✅ Fuera de alcance bien delimitado (sin moderación, sin respuestas, sin paginación)
- ✅ La dependencia de pedidos `DELIVERED` ya es funcionalidad existente en el sistema

---

## Notas de Arquitectura

- **Dominio:** `review` (nuevo dominio)
- **Entidades / VOs involucrados:** `Review` (Aggregate — `id`, `userId`, `productId`, `orderId`, `rating: Rating`, `comment?: string`, `createdAt`, `updatedAt`), `Rating` (Value Object — entero 1–5 con invariante: `if (value < 1 || value > 5) throw new InvalidRatingError()`)
- **Puerto de entrada:**
  - `ICreateReviewUseCase(userId: string, productId: string, rating: number, comment?: string): Promise<Review>`
  - `IUpdateReviewUseCase(reviewId: string, userId: string, rating: number, comment?: string): Promise<Review>`
  - `IGetProductReviewsUseCase(productId: string): Promise<ReviewSummary>` (retorna lista + promedio + total)
- **Puerto de salida:**
  - `IReviewRepository.save(review: Review): Promise<void>`
  - `IReviewRepository.findByUserAndProduct(userId: string, productId: string): Promise<Review | null>`
  - `IReviewRepository.findByProduct(productId: string): Promise<Review[]>`
  - `IOrderRepository.hasUserReceivedProduct(userId: string, productId: string): Promise<boolean>` (nueva query en el repositorio de Order existente)
- **Capa Next.js:** Server Component (lista de reseñas, promedio y conteo — renderizado en el servidor) + Client Component (formulario de nueva/editar reseña con selector de estrellas) + Server Action (crear/actualizar reseña)
- **Schema Prisma:** Nuevo modelo + relaciones en `User` y `Product`:
  ```prisma
  model Review {
    id        String   @id @default(cuid())
    userId    String
    user      User     @relation(fields: [userId], references: [id])
    productId String
    product   Product  @relation(fields: [productId], references: [id])
    orderId   String   // pedido que habilita la reseña (auditoría)
    rating    Int      // 1-5; invariante validada en el Value Object Rating
    comment   String?  // opcional
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@unique([userId, productId])
    @@map("reviews")
  }
  ```
  Agregar en `User`: `reviews Review[]`  
  Agregar en `Product`: `reviews Review[]`
- **Variables de entorno nuevas:** Ninguna
- **Restricciones técnicas:**
  - La query `hasUserReceivedProduct` debe cruzar `Order` (status = `DELIVERED`) con `OrderItem` (productId); agregar índice compuesto `(userId, status)` en la tabla `orders` para eficiencia
  - El constraint `@@unique([userId, productId])` en la BD es la última línea de defensa; el UseCase debe verificar primero por mensaje de error amigable antes de que la BD lance un error de unicidad
  - El cálculo del promedio puede hacerse con `_avg: { rating: true }` de Prisma en el mismo query de `findByProduct`; no se desnormaliza en `Product` en esta fase (si el rendimiento lo requiere, se puede hacer en Fase 2)

**Estado: APROBADA**
