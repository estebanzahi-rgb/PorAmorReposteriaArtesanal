# Guía de Reutilización — Template de Tienda Artesanal

Este proyecto es la implementación de referencia para tiendas de comercio artesanal. Este documento explica qué cambiar, qué no tocar, y los patrones arquitectónicos ya validados que no deben reinventarse.

---

## 1. Qué cambiar por tienda

### Identidad visual
| Archivo | Qué ajustar |
|---|---|
| `src/frontend/public/logo.png` | Logo de la tienda |
| `src/frontend/app/globals.css` | Variables CSS: `--brand-brown`, `--brand-teal`, `--brand-teal-dark` |
| `src/frontend/app/layout.tsx` | `metadata.title`, `metadata.description` |
| `src/frontend/components/layout/navbar.tsx` | Nombre de la tienda en el span del brand |

### Datos de negocio (variables de entorno)
| Variable | Descripción |
|---|---|
| `OWNER_EMAIL` | Email del dueño de la tienda para notificaciones |
| `OWNER_WHATSAPP` | Número WhatsApp para link de comprobantes |
| `RESEND_FROM_EMAIL` | Remitente de emails transaccionales |
| `ADMIN_EMAILS` | Lista de emails con acceso al panel admin |
| `NEXT_PUBLIC_SITE_URL` | URL pública del frontend (para OG tags y callbacks) |

### Datos de pago (checkout-form.tsx)
Buscar el bloque de datos bancarios y reemplazar con los de la nueva tienda:
```tsx
// src/frontend/components/checkout/checkout-form.tsx
<p className="font-semibold">Bancolombia — Cuenta de ahorros</p>
<p>Número: <strong>XXX-XXX-XXX</strong></p>
<p>Llave: <strong>XXXXXXXXXX</strong></p>
```

### Catálogo inicial
Cargar categorías, productos y opciones del configurador directamente en la DB o través del panel admin. No hay seed scripts — usar el panel admin en `/admin/catalogo`.

---

## 2. Qué NO cambiar (patrones validados)

### ADR-001 — Race condition de merge de carrito
**No eliminar** `isMerging` del `CartProvider` ni la dependencia en `checkout/page.tsx`.

El bug aparece solo cuando el usuario: (1) agrega productos sin sesión, (2) va a checkout, (3) hace login. Sin `isMerging`, el checkout llama `GET /cart` antes de que `POST /cart/merge` termine y muestra "carrito vacío" con los productos del usuario perdidos.

Ver: `docs/arquitectura/patrones/ADR-001-cart-merge-race-condition.md`

### ADR-002 — Gateways de pago con inicialización lazy
**No usar** `configService.getOrThrow()` en constructores de adaptadores de servicios externos opcionales. El servidor no puede arrancar en staging sin todas las credenciales de producción.

Ver: `docs/arquitectura/patrones/ADR-002-gateway-lazy-init.md`

### ADR-003 — Layout dual en tablas admin
**No usar** tabla única con `overflow-x-auto` para listados admin. El scroll horizontal es invisible en móvil touch.

Todas las páginas admin de listado usan:
- `md:hidden` → cards con CTA a ancho completo
- `hidden md:block` → tabla con todas las columnas

Ver: `docs/arquitectura/patrones/ADR-003-admin-tables-mobile-responsive.md`

### ADR-004 — Adaptadores de notificación no lanzan excepciones al caller
Los adaptadores de email, SMS u otras notificaciones **no deben bloquear el flujo de negocio** si fallan. Un email fallido no cancela un pedido.

Ver: `docs/arquitectura/patrones/ADR-004-external-service-adapter-failure.md`

### ADR-005 — Precio total en configuradores incluye precio base
El `totalPrice` en configuradores (tortas, combos) **siempre** empieza desde `basePrice` del producto. El padre pasa `basePrice` como prop explícita incluyendo cualquier descuento activo.

Ver: `docs/arquitectura/patrones/ADR-005-configurator-base-price.md`

---

## 3. Proceso para agregar una nueva tienda

### Paso 1 — Fork / copia del repositorio
```bash
git clone <repo-template> nueva-tienda
cd nueva-tienda
git remote set-url origin <repo-nueva-tienda>
```

### Paso 2 — Actualizar identidad visual
1. Reemplazar `public/logo.png`
2. Ajustar variables CSS en `globals.css`
3. Actualizar nombre en `layout.tsx` y `navbar.tsx`

### Paso 3 — Configurar variables de entorno
Copiar `.env.example` → `.env.local` (frontend) y `.env.example` → `.env` (backend).
Completar todos los campos marcados como `REQUIRED`.

### Paso 4 — Migrar base de datos
```bash
cd src/backend
npx prisma migrate deploy
```

### Paso 5 — Configurar servicios externos
| Servicio | Acción |
|---|---|
| Google OAuth | Crear proyecto en Google Cloud Console, agregar redirect URIs |
| Resend | Crear API key, verificar dominio de envío |
| Cloudinary | Crear cuenta, obtener cloud_name/api_key/api_secret |
| MercadoPago | Crear aplicación en developers.mercadopago.com |

### Paso 6 — Primer deploy
1. Push a GitHub
2. Crear servicio en Render (backend) con las variables de entorno del backend
3. Crear proyecto en Vercel (frontend) con las variables de entorno del frontend
4. Ejecutar `prisma migrate deploy` apuntando a la DB de producción

---

## 4. Checklist antes de go-live

### Funcional
- [ ] Login con Google funciona y redirige al home
- [ ] Agregar producto al carrito como anónimo → login → productos se mantienen en checkout
- [ ] Completar pedido con transferencia bancaria → email llega al dueño
- [ ] Panel admin accesible solo con email en `ADMIN_EMAILS`
- [ ] Cambio de estado de pedido funciona en todos los pasos del flujo

### Configuración
- [ ] `RESEND_API_KEY` configurada en producción (sin ella, emails fallan silenciosamente)
- [ ] `OWNER_EMAIL` configurada (destino de notificaciones de pedidos)
- [ ] `OWNER_WHATSAPP` configurada (formato: `573001234567` sin +, espacios ni guiones)
- [ ] `ADMIN_EMAILS` incluye el email de la dueña de la tienda
- [ ] `NEXT_PUBLIC_SITE_URL` apunta al dominio de producción (necesario para OG tags)

### Seguridad
- [ ] `NEXTAUTH_SECRET` es un valor aleatorio único por tienda (no reutilizar entre tiendas)
- [ ] Variables de entorno de producción no están en el repositorio
- [ ] URLs de callback OAuth apuntan al dominio correcto en Google Cloud Console

---

## 5. Errores comunes al crear una nueva tienda

### "MERCADOPAGO_ACCESS_TOKEN is missing" en startup
**Causa:** Adaptador MP usa `getOrThrow` en el constructor.
**Solución:** Verificar que el adaptador usa inicialización lazy (ADR-002). Si el error persiste, el adaptador fue modificado incorrectamente.

### "Tu carrito está vacío" después del login en checkout
**Causa:** Race condition entre merge y carga del carrito (ADR-001).
**Solución:** Verificar que `CartProvider` expone `isMerging` y `checkout/page.tsx` lo consume correctamente.

### Precio $0 en el configurador de tortas
**Causa:** `basePrice` no se pasa como prop al componente configurador (ADR-005).
**Solución:** Verificar que el padre pasa `basePrice={discountedPrice ?? product.basePrice}`.

### Emails no llegan en producción
**Causa:** `RESEND_API_KEY` vacía (el adaptador retorna silenciosamente con WARN, ver ADR-004).
**Solución:** Configurar la variable en Render/hosting de producción. Buscar `[EMAIL SKIPPED]` en los logs para confirmar.

### Tabla de pedidos admin sin botón de acción en móvil
**Causa:** Solo hay tabla con `overflow-x-auto`, sin layout dual (ADR-003).
**Solución:** Agregar bloque `md:hidden` con cards antes del bloque `hidden md:block` con la tabla.

---

## 6. Documentación de referencia

| Documento | Propósito |
|---|---|
| `docs/arquitectura/DOMINIOS.md` | Bounded contexts y reglas de dependencia |
| `docs/arquitectura/ESTRUCTURA-CARPETAS.md` | Convenciones de carpetas y naming |
| `docs/arquitectura/STACK-Y-VARIABLES-ENTORNO.md` | Stack completo y todas las variables de entorno |
| `docs/arquitectura/deployment.md` | Infraestructura, servicios externos, go-live checklist |
| `docs/arquitectura/patrones/ADR-001 a ADR-005` | Patrones arquitectónicos validados |
| `docs/historias-de-usuario/` | Especificaciones funcionales con criterios de aceptación |
| `CLAUDE.md` | Instrucciones para el equipo de agentes Claude Code |
