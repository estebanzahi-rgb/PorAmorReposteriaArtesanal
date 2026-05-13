# Deployment Runbook — PorAmor Repostería Artesanal

## Servicios externos requeridos

| Servicio | Rol | Plan | URL |
|---|---|---|---|
| **Render** | Hosting backend NestJS | Free (Web Service) | render.com |
| **Neon** | PostgreSQL en la nube | Free | neon.tech |
| **Vercel** | Hosting frontend Next.js | Free | vercel.com |
| **Google Cloud Console** | OAuth 2.0 para login | Gratuito | console.cloud.google.com |
| **Resend** | Envío de emails transaccionales | Free (100 emails/día) | resend.com |
| **UptimeRobot** | Monitor de disponibilidad + keep-alive | Free | uptimerobot.com |
| **Cloudinary** | Almacenamiento y CDN de imágenes de productos | Free (25 GB / 25 créditos/mes) | cloudinary.com |
| **MercadoPago** | Pasarela de pagos online | Comisión por transacción | mercadopago.com.co |
| **Google Analytics 4** | Analítica web | Gratuito | analytics.google.com |

---

## Variables de entorno — Backend (Render)

| Variable | Descripción | Ejemplo / Notas |
|---|---|---|
| `DATABASE_URL` | Conexión Neon PostgreSQL | `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Secreto para firmar tokens JWT | Mínimo 32 chars — `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `JWT_EXPIRES_IN` | Expiración del JWT | `7d` |
| `GOOGLE_CLIENT_ID` | OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret | Desde Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | Redirect URI del backend | `https://poramorreposteriaartesanal.onrender.com/api/auth/google/callback` |
| `FRONTEND_URL` | URL del frontend (CORS) | `https://por-amor-reposteria-artesanal.vercel.app` |
| `ADMIN_EMAILS` | Emails con acceso al panel admin | `admin@ejemplo.com` (separados por coma si son varios) |
| `RESEND_API_KEY` | API Key de Resend | `re_xxxxxxxxxx` — desde resend.com → API Keys |
| `RESEND_FROM_EMAIL` | Email remitente | `onboarding@resend.dev` (free) o dominio verificado |
| `OWNER_EMAIL` | Email de la dueña del negocio | Recibe notificaciones de pedidos |
| `OWNER_WHATSAPP` | WhatsApp del negocio | `+573001234567` |
| `NODE_ENV` | Entorno de ejecución | `production` |
| `MERCADOPAGO_ACCESS_TOKEN` | Access token de la app MercadoPago (producción) | `APP_USR-xxx-yyy` — desde MP Developers → Credenciales de producción |
| `MERCADOPAGO_WEBHOOK_SECRET` | Clave secreta para validar firma HMAC de webhooks de MP | Generado en MP → Webhooks → Clave secreta |
| `MERCADOPAGO_SUCCESS_URL` | URL de redirección tras pago exitoso en MP | `https://por-amor-reposteria-artesanal.vercel.app/checkout/success` |
| `MERCADOPAGO_FAILURE_URL` | URL de redirección tras pago fallido en MP | `https://por-amor-reposteria-artesanal.vercel.app/checkout/failure` |
| `MERCADOPAGO_PENDING_URL` | URL de redirección cuando el pago queda pendiente en MP | `https://por-amor-reposteria-artesanal.vercel.app/checkout/pending` |

> `PORT` lo inyecta Render automáticamente — no configurar manualmente.

---

## Variables de entorno — Frontend (Vercel)

| Variable | Descripción | Ejemplo / Notas |
|---|---|---|
| `NEXTAUTH_URL` | URL pública del frontend | `https://por-amor-reposteria-artesanal.vercel.app` |
| `NEXTAUTH_SECRET` | Secreto para NextAuth | Mínimo 32 chars — generar igual que JWT_SECRET |
| `GOOGLE_CLIENT_ID` | OAuth Client ID | Mismo que en backend |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret | Mismo que en backend |
| `API_URL` | URL del backend (server-side) | `https://poramorreposteriaartesanal.onrender.com/api` |
| `NEXT_PUBLIC_API_URL` | URL del backend (client-side) | `https://poramorreposteriaartesanal.onrender.com/api` |
| `NEXT_PUBLIC_OWNER_WHATSAPP` | WhatsApp sin `+` | `573001234567` |
| `NEXT_PUBLIC_SITE_URL` | URL pública canónica del sitio, sin trailing slash | `https://por-amor-reposteria-artesanal.vercel.app` — usada por SEO (HU-03) y sitemap |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Measurement ID de Google Analytics 4 | `G-XXXXXXXXXX` — desde GA4 → Admin → Data Streams (HU-07) |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud en Cloudinary | `mi-cloud-name` — desde Cloudinary Dashboard (HU-06) |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary | `123456789012345` — desde Cloudinary Dashboard (HU-06) |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary — **nunca exponer en cliente** | `abcdefghijklmnopqrstuvwxyz12` — desde Cloudinary Dashboard (HU-06) |

---

## Configuración Google Cloud Console

En **APIs & Services → Credentials → OAuth 2.0 Client ID**:

**Authorized JavaScript origins:**
```
https://por-amor-reposteria-artesanal.vercel.app
```

**Authorized redirect URIs:**
```
https://poramorreposteriaartesanal.onrender.com/api/auth/google/callback
https://por-amor-reposteria-artesanal.vercel.app/api/auth/callback/google
```

---

## Configuración Render (Backend)

| Campo | Valor |
|---|---|
| **Root Directory** | `src/backend` |
| **Build Command** | `npm install --include=dev && npx prisma migrate deploy && npm run build` |
| **Start Command** | `node dist/src/main` |
| **Node version** | 20 (recomendado) o default |

---

## Configuración Neon (Base de datos)

1. Crear proyecto en neon.tech
2. Copiar la **Connection string** con `?sslmode=require`
3. Ejecutar migraciones: `npx prisma migrate deploy` (se puede incluir en el Build Command)
4. El `postinstall` del `package.json` ya ejecuta `prisma generate` automáticamente

**Build Command recomendado con migraciones:**
```
npm install --include=dev && npx prisma migrate deploy && npm run build
```

---

## Checklist de go-live

- [ ] Variables de entorno backend configuradas en Render
- [ ] Variables de entorno frontend configuradas en Vercel
- [ ] Redirect URIs agregadas en Google Cloud Console (backend + frontend)
- [ ] Migraciones de base de datos ejecutadas en Neon
- [ ] UptimeRobot configurado apuntando a `https://poramorreposteriaartesanal.onrender.com/api/catalog`
- [ ] Login con Google funciona en producción
- [ ] Catálogo carga productos desde la DB
- [ ] Un pedido de prueba completo (catálogo → carrito → checkout)
- [ ] Email de confirmación llega correctamente

---

## Checklist de go-live — Fase 2 (nuevas features)

- [ ] Variables de entorno MercadoPago configuradas en Render
- [ ] Variables de entorno Cloudinary configuradas en Vercel
- [ ] Variables SEO y GA4 configuradas en Vercel (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`)
- [ ] Webhook de MercadoPago registrado en el Dashboard de MP apuntando a `https://poramorreposteriaartesanal.onrender.com/api/payments/mercadopago/webhook`
- [ ] Migraciones de Fase 2 ejecutadas en Neon:
  - `add_scheduled_at_to_orders` (HU-01)
  - `add_store_settings` (HU-05)
  - `add_product_availability` (HU-10)
  - `add_reviews` (HU-09)
- [ ] Cloud Cloudinary creado y credenciales copiadas

---

## Protocolo para nuevas features (Fase 4+)

Antes de que el desarrollador toque código, el arquitecto debe incluir en su entregable:

1. **Variables de entorno nuevas** — nombre, descripción, valor de ejemplo, en qué servicio va
2. **Servicios externos nuevos** — cómo aprovisionarlos, plan requerido, costo estimado
3. **Cambios en redirect URIs o CORS** — si la feature toca auth o dominios

El desarrollador no puede declarar una tarea como done sin que las variables estén documentadas aquí.

---

## Protocolo para migraciones manuales de Prisma

Cuando el proxy corporativo bloquea `prisma migrate dev` o `prisma generate`, la migración debe escribirse a mano. Seguir esta checklist **antes de hacer commit**:

### Checklist pre-escritura

- [ ] Leer el `migration.sql` de la migración inicial para conocer los nombres exactos de tablas y enums (Prisma usa snake_case para tablas: `orders`, `order_items`, `product_discounts`, etc.)
- [ ] Verificar los nombres de columnas afectadas en esa misma migración
- [ ] Confirmar el tipo de operación: `ALTER TYPE ... ADD VALUE` no requiere `ALTER TABLE`

### Checklist de escritura del SQL

- [ ] Solo incluir las sentencias estrictamente necesarias (no cambiar DEFAULTs de columnas si Prisma los gestiona en código)
- [ ] Usar los nombres exactos de tablas/enums con comillas dobles tal como aparecen en el init migration
- [ ] Para agregar valores a un enum: `ALTER TYPE "NombreEnum" ADD VALUE 'NUEVO_VALOR';`
- [ ] No incluir `ALTER TABLE` para cambiar defaults de status/enums — Prisma siempre pasa el valor explícitamente

### Checklist post-escritura (local)

- [ ] Ejecutar `tsc --noEmit` en backend para verificar tipos
- [ ] Si la migración toca enums del Prisma client: agregar casts `as any` temporales en los repositorios afectados hasta que Render regenere el client
- [ ] Verificar que el pre-commit hook pasa en verde

### Si una migración falla en producción (Render/Neon)

Cuando Prisma registra una migración como fallida, bloquea futuros deploys. Para desbloquear:

**1. Marcar como rolled-back en el Build Command de Render (temporalmente):**
```
npm install --include=dev && npx prisma migrate resolve --rolled-back <nombre_migracion> || true && npx prisma migrate deploy && npm run build
```

**2. Una vez desplegado exitosamente, limpiar el Build Command:**
```
npm install --include=dev && npx prisma migrate deploy && npm run build
```

**3. Hacer commit del SQL corregido** antes de triggear el redeploy.

### Referencia de nombres de tablas del proyecto

| Modelo Prisma | Tabla en DB |
|---|---|
| `User` | `users` |
| `Category` | `categories` |
| `Product` | `products` |
| `ProductVariant` | `product_variants` |
| `CakeOption` | `cake_options` |
| `Cart` | `carts` |
| `CartItem` | `cart_items` |
| `Order` | `orders` |
| `OrderItem` | `order_items` |
| `DeliveryRate` | `delivery_rate` |
| `Payment` | `payments` |
| `ProductDiscount` | `product_discounts` |
| `QuantityDiscountRule` | `quantity_discount_rules` |
| `Coupon` | `coupons` |

**Modelos nuevos — Fase 2:**

| Modelo Prisma | Tabla en DB | HU |
|---|---|---|
| `StoreSettings` | `store_settings` | HU-05 |
| `Review` | `reviews` | HU-09 |

**Nuevos campos en modelos existentes — Fase 2:**

| Modelo | Campo | Tipo | HU |
|---|---|---|---|
| `Order` | `scheduledAt` | `DateTime?` | HU-01 |
| `Product` | `availabilityStatus` | `ProductAvailabilityStatus` | HU-10 |
| `Product` | `availableFrom` | `DateTime?` | HU-10 |

**Nuevos enums — Fase 2:**

| Enum | Valores | HU |
|---|---|---|
| `ProductAvailabilityStatus` | `AVAILABLE`, `OUT_OF_STOCK`, `COMING_SOON` | HU-10 |
