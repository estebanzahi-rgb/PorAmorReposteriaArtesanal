# HU-017: Crear y editar producto con variantes simples

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-017 |
| **Epic** | EPIC 7 — Admin: Catálogo |
| **Estado** | APROBADA |
| **Prioridad** | Alta |
| **Dependencias** | HU-016 |
| **Bloquea** | Ninguna |

## Descripción

Yo como **administradora** quiero **crear nuevos productos y editar los existentes incluyendo sus variantes y precios** para **mantener el catálogo actualizado**.

## Notas de Arquitectura

- **Dominio:** Catalog (Admin)
- **Entidades / VOs involucrados:** `Product { id, name, slug, description, basePrice, category, status, images[] }`, `ProductVariant { id, name, priceModifier }`
- **Puerto de entrada:** `CreateProductUseCase(dto)`, `UpdateProductUseCase(id, dto)`, `AddVariantUseCase(productId, variantDto)`, `RemoveVariantUseCase(productId, variantId)`
- **Puerto de salida:** `ProductRepository.save(product)`
- **Capa Next.js:** Server Actions para mutaciones; formulario como Client Component
- **Restricciones técnicas:** El `slug` se genera automáticamente desde el nombre (kebab-case). Las imágenes se suben a un bucket S3 (o almacenamiento compatible). Un producto necesita al menos una imagen para activarse. `basePrice` > 0 obligatorio.

## Criterios de Aceptación

### Escenario 1: Crear un nuevo producto exitosamente

```gherkin
Dado que estoy en /admin/catalogo/nuevo
Cuando ingreso nombre, descripción, categoría, precio base y subo al menos una imagen
Y hago clic en "Guardar producto"
Entonces el producto se crea con estado "Inactivo" por defecto
Y soy redirigido a la página de edición del producto recién creado
Y veo la confirmación: "Producto creado exitosamente"
```

### Escenario 2: Agregar variante a un producto existente

```gherkin
Dado que estoy editando el producto "Trufas artesanales"
Cuando hago clic en "Agregar variante"
Y ingreso el nombre "Torta de zanahoria" y el modificador de precio $2.000
Y hago clic en "Guardar variante"
Entonces la variante aparece en la lista de variantes del producto
Y el precio de esa variante se calcula como basePrice + $2.000
```

### Escenario 3: Editar datos de un producto existente

```gherkin
Dado que estoy en la página de edición de un producto existente
Cuando modifico la descripción y el precio base
Y hago clic en "Guardar cambios"
Entonces los cambios se persisten
Y veo la confirmación: "Producto actualizado exitosamente"
```

### Escenario 4: Intentar guardar sin campos obligatorios

```gherkin
Dado que estoy en el formulario de nuevo producto
Y no ingresé el precio base
Cuando hago clic en "Guardar producto"
Entonces el campo "Precio base" se resalta con el mensaje: "El precio base es obligatorio"
Y el producto no se crea
```

### Escenario 5: Eliminar variante de un producto

```gherkin
Dado que el producto "Trufas artesanales" tiene la variante "Torta de zanahoria"
Cuando hago clic en "Eliminar" junto a esa variante y confirmo
Entonces la variante desaparece de la lista
Y si hay pedidos pendientes que incluyen esa variante, la variante se marca como inactiva en lugar de eliminarse
```

## Edge Cases

- Nombre de producto duplicado → mostrar error: "Ya existe un producto con este nombre"
- Imagen en formato no soportado → mostrar error antes de intentar subir
- Producto con variante única eliminada → el producto queda sin variantes pero no se desactiva automáticamente

## Fuera de alcance

- Gestión de stock por variante
- Importación masiva de productos (CSV)

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenario 5 con lógica de pedidos pendientes. Mensajes exactos de validación |
| 2026-05-08 | Arquitecto | Slug auto-generado. Estado inicial INACTIVO documentado. Restricción de imagen mínima para activar |
