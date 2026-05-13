# Arquitectura HU-03 — SEO básico

## Auditoría de código existente

| Artefacto | Ubicación | Estado |
|---|---|---|
| Home page | `src/frontend/app/(shop)/page.tsx` (inferido) | Existe — agregar `generateMetadata()` |
| Catalog page | `src/frontend/app/(shop)/catalog/page.tsx` (inferido) | Existe — agregar `generateMetadata()` |
| Product detail page | `src/frontend/app/(shop)/catalog/[slug]/page.tsx` (inferido) | Existe — agregar `generateMetadata()` |
| API endpoint catálogo (productos activos) | `GET /catalog/products` vía `CatalogController` | Existe — lo usa el sitemap para listar productos |
| `NEXT_PUBLIC_API_URL` | Vercel env vars | Existe — usada por el sitemap para construir URLs absolutas |

No existe implementación de SEO previa. No existe `sitemap.ts`.

---

## Cambios al schema Prisma

Ninguno.

---

## Nuevas entidades / Value Objects

Ninguna (implementación puramente frontend).

---

## Ports nuevos o modificados

Ninguno en backend. El sitemap utiliza el endpoint público `GET /catalog/products` existente vía `fetch()` server-side.

---

## Estructura de carpetas

```
src/frontend/app/
  sitemap.ts                                    ← NUEVO — Route Handler Next.js para /sitemap.xml
  (shop)/
    page.tsx                                    ← MODIFICAR — agregar generateMetadata()
    catalog/
      page.tsx                                  ← MODIFICAR — agregar generateMetadata()
      [slug]/
        page.tsx                                ← MODIFICAR — agregar generateMetadata() dinámica
```

---

## Variables de entorno nuevas

| Variable | Dónde | Descripción | Ejemplo |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Vercel (frontend) | URL pública canónica del sitio, sin trailing slash | `https://por-amor-reposteria-artesanal.vercel.app` |

---

## Notas de implementación

### 1. generateMetadata en home

```typescript
// src/frontend/app/(shop)/page.tsx
export const metadata: Metadata = {
  title: 'PorAmor Repostería Artesanal — Tortas y postres artesanales en Colombia',
  description: 'Tortas personalizadas, postres artesanales y repostería a domicilio. Pedidos con entrega a domicilio y recogida en tienda.',
  openGraph: {
    title: 'PorAmor Repostería Artesanal',
    description: 'Tortas personalizadas y postres artesanales',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'PorAmor Repostería Artesanal',
    locale: 'es_CO',
    type: 'website',
  },
};
```

### 2. generateMetadata dinámica para producto

```typescript
// src/frontend/app/(shop)/catalog/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await fetchProductBySlug(params.slug); // fetch server-side existente
  return {
    title: `${product.name} — PorAmor Repostería Artesanal`,
    description: product.description.slice(0, 155),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 155),
      images: product.images[0] ? [{ url: product.images[0] }] : [],
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/catalog/${product.slug}`,
    },
  };
}
```

### 3. Sitemap

```typescript
// src/frontend/app/sitemap.ts
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const apiUrl  = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '';

  const res = await fetch(`${apiUrl}/catalog/products`, { next: { revalidate: 3600 } });
  const products = res.ok ? await res.json() : [];

  const productUrls = (products as Array<{ slug: string; updatedAt: string }>)
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${baseUrl}/catalog/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/catalog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...productUrls,
  ];
}
```

Next.js 15 exporta el archivo `sitemap.ts` desde `app/` y lo sirve en la ruta `/sitemap.xml` automáticamente.

### 4. Canonical URL

Agregar `metadataBase` en el layout raíz para que Next.js resuelva URLs relativas en OG tags:

```typescript
// src/frontend/app/layout.tsx — agregar en el export de metadata existente
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  // ...
};
```

### 5. Robots.txt

Agregar `src/frontend/app/robots.ts` (opcional pero recomendado para SEO):

```typescript
import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
```

### 6. Sin cambios en backend

El catálogo ya expone `GET /catalog/products` con `status: ACTIVE`. El sitemap lo consume server-side (ISR, revalidate 1h). No se necesita un endpoint dedicado.
