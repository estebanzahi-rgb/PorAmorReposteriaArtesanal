# HU-005: Ver detalle de producto con variantes simples

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-005 |
| **Epic** | EPIC 1 — Catálogo de Productos |
| **Estado** | APROBADA |
| **Prioridad** | Alta |
| **Dependencias** | HU-004 |
| **Bloquea** | HU-007 |

## Descripción

Yo como **visitante (autenticado o no)** quiero **ver la página de detalle de un producto con sus variantes disponibles y el precio de cada una** para **elegir la opción que prefiero y agregarla al carrito**.

## Notas de Arquitectura

- **Dominio:** Catalog
- **Entidades / VOs involucrados:** `Product`, `ProductVariant { id, name, priceModifier: number }`
- **Puerto de entrada:** `GetProductByIdUseCase(productId: string): Product | null`
- **Puerto de salida:** `ProductRepository.findById(id)`
- **Capa Next.js:** Server Component para carga inicial del producto; Client Component para el selector de variantes (actualización de precio reactiva sin navegación)
- **Restricciones técnicas:** Precio mostrado = `product.basePrice + selectedVariant.priceModifier`. Producto con `status = INACTIVE` retorna 404. El slug de la URL se deriva del nombre del producto.

## Criterios de Aceptación

### Escenario 1: Ver detalle con variantes disponibles

```gherkin
Dado que estoy en /catalogo
Cuando hago clic en el producto "Trufas artesanales"
Entonces soy redirigido a /catalogo/trufas-artesanales
Y veo nombre, descripción completa y galería de imágenes
Y veo un selector con todas las variantes activas del producto
Y la primera variante disponible está preseleccionada por defecto
Y el precio mostrado corresponde a la variante preseleccionada
```

### Escenario 2: Cambiar variante y ver precio actualizado

```gherkin
Dado que estoy en /catalogo/trufas-artesanales
Y la variante "Torta de chocolate" está seleccionada mostrando el precio $X
Cuando selecciono la variante "Torta de vainilla" con precio $Y
Entonces el precio mostrado cambia a $Y sin recargar la página
Y el botón "Agregar al carrito" permanece habilitado
```

### Escenario 3: Producto sin variantes

```gherkin
Dado que accedo al detalle de un producto que no tiene variantes definidas
Cuando la página carga
Entonces veo el precio único del producto
Y no se muestra ningún selector de variantes
```

### Escenario 4: Producto no encontrado

```gherkin
Dado que accedo a /catalogo/producto-que-no-existe
Cuando la página intenta cargar
Entonces veo una página con el mensaje: "Este producto no está disponible"
Y veo un botón "Volver al catálogo" que lleva a /catalogo
Y el código HTTP de la respuesta es 404
```

### Escenario 5: Producto desactivado por el admin

```gherkin
Dado que accedo a la URL directa de un producto marcado como inactivo por el admin
Cuando la página intenta cargar
Entonces veo el mismo comportamiento que el Escenario 4 (404)
Y el producto no aparece en búsquedas ni en el catálogo
```

## Edge Cases

- Producto con una sola variante activa → no mostrar selector, mostrar la variante directamente como precio del producto
- Variante con `priceModifier = 0` → mostrar precio base sin indicación de modificador
- URL con slug incorrecto pero ID válido en query param → usar el ID como fallback

## Fuera de alcance

- Reseñas o valoraciones de productos
- Comparación entre productos
- Gestión de stock por variante (se evalúa en una iteración futura)

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Verificado: todos los Entonces son observables. Escenario 5 redirige al mismo comportamiento 404 del Escenario 4 |
| 2026-05-08 | Arquitecto | Notas de arquitectura agregadas. Fórmula de precio documentada. Restricción de `status = INACTIVE` → 404 |
