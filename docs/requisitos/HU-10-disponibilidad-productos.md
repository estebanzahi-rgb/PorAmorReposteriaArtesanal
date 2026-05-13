# HU-10 — Control de disponibilidad de productos

**Como** administradora del negocio  
**Quiero** poder marcar un producto como "agotado temporalmente" o configurar una fecha futura de disponibilidad  
**Para** informar a los clientes con precisión sobre cuándo podrán hacer un pedido y evitar pedidos que no puedo cumplir

---

## Criterios de Aceptación

### Escenario 1: La administradora marca un producto como agotado temporalmente
**Dado** que la administradora está en el formulario de edición del producto "Torta de Tres Leches" en el panel admin  
**Cuando** cambia la disponibilidad a "Agotado temporalmente" y hace clic en "Guardar"  
**Entonces** el producto se muestra en el catálogo con la etiqueta visible "Agotado" y el botón "Agregar al carrito" aparece deshabilitado para ese producto

### Escenario 2: La administradora configura una fecha de disponibilidad futura
**Dado** que la administradora está en el formulario de edición del producto "Torta de Navidad" en el panel admin  
**Cuando** cambia la disponibilidad a "Disponible desde" y selecciona la fecha 2026-12-01, y hace clic en "Guardar"  
**Entonces** el producto se muestra en el catálogo con la etiqueta "Disponible desde el 1 dic 2026" y el botón "Agregar al carrito" aparece deshabilitado

### Escenario 3: La fecha de disponibilidad futura ya transcurrió
**Dado** que el producto "Torta de Navidad" tiene `availabilityStatus = COMING_SOON` y `availableFrom = 2026-12-01`  
**Y** que la fecha y hora actual es 2027-01-05 10:00 hora Colombia  
**Cuando** un cliente accede al catálogo  
**Entonces** el producto se muestra sin etiqueta especial de disponibilidad y el botón "Agregar al carrito" está habilitado

### Escenario 4: La administradora reactiva un producto agotado
**Dado** que el producto "Torta de Tres Leches" tiene `availabilityStatus = OUT_OF_STOCK`  
**Cuando** la administradora cambia la disponibilidad a "Disponible" y hace clic en "Guardar"  
**Entonces** la etiqueta "Agotado" desaparece del catálogo y el botón "Agregar al carrito" vuelve a estar habilitado para ese producto

### Escenario 5: El cliente intenta agregar al carrito un producto agotado (intento de bypass)
**Dado** que el producto "Torta de Tres Leches" tiene `availabilityStatus = OUT_OF_STOCK`  
**Cuando** el cliente intenta agregar ese producto al carrito mediante la UI o enviando la petición directamente al endpoint  
**Entonces** el backend retorna HTTP 409 con el mensaje "El producto no está disponible actualmente" y el producto no se agrega al carrito

---

## Edge Cases Identificados
- Un producto puede estar `status = INACTIVE` (oculto del catálogo) Y tener `availabilityStatus = OUT_OF_STOCK`; la disponibilidad solo es relevante para productos con `status = ACTIVE`
- Si `availableFrom` corresponde al día de hoy, el producto se considera disponible desde el inicio del día en hora Colombia (00:00:00 UTC-5)
- La transición de `COMING_SOON → AVAILABLE` se evalúa en tiempo de lectura (no requiere cron job): si `availabilityStatus = COMING_SOON` y `availableFrom <= now()`, el sistema lo trata como `AVAILABLE`
- La administradora no puede seleccionar una fecha pasada en el campo "Disponible desde" del formulario admin

---

## Fuera de Alcance
- Notificación automática al cliente cuando un producto vuelve a estar disponible
- Gestión de inventario numérico por unidades (control de stock)
- Disponibilidad diferenciada por variante de producto
- Disponibilidad configurable por franja horaria del día

---

## Definición de Done
- [ ] El formulario de edición de producto en el admin tiene un selector de disponibilidad con tres opciones: "Disponible", "Agotado temporalmente", "Disponible desde [fecha]"
- [ ] Los cambios de disponibilidad se persisten en los nuevos campos `availabilityStatus` y `availableFrom` del modelo `Product`
- [ ] El catálogo muestra la etiqueta correcta ("Agotado" o "Disponible desde el D MMM YYYY") según el estado de cada producto
- [ ] El botón "Agregar al carrito" está deshabilitado visualmente para productos `OUT_OF_STOCK` o `COMING_SOON` con fecha futura
- [ ] El backend rechaza con HTTP 409 y mensaje exacto el intento de agregar al carrito un producto no disponible
- [ ] La transición automática `COMING_SOON → AVAILABLE` ocurre correctamente por evaluación en tiempo de lectura cuando `availableFrom <= now()`
- [ ] Test E2E verifica que un producto marcado como agotado no puede agregarse al carrito desde la UI
- [ ] Test de integración verifica que el endpoint de agregar al carrito retorna HTTP 409 para un producto `OUT_OF_STOCK`

---

## Revisión DoR (Refinador)

- ✅ 5 escenarios cubriendo: marcar agotado, disponibilidad futura, transición automática por fecha, reactivar y bypass de seguridad
- ✅ Fechas concretas en Escenarios 2 y 3 (2026-12-01, 2027-01-05) para testeabilidad
- ✅ HTTP 409 y mensaje exacto especificados para el Escenario 5 (bypass)
- ✅ La transición automática `COMING_SOON → AVAILABLE` documentada en Edge Cases con la regla de negocio clara
- ✅ Fuera de alcance bien delimitado: sin stock numérico, sin notificaciones, sin variantes
- ✅ Sin dependencias bloqueantes con otras HUs del lote; `ProductStatus` ya existe en schema

---

## Notas de Arquitectura

- **Dominio:** `catalog` (extensión del modelo `Product`)
- **Entidades / VOs involucrados:** `Product` (Aggregate — se extiende con `availability`), `ProductAvailability` (Value Object — encapsula `status: ProductAvailabilityStatus` y `availableFrom?: Date`, con método `isAvailableAt(now: Date): boolean` que implementa la lógica de transición automática)
- **Puerto de entrada:**
  - `IUpdateProductAvailabilityUseCase(productId: string, status: ProductAvailabilityStatus, availableFrom?: Date): Promise<void>`
  - `ICheckProductAvailabilityUseCase(productId: string): Promise<boolean>` (usado por el dominio `cart` como precondición para agregar al carrito)
- **Puerto de salida:** `IProductRepository` (ya existe — se extiende para incluir `availabilityStatus` y `availableFrom` en `save` y en los métodos de lectura del catálogo)
- **Capa Next.js:** Client Component (selector de disponibilidad en formulario admin) + Server Action (persistir cambio de disponibilidad) + Server Component (catálogo — renderiza la etiqueta de estado según `ProductAvailability.isAvailableAt(new Date())`)
- **Schema Prisma:** Extensión del modelo `Product` con nuevo enum y campos:
  ```prisma
  enum ProductAvailabilityStatus {
    AVAILABLE
    OUT_OF_STOCK
    COMING_SOON
  }

  // En el modelo Product, agregar:
  availabilityStatus ProductAvailabilityStatus @default(AVAILABLE)
  availableFrom      DateTime?
  ```
  Nota: la migración es aditiva (nuevos campos con default). No rompe pedidos ni funcionalidad existente.
- **Variables de entorno nuevas:** Ninguna
- **Restricciones técnicas:**
  - La lógica de evaluación `COMING_SOON → AVAILABLE` debe vivir exclusivamente en el Value Object `ProductAvailability.isAvailableAt(now: Date): boolean` del dominio `catalog`, no en la capa de infraestructura ni en el frontend
  - La validación de disponibilidad en el endpoint de carrito debe llamar a `ICheckProductAvailabilityUseCase` (dominio `catalog`) desde el UseCase de carrito (dominio `cart`); la comunicación entre dominios se hace via puerto de salida, no importando directamente entre dominios
  - El campo `status: ProductStatus (ACTIVE/INACTIVE)` no se reemplaza ni modifica; `availabilityStatus` es ortogonal: un producto `ACTIVE` puede tener cualquier `availabilityStatus`; un producto `INACTIVE` es invisible en catálogo independientemente de su `availabilityStatus`
  - La evaluación en tiempo de lectura (sin cron) es válida para el volumen esperado del negocio; si se requiere cache del catálogo, el TTL de revalidación debe ser menor a la granularidad de `availableFrom` (ej. revalidar cada hora)

**Estado: APROBADA**
