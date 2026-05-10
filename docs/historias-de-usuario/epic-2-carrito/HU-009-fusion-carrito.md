# HU-009: Fusionar carrito anónimo con carrito del usuario al autenticarse

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-009 |
| **Epic** | EPIC 2 — Carrito de Compras |
| **Estado** | APROBADA |
| **Prioridad** | Alta |
| **Dependencias** | HU-001, HU-007 |
| **Bloquea** | Ninguna |

## Descripción

Yo como **visitante que se autentica** quiero **que los productos que agregué sin sesión se conserven y combinen con mi carrito guardado** para **no perder mi selección al iniciar sesión**.

## Notas de Arquitectura

- **Dominio:** Cart
- **Entidades / VOs involucrados:** `Cart (anonymous)`, `Cart (user)`, `CartItem`
- **Puerto de entrada:** `MergeCartsUseCase(anonymousCartItems: CartItem[], userId: string): Cart`
- **Puerto de salida:** `CartRepository.findByUserId(userId)`, `CartRepository.save(cart)`
- **Capa Next.js:** Server Action ejecutada en el callback de OAuth (después de autenticación exitosa)
- **Restricciones técnicas:** La fusión es idempotente. Si el mismo producto+variante existe en ambos carritos, las cantidades se suman. Dos `CakeConfiguration` diferentes del mismo producto base se agregan como ítems separados. El carrito anónimo en `localStorage` se limpia después de la fusión exitosa.

## Criterios de Aceptación

### Escenario 1: Login con carrito de cuenta vacío

```gherkin
Dado que soy un visitante con Producto A (x2) en mi carrito anónimo
Y mi cuenta de usuario no tiene carrito previo
Cuando me autentico exitosamente
Entonces mi carrito muestra Producto A (x2)
Y el carrito anónimo en localStorage queda vacío
```

### Escenario 2: Login con carritos de productos distintos

```gherkin
Dado que soy un visitante con Producto A (x1) en mi carrito anónimo
Y mi cuenta de usuario tiene Producto B (x2) guardado
Cuando me autentico exitosamente
Entonces mi carrito muestra Producto A (x1) y Producto B (x2)
Y veo la nota: "Combinamos tu carrito con los productos guardados en tu cuenta"
```

### Escenario 3: Login con el mismo producto en ambos carritos

```gherkin
Dado que soy un visitante con Producto A (x2) en mi carrito anónimo
Y mi cuenta de usuario tiene Producto A (x1) guardado
Cuando me autentico exitosamente
Entonces mi carrito muestra Producto A (x3)
Y veo la nota: "Combinamos tu carrito con los productos guardados en tu cuenta"
```

### Escenario 4: Login con carrito anónimo vacío

```gherkin
Dado que soy un visitante sin productos en mi carrito anónimo
Y mi cuenta de usuario tiene Producto B (x1) guardado
Cuando me autentico exitosamente
Entonces mi carrito muestra Producto B (x1)
Y no se muestra ninguna nota de combinación
```

### Escenario 5: Dos configuraciones de torta distintas del mismo producto base

```gherkin
Dado que tengo en mi carrito anónimo una torta de chocolate con relleno de arequipe
Y mi cuenta tiene guardada una torta de vainilla con relleno de frutos rojos
Cuando me autentico exitosamente
Entonces mi carrito muestra ambas configuraciones como ítems separados
Y el precio total refleja la suma de ambas configuraciones
```

## Edge Cases

- Fallo de red durante la fusión → el carrito anónimo en localStorage no se borra hasta confirmar la fusión exitosa en el servidor
- Usuario que se autentica desde dos pestañas simultáneamente → la fusión debe ser idempotente y no duplicar ítems

## Fuera de alcance

- Fusión con carrito de otra cuenta (cambio de cuenta)
- Resolución de conflictos de precio (el `unitPrice` original de cada ítem se respeta)

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenario 5 agregado para CakeConfiguration distintas. Todos los Entonces observables |
| 2026-05-08 | Arquitecto | Idempotencia documentada. Limpieza de localStorage condicionada a éxito del servidor. MergeCartsUseCase definido |
