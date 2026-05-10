# HU-008: Ver y gestionar carrito

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-008 |
| **Epic** | EPIC 2 — Carrito de Compras |
| **Estado** | APROBADA |
| **Prioridad** | Alta |
| **Dependencias** | HU-007 |
| **Bloquea** | HU-010 |

## Descripción

Yo como **visitante (autenticado o no)** quiero **ver el contenido de mi carrito y poder modificar cantidades o eliminar productos** para **revisar y ajustar mi pedido antes de pagar**.

## Notas de Arquitectura

- **Dominio:** Cart
- **Entidades / VOs involucrados:** `Cart`, `CartItem`
- **Puerto de entrada:** `GetCartUseCase(cartId)`, `UpdateCartItemUseCase(cartId, itemId, quantity)`, `RemoveCartItemUseCase(cartId, itemId)`
- **Puerto de salida:** `CartRepository`
- **Capa Next.js:** Client Component (toda la página `/carrito` es interactiva)
- **Restricciones técnicas:** El total del carrito no incluye descuentos (se aplican en checkout). El costo de domicilio tampoco se muestra aquí. Cantidad mínima por ítem: 1.

## Criterios de Aceptación

### Escenario 1: Ver productos en el carrito

```gherkin
Dado que tengo productos en mi carrito
Cuando accedo a /carrito
Entonces veo la lista de ítems con nombre, descripción de variante o configuración, precio unitario y cantidad
Y veo el precio total del carrito (suma de unitPrice × quantity de cada ítem)
Y veo el botón "Proceder al pago"
```

### Escenario 2: Aumentar cantidad de un ítem

```gherkin
Dado que tengo el ítem "Trufas - Torta de chocolate" (x1) en mi carrito
Cuando hago clic en el botón "+" del ítem
Entonces la cantidad del ítem pasa a 2
Y el precio total del carrito se actualiza
```

### Escenario 3: Disminuir cantidad de un ítem (mínimo 1)

```gherkin
Dado que tengo el ítem "Trufas - Torta de chocolate" (x2) en mi carrito
Cuando hago clic en el botón "-" del ítem
Entonces la cantidad del ítem pasa a 1
Y el precio total del carrito se actualiza
```

### Escenario 4: Intentar disminuir cantidad por debajo de 1

```gherkin
Dado que tengo el ítem "Trufas - Torta de chocolate" (x1) en mi carrito
Cuando hago clic en el botón "-" del ítem
Entonces el botón "-" aparece deshabilitado
Y la cantidad permanece en 1
```

### Escenario 5: Eliminar ítem del carrito

```gherkin
Dado que tengo el ítem "Trufas - Torta de chocolate" en mi carrito
Cuando hago clic en el ícono de eliminar del ítem
Entonces el ítem desaparece del carrito
Y el precio total del carrito se actualiza
Y si era el último ítem, veo la vista de carrito vacío
```

### Escenario 6: Carrito vacío

```gherkin
Dado que no tengo productos en mi carrito
Cuando accedo a /carrito
Entonces veo el mensaje: "Tu carrito está vacío"
Y veo un botón "Explorar productos" que lleva a /catalogo
Y el botón "Proceder al pago" no está visible
```

## Edge Cases

- Usuario con carrito anónimo accede a /carrito en un dispositivo diferente → el carrito no estará disponible (está en localStorage del otro dispositivo); mostrar carrito vacío
- Ítem con configuración de torta personalizada → mostrar resumen de la configuración (tamaño, sabor, relleno, cubierta) en lugar de solo el nombre del producto

## Fuera de alcance

- Guardar carrito como lista de deseos
- Aplicación de cupones o descuentos (se aplican en checkout)
- Costo de domicilio (se muestra en checkout)

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenario 4 separado de Escenario 3. Botón deshabilitado es observable |
| 2026-05-08 | Arquitecto | Restricción de cantidad mínima = 1 documentada. Total sin descuentos ni domicilio clarificado |
