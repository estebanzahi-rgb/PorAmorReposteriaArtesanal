# HU-002: Cerrar sesión

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-002 |
| **Epic** | EPIC 0 — Autenticación de Usuario |
| **Estado** | APROBADA |
| **Prioridad** | Alta |
| **Dependencias** | HU-001 |
| **Bloquea** | Ninguna |

## Descripción

Yo como **usuario autenticado** quiero **poder cerrar mi sesión** para **proteger mi cuenta en dispositivos compartidos**.

## Criterios de Aceptación

### Escenario 1: Cierre de sesión exitoso

```gherkin
Dado que tengo una sesión activa
Cuando hago clic en "Cerrar sesión" desde el menú de mi perfil
Entonces soy redirigido a la página de inicio
Y el menú de perfil muestra el botón "Iniciar sesión" en lugar de mi nombre y foto
Y el botón "Cerrar sesión" ya no está disponible en la navegación
```

### Escenario 2: Intento de acceso a ruta protegida después de cerrar sesión

```gherkin
Dado que acabo de cerrar sesión exitosamente
Cuando intento acceder a /mis-pedidos directamente desde el navegador
Entonces soy redirigido a /login
Y veo el mensaje: "Inicia sesión para continuar"
```

### Escenario 3: Sesión expirada automáticamente por inactividad

```gherkin
Dado que tengo una sesión activa
Y no he realizado ninguna acción en el portal por el tiempo máximo configurado
Cuando intento acceder a /mis-pedidos
Entonces soy redirigido a /login con el mensaje: "Tu sesión expiró. Inicia sesión nuevamente."
Y la URL /mis-pedidos queda guardada para redirigir después del login exitoso
```

### Escenario 4: Sesión expirada al intentar completar el checkout

```gherkin
Dado que tenía una sesión activa que expiró mientras navegaba
Cuando intento ir a /checkout
Entonces soy redirigido a /login con el mensaje: "Tu sesión expiró. Inicia sesión nuevamente."
Y al autenticarme exitosamente soy redirigido a /checkout
```

## Edge Cases

- Usuario cierra el navegador sin cerrar sesión → la sesión expira según el tiempo máximo configurado en el servidor (no persiste indefinidamente)
- Cierre de sesión con carrito no vacío → el carrito persiste asociado a la cuenta para cuando vuelva a iniciar sesión

## Fuera de alcance

- Cierre de sesión en todos los dispositivos simultáneamente
- Historial de dispositivos conectados

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-05 | PO | Creación inicial |
| 2026-05-08 | Refinador | Se eliminó condicional `si` del Escenario 1 (bloqueante DoR); se separa en Escenario 1 (logout visible) y Escenario 2 (acceso post-logout). Se reemplaza "sesión invalidada en servidor" por comportamiento observable. Se agrega Escenario 4 para expiración en checkout |
