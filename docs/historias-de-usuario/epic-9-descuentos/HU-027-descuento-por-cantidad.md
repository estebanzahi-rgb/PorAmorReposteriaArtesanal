# HU-027: Admin — Crear regla de descuento por cantidad

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-027 |
| **Epic** | EPIC 9 — Descuentos |
| **Estado** | APROBADA |
| **Prioridad** | Baja |
| **Dependencias** | HU-016, HU-019 |
| **Bloquea** | HU-023 |

## Descripción

Yo como **administradora** quiero **crear reglas que ofrezcan descuento automático cuando el cliente compra cierta cantidad del mismo producto** para **incentivar la compra de volumen**.

## Notas de Arquitectura

- **Dominio:** Discount (Admin)
- **Entidades / VOs involucrados:** `QuantityDiscountRule { id, productId, minQuantity: number, percentage: number, isActive: boolean }`
- **Puerto de entrada:** `CreateQuantityDiscountRuleUseCase(dto)`, `UpdateQuantityDiscountRuleUseCase(id, dto)`, `ToggleQuantityDiscountRuleUseCase(id)`
- **Puerto de salida:** `DiscountRepository.saveQuantityRule(rule)`
- **Capa Next.js:** Server Action + Client Component
- **Restricciones técnicas:** Solo 1 regla de cantidad activa por producto a la vez. `minQuantity >= 2`. `percentage` entre 1 y 99. La regla aplica a todo el ítem cuando se alcanza el `minQuantity` (no solo a las unidades extra). La regla coexiste con descuento por producto — gana el mayor.

## Criterios de Aceptación

### Escenario 1: Crear regla de descuento por cantidad

```gherkin
Dado que estoy en /admin/descuentos/nueva-regla-cantidad
Cuando selecciono el producto "Trufas artesanales"
Y configuro: cantidad mínima 3, porcentaje 15%
Y hago clic en "Crear regla"
Entonces la regla se crea y queda activa
Y veo la confirmación: "Regla de descuento por cantidad creada"
```

### Escenario 2: Regla activa en el carrito del cliente

```gherkin
Dado que existe la regla: 3+ Trufas = 15% descuento
Cuando el cliente agrega 3 Trufas al carrito
Entonces el carrito muestra el precio con 15% de descuento aplicado
Y veo la nota: "Compraste 3 o más unidades: 15% de descuento"
```

### Escenario 3: Editar cantidad mínima de una regla existente

```gherkin
Dado que la regla de "Trufas" tiene cantidad mínima 3
Cuando edito la cantidad mínima a 5 y guardo
Entonces la nueva cantidad mínima es 5
Y clientes con 3 o 4 trufas ya no ven el descuento por cantidad
```

### Escenario 4: Desactivar regla de cantidad

```gherkin
Dado que la regla de cantidad para "Trufas" está activa
Cuando hago clic en "Desactivar regla"
Entonces la regla se desactiva
Y el descuento por cantidad deja de aplicarse en el carrito
```

## Edge Cases

- `minQuantity = 1` → rechazado: "La cantidad mínima debe ser al menos 2"
- Regla activada mientras el cliente tiene el carrito abierto → el descuento se aplica la próxima vez que el cliente recargue el carrito o vaya al checkout

## Fuera de alcance

- Reglas de cantidad que aplican a combinaciones de productos
- Descuento escalonado (3 = 10%, 5 = 15%, 10 = 20%)

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenario 3 para edición. Escenario 4 para desactivación |
| 2026-05-08 | Arquitecto | minQuantity >= 2 documentado. Regla aplica a todo el ítem. Coexistencia con descuento por producto → gana el mayor |
