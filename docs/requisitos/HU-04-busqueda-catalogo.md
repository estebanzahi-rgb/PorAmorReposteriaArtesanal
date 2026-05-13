# HU-04 — Búsqueda de productos en el catálogo

**Como** cliente  
**Quiero** poder buscar productos por nombre en la página del catálogo  
**Para** encontrar rápidamente el producto que quiero sin tener que recorrer toda la lista

---

## Criterios de Aceptación

### Escenario 1: El cliente escribe en la barra de búsqueda y los resultados se filtran en tiempo real
**Dado** que el cliente está en la página del catálogo `/catalogo` con 10 productos visibles  
**Cuando** el cliente escribe "chocolate" en la barra de búsqueda  
**Entonces** la lista de productos se actualiza inmediatamente (sin recarga de página ni petición al servidor) mostrando solo los productos cuyo nombre contiene "chocolate", insensible a mayúsculas y a tildes

### Escenario 2: La búsqueda no encuentra coincidencias
**Dado** que el cliente está en la página del catálogo  
**Cuando** el cliente escribe "zzzyyyy" en la barra de búsqueda  
**Entonces** la lista de productos se vacía y se muestra el mensaje "No encontramos productos con ese nombre. Intenta con otra búsqueda." en el lugar de las tarjetas de producto

### Escenario 3: El cliente borra el texto de búsqueda
**Dado** que el cliente ha filtrado productos con el término "torta" y la lista muestra 3 resultados  
**Cuando** el cliente borra completamente el contenido de la barra de búsqueda  
**Entonces** la lista de productos vuelve a mostrar todos los productos del catálogo sin ningún filtro activo

### Escenario 4: La búsqueda es insensible a tildes y mayúsculas
**Dado** que existe un producto llamado "Torta de Vainilla"  
**Cuando** el cliente escribe "vainilla", "VAINILLA" o "vaínilla" en la barra de búsqueda  
**Entonces** el producto "Torta de Vainilla" aparece en los resultados en los tres casos

---

## Edge Cases Identificados
- La búsqueda opera exclusivamente sobre los productos ya cargados en el cliente (no hace petición al servidor en cada keystroke)
- La barra de búsqueda debe tener `aria-label="Buscar productos"` para accesibilidad y `placeholder="Buscar productos..."`
- Si el catálogo incorpora paginación en el futuro, la búsqueda se limitará a los productos de la página actual (deuda técnica a documentar en ese momento)
- Caracteres especiales en la búsqueda (ej. `.*+?`) no deben provocar errores de runtime en la lógica de filtrado

---

## Fuera de Alcance
- Búsqueda full-text en el backend (PostgreSQL FTS o servicio externo)
- Búsqueda por categoría, precio o etiquetas
- Historial de búsquedas recientes
- Sugerencias de autocompletado mientras se escribe
- Búsqueda con debounce (el filtrado es instantáneo sobre datos en memoria)

---

## Definición de Done
- [ ] Existe una barra de búsqueda visible en la parte superior de la página `/catalogo`
- [ ] Escribir en la barra filtra los productos visibles sin recarga de página ni petición al servidor
- [ ] La búsqueda es insensible a mayúsculas y tildes (normalización NFD)
- [ ] El estado "sin resultados" muestra exactamente el mensaje: "No encontramos productos con ese nombre. Intenta con otra búsqueda."
- [ ] Borrar la búsqueda restaura todos los productos del catálogo
- [ ] El input tiene `aria-label="Buscar productos"` y `placeholder="Buscar productos..."`
- [ ] Test E2E cubre: búsqueda con resultados, búsqueda sin resultados y limpieza de búsqueda

---

## Revisión DoR (Refinador)

- ✅ Tiene título claro y único
- ✅ 4 escenarios Gherkin con datos concretos (término "chocolate", número de productos, texto exacto del mensaje vacío)
- ✅ El Escenario 4 cubre el edge case de tildes con tres variantes concretas
- ✅ Fuera de alcance bien delimitado: no incluye búsqueda backend, no autocompletado
- ✅ Sin dependencias con otras HUs del lote
- ✅ Estimación: menos de 2 días (solo Client Component sin cambios en backend ni schema)

---

## Notas de Arquitectura

- **Dominio:** N/A — funcionalidad de presentación pura sin lógica de negocio nueva
- **Entidades / VOs involucrados:** `Product` (campos `name`, `slug`, `images`, `basePrice`, `category` — ya cargados en la página del catálogo por el Server Component padre)
- **Puerto de entrada:** N/A — no requiere nuevos endpoints; se reutiliza la carga existente de productos en `/catalogo/page.tsx`
- **Puerto de salida:** N/A
- **Capa Next.js:** Client Component (`ProductSearchBar`) + Client Component (`ProductGrid` o conversión del grid actual). El Server Component `/catalogo/page.tsx` carga los productos y los pasa como props al Client Component que gestiona el estado de búsqueda.
- **Schema Prisma:** Sin cambios
- **Variables de entorno nuevas:** Ninguna
- **Restricciones técnicas:**
  - La normalización de tildes debe usar `String.prototype.normalize('NFD').replace(/[\u0300-\u036f]/g, '')` — nativo en V8, sin dependencias adicionales
  - El filtrado reactivo debe implementarse con `useState` (término de búsqueda) + `useMemo` (productos filtrados); evitar `useEffect` para el filtro en sí para prevenir flickers
  - Los caracteres especiales que podrían interpretarse como regex (`.`, `*`, `+`, `?`) deben escaparse si se usa `RegExp`; preferir `String.includes()` sobre regex para mayor seguridad y simplicidad
  - Si en el futuro el catálogo supera los 200 productos cargados simultáneamente en el cliente, esta solución puede degradar el rendimiento; documentar como deuda técnica para migrar a búsqueda backend

**Estado: APROBADA**
