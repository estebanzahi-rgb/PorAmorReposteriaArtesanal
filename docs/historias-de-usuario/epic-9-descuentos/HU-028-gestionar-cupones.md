# HU-028: Admin — Gestionar cupones (crear, ver usos, anular)

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-028 |
| **Epic** | EPIC 9 — Descuentos |
| **Estado** | APROBADA |
| **Prioridad** | Media |
| **Dependencias** | HU-016 |
| **Bloquea** | HU-024 |

## Descripción

Yo como **administradora** quiero **crear cupones de descuento con código personalizado, tipo (porcentaje o valor fijo) y límite de usos** para **poder dar descuentos especiales a clientes de forma controlada**.

## Notas de Arquitectura

- **Dominio:** Discount (Admin)
- **Entidades / VOs involucrados:** `Coupon { id, code: string, type: PERCENTAGE | FIXED_VALUE, value: number, usageLimit: number | null, usageCount: number, isActive: boolean, createdAt }`
- **Puerto de entrada:** `CreateCouponUseCase(dto)`, `DeactivateCouponUseCase(id)`, `GetCouponsUseCase(): Coupon[]`
- **Puerto de salida:** `CouponRepository`
- **Capa Next.js:** Server Actions + Client Components
- **Restricciones técnicas:** El `code` es único (case-insensitive). `usageLimit = null` significa usos ilimitados. `value` para PERCENTAGE entre 1-99; para FIXED_VALUE > 0. El `usageCount` es de solo lectura para el admin. Un cupón anulado (`isActive = false`) no puede ser reactivado desde la UI (para integridad).

## Criterios de Aceptación

### Escenario 1: Crear cupón de porcentaje con límite de usos

```gherkin
Dado que estoy en /admin/descuentos/cupones/nuevo
Cuando ingreso código "CUMPLE10", tipo "Porcentaje", valor 10, límite 1 uso
Y hago clic en "Crear cupón"
Entonces el cupón se crea y aparece en la lista de cupones activos
Y veo la confirmación: "Cupón CUMPLE10 creado exitosamente"
```

### Escenario 2: Crear cupón de valor fijo sin límite de usos

```gherkin
Dado que estoy en el formulario de nuevo cupón
Cuando ingreso código "FIDELIDAD20K", tipo "Valor fijo", valor $20.000, sin límite de usos
Y guardo el cupón
Entonces el cupón queda activo con usos ilimitados
Y se muestra en la lista con "Usos: ilimitado"
```

### Escenario 3: Ver usos de un cupón

```gherkin
Dado que el cupón "CUMPLE10" fue usado 1 vez de su límite de 1
Cuando veo la lista de cupones
Entonces veo "CUMPLE10" con indicador "1/1 usos"
Y el estado muestra "Agotado" (aunque siga activo, no puede usarse más)
```

### Escenario 4: Anular cupón activo

```gherkin
Dado que el cupón "PROMO2026" está activo y tiene usos disponibles
Cuando hago clic en "Anular" y confirmo
Entonces el cupón pasa a estado "Anulado"
Y cualquier cliente que intente usarlo ve el error: "Este cupón no es válido o ha expirado"
Y el cupón no puede reactivarse
```

### Escenario 5: Código de cupón duplicado

```gherkin
Dado que ya existe el cupón "CUMPLE10"
Cuando intento crear un nuevo cupón con el mismo código
Entonces veo el error: "Ya existe un cupón con el código CUMPLE10"
Y el nuevo cupón no se crea
```

## Edge Cases

- Código con espacios o caracteres especiales → normalizar a mayúsculas sin espacios al guardar (ej. "cumple 10" → "CUMPLE10")
- Cupón de porcentaje con `value = 100` → rechazado: "El porcentaje máximo es 99%"
- Cupón de valor fijo mayor al total del pedido → el descuento se limita al total (total no puede ser negativo)

## Fuera de alcance

- Cupones vinculados a un usuario específico
- Fecha de expiración del cupón (puede agregarse en iteración futura)
- Importación masiva de cupones

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenario 3 para ver usos. Escenario 5 para código duplicado. Mensajes exactos |
| 2026-05-08 | Arquitecto | code único case-insensitive. usageLimit null = ilimitado. Cupón anulado no reactivable. Normalización de código |
