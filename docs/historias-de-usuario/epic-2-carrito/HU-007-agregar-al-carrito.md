# HU-007: Agregar producto / configuración al carrito

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-007 |
| **Epic** | EPIC 2 — Carrito de Compras |
| **Estado** | APROBADA |
| **Prioridad** | Alta |
| **Dependencias** | HU-005, HU-006 |
| **Bloquea** | HU-008, HU-009 |

## Descripción

Yo como **visitante (autenticado o no)** quiero **agregar productos o configuraciones de torta a mi carrito** para **acumular lo que quiero comprar antes de pagar**.

## Notas de Arquitectura

- **Dominio:** Cart
- **Entidades / VOs involucrados:** `Cart`, `CartItem { id, productId, variantId?, cakeConfig?: CakeConfiguration, quantity: number, unitPrice: number }`
- **Puerto de entrada:** `AddItemToCartUseCase(cartId: string, item: AddItemDTO)`
- **Puerto de salida:** `CartRepository.save(cart)` / `localStorage` para carrito anónimo
- **Capa Next.js:** Client Component + Server Action para usuario autenticado
- **Restricciones técnicas:** Carrito anónimo persiste en `localStorage` bajo clave `por_amor_cart`. Al autenticarse, la fusión la maneja HU-009. El `unitPrice` se calcula y congela en el momento de agregar (no varía si el admin cambia el precio después).

## Criterios de Aceptación

### Escenario 1: Agregar producto con variante al carrito (visitante no autenticado)

```gherkin
Dado que estoy en el detalle del producto "Trufas artesanales"
Y tengo seleccionada la variante "Torta de chocolate"
Cuando hago clic en "Agregar al carrito"
Entonces el producto se agrega al carrito con cantidad 1
Y el ícono del carrito en la navegación muestra el contador actualizado
Y veo una confirmación: "Producto agregado al carrito"
Y no soy redirigido, permanezco en la misma página
```

### Escenario 2: Agregar configuración de torta al carrito

```gherkin
Dado que completé una configuración válida en el configurador de tortas
Cuando hago clic en "Agregar al carrito"
Entonces la configuración completa se agrega como un ítem del carrito
Y el precio del ítem corresponde al precio calculado durante la configuración
Y el ícono del carrito en la navegación muestra el contador actualizado
```

### Escenario 3: Agregar el mismo producto con la misma variante por segunda vez

```gherkin
Dado que tengo el producto "Trufas - Torta de chocolate" (x1) en el carrito
Cuando agrego el mismo producto y variante nuevamente desde su detalle
Entonces la cantidad del ítem existente aumenta a 2
Y no se crea un ítem duplicado en el carrito
```

### Escenario 4: Usuario autenticado agrega producto

```gherkin
Dado que tengo una sesión activa
Cuando agrego cualquier producto al carrito
Entonces el ítem se persiste en el servidor asociado a mi cuenta
Y si cierro y abro el navegador el carrito sigue con mis productos
```

## Edge Cases

- Dos configuraciones de torta distintas del mismo producto base → se agregan como ítems separados (no se suman, ya que la configuración es diferente)
- Precio cambia en el admin después de agregar al carrito → el carrito mantiene el `unitPrice` original; se notifica al usuario solo si llega al checkout y el precio difiere

## Fuera de alcance

- Límite máximo de cantidad por ítem (se define cuando haya restricciones de producción)
- Lista de deseos

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenarios atómicos verificados. Confirmación visual explicitada |
| 2026-05-08 | Arquitecto | `unitPrice` congelado al momento de agregar documentado. Distinción entre carrito anónimo y autenticado clarificada |
