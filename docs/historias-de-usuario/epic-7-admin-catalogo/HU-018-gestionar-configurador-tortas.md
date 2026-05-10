# HU-018: Gestionar opciones del configurador de tortas con precios

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-018 |
| **Epic** | EPIC 7 — Admin: Catálogo |
| **Estado** | APROBADA |
| **Prioridad** | Alta |
| **Dependencias** | HU-016 |
| **Bloquea** | HU-006 |

## Descripción

Yo como **administradora** quiero **gestionar las opciones disponibles en el configurador de tortas (tamaños, sabores, rellenos, cubiertas y toppers) y sus precios** para **mantener actualizada la oferta de personalización**.

## Notas de Arquitectura

- **Dominio:** Catalog (Admin)
- **Entidades / VOs involucrados:** `CakeOption { id, dimension: enum(SIZE|FLAVOR|FILLING|TOPPING|TOPPER), name, priceModifier: number, isActive: boolean }`
- **Puerto de entrada:** `CreateCakeOptionUseCase(dto)`, `UpdateCakeOptionUseCase(id, dto)`, `ToggleCakeOptionUseCase(id, isActive)`
- **Puerto de salida:** `CakeOptionRepository`
- **Capa Next.js:** Server Actions + Client Components por dimensión
- **Restricciones técnicas:** `dimension = SIZE` debe tener `priceModifier` como precio base (no modificador). Las demás dimensiones usan modificadores relativos al tamaño. `TOPPING_TYPE = VINTAGE` siempre tiene un `priceModifier` > 0 respecto a NAKED. El `priceModifier` puede ser 0 (sin costo extra) pero no negativo.

## Criterios de Aceptación

### Escenario 1: Ver opciones actuales por dimensión

```gherkin
Dado que estoy en /admin/catalogo/configurador
Cuando la página carga
Entonces veo secciones separadas para: Tamaños, Sabores, Rellenos, Cubiertas y Toppers
Y cada opción muestra nombre, precio/modificador y estado (activo/inactivo)
```

### Escenario 2: Agregar nueva opción de tamaño

```gherkin
Dado que estoy en la sección de Tamaños del configurador
Cuando hago clic en "Agregar tamaño"
Y ingreso nombre "Grande" y precio base $95.000
Y hago clic en "Guardar"
Entonces la opción "Grande - $95.000" aparece en la lista de tamaños activos
Y estará disponible para selección en el configurador del portal
```

### Escenario 3: Editar el precio de una opción existente

```gherkin
Dado que el relleno "Ganache de chocolate negro" tiene modificador $8.000
Cuando edito ese modificador a $10.000 y guardo
Entonces el nuevo modificador es $10.000
Y la actualización aplica solo a configuraciones nuevas, no a pedidos ya realizados
```

### Escenario 4: Desactivar una opción del configurador

```gherkin
Dado que el sabor "Zanahoria" está activo en el configurador
Cuando desactivo la opción "Zanahoria"
Entonces "Zanahoria" desaparece del selector de sabores en el portal
Y los pedidos existentes que incluyeron "Zanahoria" no se ven afectados
```

## Edge Cases

- Desactivar la única opción activa de una dimensión obligatoria (ej. último tamaño) → mostrar advertencia: "Desactivar esta opción dejará sin opciones disponibles en Tamaños. ¿Deseas continuar?" con confirmación explícita
- Nombre de opción duplicado dentro de la misma dimensión → mostrar error: "Ya existe una opción con este nombre en esta categoría"

## Fuera de alcance

- Ordenamiento personalizable de las opciones por el admin
- Opciones de disponibilidad por fecha (temporadas)

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenario 3 aclara que cambios aplican solo a configuraciones nuevas |
| 2026-05-08 | Arquitecto | Distinción precio base (SIZE) vs modificador (otras dimensiones). Restricción priceModifier >= 0. Edge case de dimensión obligatoria sin opciones |
