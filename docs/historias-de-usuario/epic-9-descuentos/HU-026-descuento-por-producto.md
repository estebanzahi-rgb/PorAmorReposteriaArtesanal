# HU-026: Admin — Crear descuento por producto (tiempo limitado)

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-026 |
| **Epic** | EPIC 9 — Descuentos |
| **Estado** | APROBADA |
| **Prioridad** | Media |
| **Dependencias** | HU-016, HU-019 |
| **Bloquea** | HU-023 |

## Descripción

Yo como **administradora** quiero **aplicar un descuento de porcentaje a un producto específico por un período de tiempo definido** para **ofrecer promociones temporales sin modificar el precio base del producto**.

## Notas de Arquitectura

- **Dominio:** Discount (Admin)
- **Entidades / VOs involucrados:** `ProductDiscount { id, productId, percentage: number, startsAt: Date, endsAt: Date, isActive: boolean }`
- **Puerto de entrada:** `CreateProductDiscountUseCase(dto)`, `DeactivateProductDiscountUseCase(id)`
- **Puerto de salida:** `DiscountRepository.save(discount)`
- **Capa Next.js:** Server Action + Client Component formulario
- **Restricciones técnicas:** Solo puede existir 1 descuento activo por producto a la vez. `percentage` entre 1 y 99. `startsAt` puede ser en el futuro (descuento programado). `endsAt` debe ser posterior a `startsAt`. El sistema evalúa si el descuento está activo comparando la fecha actual con el rango.

## Criterios de Aceptación

### Escenario 1: Crear descuento por producto exitosamente

```gherkin
Dado que estoy en /admin/descuentos/nuevo-descuento-producto
Cuando selecciono el producto "Trufas artesanales"
Y ingreso porcentaje 20, fecha de inicio hoy y fecha de fin en 3 días
Y hago clic en "Crear descuento"
Entonces el descuento se crea y queda activo inmediatamente
Y en el catálogo el producto muestra el 20% de descuento
Y veo la confirmación: "Descuento creado exitosamente"
```

### Escenario 2: Descuento inicia en el futuro

```gherkin
Dado que creo un descuento para mañana a las 00:00
Cuando guardo el descuento
Entonces el descuento queda en estado "Programado"
Y el producto no muestra descuento en el catálogo hasta que llegue la fecha de inicio
```

### Escenario 3: Descuento vence automáticamente

```gherkin
Dado que existe un descuento activo con fecha de fin hoy a las 23:59
Cuando pasa la medianoche
Entonces el descuento deja de aplicarse automáticamente
Y el producto vuelve a mostrar su precio original en el catálogo
```

### Escenario 4: Intentar crear segundo descuento en producto con descuento activo

```gherkin
Dado que "Trufas artesanales" ya tiene un descuento activo del 20%
Cuando intento crear un nuevo descuento del 15% para el mismo producto
Entonces veo el error: "Este producto ya tiene un descuento activo. Desactívalo primero para crear uno nuevo."
```

## Edge Cases

- `percentage = 100` → rechazado: "El porcentaje máximo es 99%"
- `endsAt` anterior a `startsAt` → rechazado: "La fecha de fin debe ser posterior a la fecha de inicio"

## Fuera de alcance

- Descuento por valor fijo (solo porcentaje en esta HU)
- Descuentos aplicables a una categoría entera

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenario 4 para descuento duplicado. Mensajes exactos |
| 2026-05-08 | Arquitecto | 1 descuento activo por producto máximo. Evaluación por rango de fechas. Descuento programado documentado |
