# Estructura de carpetas — PorAmor Repostería Artesanal

## Principios aplicados

| Principio | Cómo se refleja |
|---|---|
| **SRP** | Cada Use Case es una clase con un solo `execute()` |
| **OCP** | Nuevos adaptadores implementan Ports sin modificar Use Cases |
| **LSP** | `MockPaymentGateway` y gateways reales son intercambiables |
| **ISP** | Ports pequeños y enfocados (ej. `EmailPort` solo tiene `send()`) |
| **DIP** | El dominio define interfaces; la infraestructura las implementa |
| **Clean Code** | Sin comentarios obvios, nombres que expresan intención, funciones pequeñas |

---

## Backend — NestJS (Hexagonal por dominio)

```
src/backend/
├── prisma/
│   └── schema.prisma               ← Esquema de base de datos (fuente de verdad)
└── src/
    ├── shared/                     ← Shared Kernel (sin dependencias de dominio)
    │   ├── domain/
    │   │   ├── value-objects/
    │   │   │   ├── money.vo.ts     ← VO inmutable con invariantes
    │   │   │   └── result.ts       ← Result<T,E> para errores sin excepciones
    │   │   └── events/
    │   │       └── domain-event.ts ← Clase base para Domain Events
    │   └── infrastructure/
    │       └── prisma/
    │           └── prisma.service.ts
    │
    ├── auth/
    │   ├── domain/
    │   │   ├── entities/
    │   │   │   └── user.entity.ts
    │   │   ├── value-objects/
    │   │   │   └── user-role.vo.ts
    │   │   └── ports/
    │   │       ├── in/
    │   │       │   └── authenticate-with-google.use-case.ts
    │   │       └── out/
    │   │           └── user.repository.ts
    │   ├── application/
    │   │   └── use-cases/
    │   │       └── authenticate-with-google.impl.ts
    │   ├── infrastructure/
    │   │   ├── persistence/
    │   │   │   └── user.prisma.repository.ts
    │   │   └── adapters/
    │   │       └── google-oauth.adapter.ts
    │   └── interfaces/
    │       └── http/
    │           └── auth.controller.ts
    │
    ├── catalog/
    │   ├── domain/
    │   │   ├── entities/
    │   │   │   ├── product.entity.ts
    │   │   │   ├── product-variant.entity.ts
    │   │   │   ├── cake-option.entity.ts
    │   │   │   └── category.entity.ts
    │   │   ├── value-objects/
    │   │   │   ├── cake-configuration.vo.ts ← Invariante VINTAGE/mensaje 60 chars
    │   │   │   └── product-status.vo.ts
    │   │   └── ports/
    │   │       ├── in/
    │   │       │   ├── get-products.use-case.ts
    │   │       │   ├── get-product-by-id.use-case.ts
    │   │       │   ├── get-cake-configurator-options.use-case.ts
    │   │       │   ├── create-product.use-case.ts
    │   │       │   ├── update-product.use-case.ts
    │   │       │   ├── toggle-product-status.use-case.ts
    │   │       │   ├── create-cake-option.use-case.ts
    │   │       │   └── toggle-cake-option.use-case.ts
    │   │       └── out/
    │   │           ├── product.repository.ts
    │   │           └── cake-option.repository.ts
    │   ├── application/use-cases/
    │   ├── infrastructure/persistence/
    │   └── interfaces/http/
    │
    ├── cart/
    │   ├── domain/
    │   │   ├── entities/
    │   │   │   ├── cart.entity.ts
    │   │   │   └── cart-item.entity.ts  ← Regla: mismo producto+variante suma cantidad
    │   │   └── ports/
    │   │       ├── in/
    │   │       │   ├── add-item-to-cart.use-case.ts
    │   │       │   ├── update-cart-item.use-case.ts
    │   │       │   ├── remove-cart-item.use-case.ts
    │   │       │   ├── get-cart.use-case.ts
    │   │       │   └── merge-carts.use-case.ts
    │   │       └── out/
    │   │           └── cart.repository.ts
    │   ├── application/use-cases/
    │   ├── infrastructure/persistence/
    │   └── interfaces/http/
    │
    ├── order/
    │   ├── domain/
    │   │   ├── entities/
    │   │   │   ├── order.entity.ts      ← Máquina de estados encapsulada aquí
    │   │   │   └── order-item.entity.ts
    │   │   ├── value-objects/
    │   │   │   ├── customer-info.vo.ts
    │   │   │   ├── delivery-address.vo.ts
    │   │   │   └── order-number.vo.ts   ← Genera PAM-YYYY-XXXX
    │   │   ├── events/
    │   │   │   └── order-placed.event.ts
    │   │   └── ports/
    │   │       ├── in/
    │   │       │   ├── confirm-order.use-case.ts
    │   │       │   ├── get-order-summary.use-case.ts
    │   │       │   ├── update-order-status.use-case.ts
    │   │       │   ├── get-orders.use-case.ts
    │   │       │   └── update-delivery-rate.use-case.ts
    │   │       └── out/
    │   │           ├── order.repository.ts
    │   │           ├── order-draft.repository.ts
    │   │           └── delivery-rate.repository.ts
    │   ├── application/use-cases/
    │   ├── infrastructure/persistence/
    │   └── interfaces/http/
    │
    ├── payment/
    │   ├── domain/
    │   │   ├── entities/
    │   │   │   └── payment.entity.ts
    │   │   └── ports/
    │   │       ├── in/
    │   │       │   └── process-payment.use-case.ts
    │   │       └── out/
    │   │           ├── payment-gateway.port.ts  ← Intercambiable: Mock → Real
    │   │           └── payment.repository.ts
    │   ├── application/use-cases/
    │   └── infrastructure/
    │       └── adapters/
    │           └── mock-payment.adapter.ts      ← Implementa PaymentGatewayPort
    │
    ├── notification/
    │   ├── domain/
    │   │   └── ports/
    │   │       ├── in/
    │   │       │   ├── notify-owner-by-email.use-case.ts
    │   │       │   └── generate-whatsapp-link.use-case.ts
    │   │       └── out/
    │   │           └── email.port.ts            ← Intercambiable: Resend → cualquier otro
    │   ├── application/
    │   │   ├── use-cases/
    │   │   └── handlers/
    │   │       └── order-placed.handler.ts      ← Escucha OrderPlacedEvent
    │   └── infrastructure/
    │       └── adapters/
    │           └── resend-email.adapter.ts
    │
    └── discount/
        ├── domain/
        │   ├── entities/
        │   │   ├── product-discount.entity.ts
        │   │   ├── quantity-discount-rule.entity.ts
        │   │   └── coupon.entity.ts             ← Invariante: code uppercase, usageLimit
        │   ├── services/
        │   │   └── discount-calculation.service.ts ← Resuelve "gana el mayor"
        │   └── ports/
        │       ├── in/
        │       │   ├── get-active-discount.use-case.ts
        │       │   ├── apply-coupon.use-case.ts
        │       │   ├── create-product-discount.use-case.ts
        │       │   ├── create-quantity-rule.use-case.ts
        │       │   └── manage-coupons.use-case.ts
        │       └── out/
        │           ├── discount.repository.ts
        │           └── coupon.repository.ts
        ├── application/use-cases/
        ├── infrastructure/persistence/
        └── interfaces/http/
```

---

## Frontend — Next.js 15 (App Router)

```
src/frontend/
├── app/
│   ├── (public)/               ← Sin autenticación requerida
│   │   ├── page.tsx            → Home
│   │   ├── catalogo/
│   │   │   ├── page.tsx        → Listado con filtros (Server Component)
│   │   │   └── [slug]/
│   │   │       └── page.tsx    → Detalle de producto (Server + Client)
│   │   ├── carrito/
│   │   │   └── page.tsx        → Carrito (Client Component)
│   │   └── nosotros/
│   │       └── page.tsx
│   │
│   ├── (protected)/            ← Middleware verifica sesión activa
│   │   ├── checkout/
│   │   │   └── page.tsx
│   │   ├── mis-pedidos/
│   │   │   └── page.tsx
│   │   └── pedido/
│   │       └── [orderNumber]/
│   │           └── confirmacion/
│   │               └── page.tsx
│   │
│   ├── (admin)/                ← Middleware verifica sesión + rol ADMIN
│   │   └── admin/
│   │       ├── page.tsx        → Dashboard
│   │       ├── pedidos/
│   │       │   ├── page.tsx
│   │       │   └── [orderNumber]/
│   │       │       └── page.tsx
│   │       ├── catalogo/
│   │       │   ├── page.tsx
│   │       │   ├── nuevo/
│   │       │   │   └── page.tsx
│   │       │   └── [id]/
│   │       │       └── page.tsx
│   │       ├── descuentos/
│   │       │   └── page.tsx
│   │       └── configuracion/
│   │           └── page.tsx    → Tarifa de domicilio
│   │
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts    → NextAuth.js handler
│   │
│   └── login/
│       └── page.tsx
│
├── components/
│   ├── ui/                     → shadcn/ui base components
│   ├── catalog/
│   │   ├── product-card.tsx
│   │   ├── product-grid.tsx
│   │   ├── cake-configurator.tsx  ← Client Component (precio reactivo)
│   │   └── variant-selector.tsx
│   ├── cart/
│   │   ├── cart-item.tsx
│   │   ├── cart-summary.tsx
│   │   └── cart-icon.tsx
│   ├── checkout/
│   │   ├── delivery-form.tsx
│   │   ├── payment-selector.tsx
│   │   └── order-summary.tsx
│   └── admin/
│       ├── order-status-badge.tsx
│       ├── status-transition-button.tsx
│       └── product-form.tsx
│
├── lib/
│   ├── auth.ts                 → NextAuth config (Google provider)
│   ├── api.ts                  → Fetch helpers hacia el backend
│   └── cart-storage.ts         → localStorage helpers para carrito anónimo
│
└── types/
    └── index.ts                → Tipos compartidos frontend (DTOs de respuesta)
```

---

## Convención de nombres de archivos

| Tipo | Convención | Ejemplo |
|---|---|---|
| Entity | `[nombre].entity.ts` | `order.entity.ts` |
| Value Object | `[nombre].vo.ts` | `money.vo.ts` |
| Port (in) | `[accion]-[recurso].use-case.ts` | `confirm-order.use-case.ts` |
| Port (out) | `[recurso].repository.ts` | `order.repository.ts` |
| Use Case impl | `[accion]-[recurso].impl.ts` | `confirm-order.impl.ts` |
| Adapter | `[provider]-[tipo].adapter.ts` | `resend-email.adapter.ts` |
| Controller | `[dominio].controller.ts` | `auth.controller.ts` |
| Domain Event | `[evento].event.ts` | `order-placed.event.ts` |
| Event Handler | `[evento].handler.ts` | `order-placed.handler.ts` |
