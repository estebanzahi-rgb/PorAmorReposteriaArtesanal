# HU-020: Ver listado de pedidos con filtros

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-020 |
| **Epic** | EPIC 8 — Admin: Pedidos |
| **Estado** | APROBADA |
| **Prioridad** | Alta |
| **Dependencias** | HU-016, HU-013 |
| **Bloquea** | HU-021 |

## Descripción

Yo como **administradora** quiero **ver el listado de todos los pedidos con filtros por estado y tipo de entrega** para **tener visibilidad de la operación y priorizar mi trabajo**.

## Notas de Arquitectura

- **Dominio:** Order (Admin)
- **Entidades / VOs involucrados:** `Order`, `OrderStatus`, `DeliveryType`
- **Puerto de entrada:** `GetOrdersUseCase(filter?: { status?: OrderStatus; deliveryType?: DeliveryType; dateFrom?: Date; dateTo?: Date }): Order[]`
- **Puerto de salida:** `OrderRepository.findAll(filter)`
- **Capa Next.js:** Server Component con parámetros de URL como filtros
- **Restricciones técnicas:** Ordenados por fecha de creación descendente por defecto. Solo visible para rol ADMIN.
- **Layout responsivo:** Layout dual obligatorio — cards en `md:hidden` (con botón de acción a ancho completo) y tabla en `hidden md:block`. No usar tabla única con `overflow-x-auto` en móvil; el scroll horizontal es no discoverable en touch. Ver ADR-003.

## Criterios de Aceptación

### Escenario 1: Ver todos los pedidos sin filtros

```gherkin
Dado que estoy en /admin/pedidos
Cuando la página carga
Entonces veo la lista de todos los pedidos ordenados del más reciente al más antiguo
Y cada pedido muestra: número, nombre del cliente, total, estado y tipo de entrega
```

### Escenario 2: Filtrar por estado

```gherkin
Dado que estoy en /admin/pedidos
Cuando selecciono el filtro "En preparación"
Entonces solo veo los pedidos con estado "En preparación"
Y la URL cambia a /admin/pedidos?estado=en-preparacion
```

### Escenario 3: Filtrar por tipo de entrega

```gherkin
Dado que estoy en /admin/pedidos
Cuando selecciono el filtro "Domicilio"
Entonces solo veo los pedidos con tipo de entrega "Domicilio"
```

### Escenario 4: Ver detalle de un pedido

```gherkin
Dado que estoy en el listado de pedidos
Cuando hago clic en el número de pedido PAM-2026-0001
Entonces soy redirigido a /admin/pedidos/PAM-2026-0001
Y veo el detalle completo: ítems, configuraciones, datos del cliente, dirección si aplica, total, método de pago
```

### Escenario 5: Sin pedidos que coincidan con el filtro

```gherkin
Dado que aplico un filtro que no arroja resultados
Cuando la lista se actualiza
Entonces veo el mensaje: "No hay pedidos que coincidan con los filtros aplicados"
```

## Edge Cases

- Listado con muchos pedidos → mostrar los últimos 50 por defecto con opción de cargar más
- Pedido cancelado incluido en el listado → visible pero con indicador visual de estado cancelado

## Fuera de alcance

- Exportación de pedidos a CSV/Excel
- Búsqueda por nombre de cliente o número de pedido (puede agregarse en iteración futura)

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenario 5 para lista vacía. Mensajes exactos |
| 2026-05-08 | Arquitecto | Límite de 50 pedidos por defecto. Ordenamiento por fecha descendente |
| 2026-05-13 | Arquitecto | Layout dual (cards móvil + tabla desktop) documentado en Notas de Arquitectura. Referencia a ADR-003 |
