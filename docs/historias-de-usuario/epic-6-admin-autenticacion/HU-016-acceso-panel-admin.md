# HU-016: Acceso al panel de administración (Google cuenta autorizada)

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-016 |
| **Epic** | EPIC 6 — Admin: Autenticación |
| **Estado** | APROBADA |
| **Prioridad** | Alta |
| **Dependencias** | HU-001 |
| **Bloquea** | HU-017, HU-018, HU-019, HU-020, HU-021, HU-022, HU-026, HU-027, HU-028 |

## Descripción

Yo como **dueña de PorAmor Repostería** quiero **acceder al panel de administración usando mi cuenta de Google autorizada** para **gestionar el catálogo y los pedidos de forma segura**.

## Notas de Arquitectura

- **Dominio:** Auth (Admin)
- **Entidades / VOs involucrados:** `AdminUser { email, role: ADMIN }`, `ADMIN_EMAILS: string[]`
- **Puerto de entrada:** `AuthorizeAdminUseCase(email: string): boolean`
- **Puerto de salida:** `AdminAuthorizationRepository` (lista blanca de correos, configurable vía variable de entorno `ADMIN_EMAILS`)
- **Capa Next.js:** Middleware de Next.js para rutas `/admin/*` + verificación en cada Server Action del admin
- **Restricciones técnicas:** `ADMIN_EMAILS` es una variable de entorno con lista separada por comas. La verificación de rol se hace en el servidor, nunca en el cliente. Compartir el mismo flujo OAuth de HU-001 — la diferencia es el check de autorización post-login.

## Criterios de Aceptación

### Escenario 1: Acceso exitoso con cuenta Google autorizada

```gherkin
Dado que soy la dueña con el correo autorizado en ADMIN_EMAILS
Cuando accedo a /admin e inicio sesión con mi cuenta de Google
Entonces accedo al panel de administración
Y veo el dashboard con el resumen de pedidos recientes
```

### Escenario 2: Cuenta Google no autorizada intenta acceder al admin

```gherkin
Dado que soy un usuario con una cuenta de Google que no está en ADMIN_EMAILS
Cuando intento acceder a /admin y completo el flujo OAuth
Entonces soy redirigido a / (página de inicio del portal)
Y veo el mensaje: "No tienes permisos para acceder a esta sección"
Y no veo ningún contenido del panel de administración
```

### Escenario 3: Admin sin sesión intenta acceder a una ruta del panel

```gherkin
Dado que no tengo sesión activa
Cuando intento acceder directamente a /admin/pedidos
Entonces soy redirigido a /login
Y después de autenticarme con cuenta autorizada soy enviado a /admin/pedidos
```

### Escenario 4: Sesión de admin expirada en medio de una operación

```gherkin
Dado que tengo sesión de admin activa
Y mi sesión expira mientras trabajo en el panel
Cuando intento guardar un cambio
Entonces recibo el mensaje: "Tu sesión expiró. Inicia sesión nuevamente."
Y soy redirigido a /login preservando la URL del panel
```

## Edge Cases

- Dueña accede al admin desde el mismo navegador donde tiene sesión como cliente → la sesión de cliente se eleva a admin después de verificar el correo en ADMIN_EMAILS
- `ADMIN_EMAILS` vacío o no configurado → registrar error crítico al iniciar la aplicación y bloquear acceso al panel completamente

## Fuera de alcance

- Múltiples roles de administración (solo existe el rol `ADMIN`)
- Auditoría de acciones del admin
- 2FA adicional al OAuth de Google

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenario de sesión expirada durante operación agregado. Mensajes exactos |
| 2026-05-08 | Arquitecto | ADMIN_EMAILS como variable de entorno documentado. Verificación siempre en servidor. Compartición del flujo OAuth de HU-001 |
