# Arquitectura HU-07 — Google Analytics 4

## Auditoría de código existente

| Artefacto | Ubicación | Estado |
|---|---|---|
| Root layout | `src/frontend/app/layout.tsx` | Existe — agregar componente `<Analytics>` |
| Catalog page / Product detail | `src/frontend/app/(shop)/catalog/...` | Existe — integrar `useGA4` para eventos |
| Checkout flow | `src/frontend/app/(shop)/checkout/...` | Existe — evento `begin_checkout` |

No existe ninguna integración de analytics. Implementación puramente frontend.

---

## Cambios al schema Prisma

Ninguno.

---

## Nuevas entidades / Value Objects

Ninguna.

---

## Ports nuevos o modificados

Ninguno.

---

## Estructura de carpetas

```
src/frontend/
  components/
    analytics/
      Analytics.tsx                        ← NUEVO — carga el script de GA4
  hooks/
    useGA4.ts                              ← NUEVO — wrapper para gtag events
  app/
    layout.tsx                             ← MODIFICAR — incluir <Analytics />
  app/(shop)/
    catalog/[slug]/page.tsx                ← MODIFICAR — view_item
    checkout/page.tsx                      ← MODIFICAR — begin_checkout
```

---

## Variables de entorno nuevas

| Variable | Dónde | Descripción | Ejemplo |
|---|---|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Vercel (frontend) | Measurement ID de Google Analytics 4 | `G-XXXXXXXXXX` — desde GA4 → Admin → Data Streams |

---

## Notas de implementación

### 1. Componente Analytics

```typescript
// src/frontend/components/analytics/Analytics.tsx
'use client';
import Script from 'next/script';

export function Analytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', { page_path: window.location.pathname });
        `}
      </Script>
    </>
  );
}
```

Agregado al final del `<body>` en `app/layout.tsx`:
```tsx
<Analytics />
```

### 2. Hook useGA4

```typescript
// src/frontend/hooks/useGA4.ts
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function useGA4() {
  function trackEvent(eventName: string, params: Record<string, unknown> = {}) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, params);
    }
  }

  function trackViewItem(product: { id: string; name: string; price: number; category?: string }) {
    trackEvent('view_item', {
      currency: 'COP',
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        quantity: 1,
      }],
    });
  }

  function trackBeginCheckout(total: number, items: Array<{ id: string; name: string; price: number; quantity: number }>) {
    trackEvent('begin_checkout', {
      currency: 'COP',
      value: total,
      items: items.map((i) => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    });
  }

  return { trackViewItem, trackBeginCheckout, trackEvent };
}
```

### 3. Integración en páginas

**Detalle de producto** (`view_item`):
```tsx
// En el Client Component que muestra el producto
const { trackViewItem } = useGA4();
useEffect(() => {
  trackViewItem({ id: product.id, name: product.name, price: product.basePrice });
}, [product.id]);
```

**Inicio de checkout** (`begin_checkout`):
```tsx
// Al hacer click en "Confirmar pedido" o al montar la página de checkout
const { trackBeginCheckout } = useGA4();
// Llamar con los items del carrito
```

### 4. Sin dependencias de npm adicionales

`next/script` está incluido en Next.js. `window.gtag` se declara globalmente. No se instala ningún paquete extra.

### 5. Consentimiento de cookies (GDPR/LGPD)

Colombia tiene Ley 1581/2012 de protección de datos. Para el alcance de esta HU, GA4 se carga sin banner de consentimiento (el negocio es nacional y de pequeña escala). Si en el futuro se requiere cumplimiento estricto, se implementará Consent Mode v2 de Google.
