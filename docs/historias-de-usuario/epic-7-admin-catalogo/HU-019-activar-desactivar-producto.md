# HU-019: Activar / desactivar producto del catálogo

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-019 |
| **Epic** | EPIC 7 — Admin: Catálogo |
| **Estado** | APROBADA |
| **Prioridad** | Media |
| **Dependencias** | HU-016, HU-017 |
| **Bloquea** | Ninguna |

## Descripción

Yo como **administradora** quiero **activar o desactivar productos del catálogo** para **controlar qué productos están disponibles para los clientes sin necesidad de eliminarlos**.

## Notas de Arquitectura

- **Dominio:** Catalog (Admin)
- **Entidades / VOs involucrados:** `Product`, `ProductStatus: enum(ACTIVE | INACTIVE)`
- **Puerto de entrada:** `ToggleProductStatusUseCase(productId, status)`
- **Puerto de salida:** `ProductRepository.updateStatus(productId, status)`
- **Capa Next.js:** Server Action desde la lista de productos del admin
- **Restricciones técnicas:** Un producto INACTIVE no aparece en el catálogo público ni en búsquedas. Si se desactiva un producto con pedidos en estado diferente a ENTREGADO o CANCELADO, se muestra advertencia pero se permite continuar. No se permite eliminación física si el producto tiene historial de pedidos.

## Criterios de Aceptación

### Escenario 1: Desactivar un producto activo

```gherkin
Dado que el producto "Trufas artesanales" está activo en el catálogo
Cuando hago clic en "Desactivar" en la lista de productos del admin y confirmo
Entonces el producto pasa a estado "Inactivo"
Y desaparece del catálogo público y de los resultados de búsqueda
Y en el panel admin sigo viéndolo marcado como inactivo
```

### Escenario 2: Reactivar un producto inactivo

```gherkin
Dado que el producto "Trufas artesanales" está inactivo
Cuando hago clic en "Activar" en el panel admin
Entonces el producto pasa a estado "Activo"
Y vuelve a aparecer en el catálogo público
```

### Escenario 3: Desactivar producto con pedidos en curso

```gherkin
Dado que el producto "Torta personalizada" tiene pedidos en estado "En preparación"
Cuando intento desactivarlo
Entonces veo el aviso: "Este producto tiene pedidos en curso. Desactivarlo no afectará los pedidos existentes. ¿Deseas continuar?"
Y si confirmo, el producto se desactiva y los pedidos siguen su curso normalmente
```

## Edge Cases

- Admin intenta eliminar físicamente un producto con historial de pedidos → la acción de eliminación no está disponible; solo desactivación
- Producto recién creado (sin imagen) intentando activarse → mostrar error: "El producto debe tener al menos una imagen para activarse"

## Fuera de alcance

- Activación/desactivación programada (publicación futura)
- Archivado de productos (estado diferente a INACTIVE)

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenario 3 con aviso explícito. Mensaje exacto documentado |
| 2026-05-08 | Arquitecto | No eliminación física con historial documentada. Requisito de imagen para activar |
