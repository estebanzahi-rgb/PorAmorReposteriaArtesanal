# HU-001: Iniciar sesión con Google

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-001 |
| **Epic** | EPIC 0 — Autenticación de Usuario |
| **Estado** | APROBADA |
| **Prioridad** | Alta |
| **Dependencias** | Ninguna |
| **Bloquea** | HU-009, HU-010, HU-011, HU-012 |

## Descripción

Yo como **visitante no autenticado** quiero **iniciar sesión con mi cuenta de Google** para **poder completar mi pedido y tener mi historial guardado en el portal de PorAmor**.

## Notas de alcance

- El catálogo y el carrito son accesibles sin login (carrito anónimo en sesión local)
- El login se activa únicamente al intentar ir al checkout o al querer persistir el carrito en la cuenta
- Al autenticarse, el carrito anónimo se fusiona con el carrito del usuario (ver HU-009)

## Criterios de Aceptación

### Escenario 1: Inicio de sesión exitoso desde el checkout — carritos sin productos en común

```gherkin
Dado que soy un visitante no autenticado
Y tengo el Producto A (x2) en mi carrito anónimo
Y mi cuenta de usuario tiene el Producto B (x1) guardado en el carrito
Cuando intento acceder a /checkout
Y el sistema me redirige al login porque no tengo sesión activa
Y completo el flujo OAuth de Google exitosamente
Entonces soy redirigido a /checkout
Y mi carrito muestra Producto A (x2) y Producto B (x1)
```

### Escenario 2: Inicio de sesión exitoso — producto duplicado en ambos carritos

```gherkin
Dado que soy un visitante no autenticado
Y tengo el Producto A (x2) en mi carrito anónimo
Y mi cuenta de usuario tiene el Producto A (x1) guardado en el carrito
Cuando intento acceder a /checkout
Y el sistema me redirige al login porque no tengo sesión activa
Y completo el flujo OAuth de Google exitosamente
Entonces mi carrito muestra el Producto A (x3)
Y veo una nota: "Combinamos tu carrito con los productos guardados en tu cuenta"
```

### Escenario 3: Inicio de sesión voluntario desde la barra de navegación

```gherkin
Dado que soy un visitante no autenticado navegando el catálogo
Cuando hago clic en "Iniciar sesión" en la barra de navegación
Y completo el flujo OAuth exitosamente
Entonces soy redirigido a la página donde estaba antes
Y veo mi foto de perfil y nombre de Google en la navegación
```

### Escenario 4: El usuario cancela el flujo de Google

```gherkin
Dado que estoy en la pantalla de selección de cuenta de Google
Cuando cierro la ventana o hago clic en "Cancelar"
Entonces regreso a la página donde estaba antes
Y veo un mensaje informativo: "Inicio de sesión cancelado"
Y no se crea ninguna sesión
```

### Escenario 5: Error en el proveedor de Google

```gherkin
Dado que hice clic en "Iniciar sesión con Google"
Y el flujo OAuth fue iniciado
Cuando Google retorna un error (timeout, servicio no disponible)
Entonces veo el mensaje: "No fue posible iniciar sesión. Intenta de nuevo."
Y el botón "Iniciar sesión con Google" sigue disponible para reintentar
Y no se crea ninguna sesión
```

## Edge Cases

- Usuario con sesión activa que navega a `/login` → redirigir a inicio directamente
- Token de Google expirado en mitad de la sesión → redirigir a login preservando la URL intentada
- Cuenta de Google suspendida → mostrar error genérico sin exponer detalles técnicos

## Fuera de alcance

- Registro con email/contraseña
- Inicio de sesión con otros proveedores (Facebook, Apple)
- Verificación de email adicional al flujo de Google

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-05 | PO | Creación inicial |
| 2026-05-08 | PO | Se agregan Escenarios 1 y 2 para fusión de carrito anónimo al autenticarse; se incluye caso de suma de cantidades cuando el mismo producto existe en ambos carritos |
| 2026-05-08 | Refinador | Escenarios 1 y 2: se separa el Cuando en pasos atómicos. Escenario 5: se reemplaza "portal no queda en error irrecuperable" por comportamiento observable (botón disponible para reintentar) |
