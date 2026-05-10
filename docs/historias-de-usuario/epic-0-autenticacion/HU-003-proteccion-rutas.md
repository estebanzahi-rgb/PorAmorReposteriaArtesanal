# HU-003: Protección de rutas para usuarios no autenticados

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-003 |
| **Epic** | EPIC 0 — Autenticación de Usuario |
| **Estado** | APROBADA |
| **Prioridad** | Alta |
| **Dependencias** | HU-001 |
| **Bloquea** | Ninguna |

## Descripción

Yo como **usuario no autenticado** quiero **ser redirigido al login cuando intento acceder a contenido que requiere cuenta** para **entender qué necesito hacer antes de continuar**.

## Criterios de Aceptación

### Escenario 1: Acceso a ruta protegida sin sesión

```gherkin
Dado que no tengo sesión activa
Cuando intento acceder a cualquiera de estas rutas:
  | /checkout        |
  | /mis-pedidos     |
  | /pedido/:id      |
Entonces soy redirigido a /login
Y veo el mensaje: "Inicia sesión para continuar"
Y la URL original queda guardada para redirigir después del login
```

### Escenario 2: Rutas públicas accesibles sin sesión

```gherkin
Dado que no tengo sesión activa
Cuando accedo a cualquiera de estas rutas:
  | /               |
  | /catalogo       |
  | /catalogo/:id   |
  | /carrito        |
  | /nosotros       |
Entonces puedo navegar normalmente sin ser redirigido
```

### Escenario 3: Usuario no autenticado intenta ir al checkout desde el carrito

```gherkin
Dado que no tengo sesión activa
Y tengo uno o más productos en mi carrito anónimo
Cuando hago clic en "Proceder al pago"
Entonces soy redirigido a /login con el mensaje: "Inicia sesión para completar tu pedido"
Y al autenticarme exitosamente soy enviado a /checkout
Y mis productos del carrito anónimo siguen presentes
```

### Escenario 4: Acceso a panel de administración sin sesión

```gherkin
Dado que no tengo sesión activa
Cuando intento acceder a cualquier ruta bajo /admin
Entonces soy redirigido a /login
Y después del login exitoso soy enviado de vuelta al panel admin
```

### Escenario 5: Cliente autenticado intenta acceder al panel admin

```gherkin
Dado que tengo sesión activa como cliente (rol USER)
Cuando intento acceder a cualquier ruta bajo /admin
Entonces soy redirigido a /
Y veo el mensaje: "No tienes permisos para acceder a esta sección"
```

### Escenario 6: Acceso a /checkout con carrito vacío

```gherkin
Dado que tengo una sesión activa
Y mi carrito está vacío
Cuando intento acceder a /checkout directamente desde el navegador
Entonces soy redirigido a /catalogo
Y veo el mensaje: "Tu carrito está vacío. Agrega productos para continuar."
```

## Edge Cases

- Manipulación de token en el cliente → el servidor valida en cada request, no solo en el middleware de frontend

## Fuera de alcance

- Roles granulares dentro del admin (por ahora solo existe el rol `ADMIN`)
- Permisos por recurso específico

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-05 | PO | Creación inicial |
| 2026-05-05 | PO | /carrito pasa a ser ruta pública; se agrega escenario de redirección al checkout desde carrito anónimo |
| 2026-05-08 | Refinador | Edge case "carrito vacío en /checkout" promovido a Escenario 6 con criterio Gherkin testeable |
