# Arquitectura HU-04 — Búsqueda en catálogo

## Auditoría de código existente

| Artefacto | Ubicación | Estado |
|---|---|---|
| Catalog page (lista de productos) | `src/frontend/app/(shop)/catalog/page.tsx` (inferido) | Existe — integrar SearchBar |
| Lista de productos (estado/prop) | En la catalog page actual | Existe — la búsqueda filtra sobre los datos ya cargados |
| `Product.generateSlug()` con normalización NFD | `src/backend/src/catalog/domain/entities/product.entity.ts` | Patrón de referencia — misma normalización en frontend |

No existe implementación de búsqueda previa. Implementación es puro frontend sin cambios en API.

---

## Cambios al schema Prisma

Ninguno.

---

## Nuevas entidades / Value Objects

Ninguna (implementación puramente frontend).

---

## Ports nuevos o modificados

Ninguno. La búsqueda opera sobre los datos ya cargados en la página del catálogo (Server Component pasa los productos como prop al Client Component de búsqueda).

---

## Estructura de carpetas

```
src/frontend/
  components/catalog/
    SearchBar.tsx                                  ← NUEVO — Client Component
  hooks/
    useProductSearch.ts                            ← NUEVO — lógica de filtrado con useMemo
  app/(shop)/catalog/
    page.tsx                                       ← MODIFICAR — pasar productos a SearchBar
```

---

## Variables de entorno nuevas

Ninguna.

---

## Notas de implementación

### 1. Arquitectura: Server Component + Client Component

La catalog page es un Server Component que fetcha los productos. Pasa el array `products` como prop al `SearchBar` (Client Component). De este modo el fetch SSR sigue siendo eficiente y la búsqueda es client-side.

```
CatalogPage (Server Component)
  └── SearchBar (Client Component, recibe products[])
        └── ProductGrid (puede ser Server o Client Component)
```

### 2. Hook useProductSearch

```typescript
// src/frontend/hooks/useProductSearch.ts
import { useMemo, useState } from 'react';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

export function useProductSearch<T extends { name: string; description: string; category?: { name: string } }>(
  products: T[],
) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return products;
    return products.filter((p) => {
      const target = normalize(`${p.name} ${p.description} ${p.category?.name ?? ''}`);
      return target.includes(q);
    });
  }, [query, products]);

  return { query, setQuery, filtered };
}
```

### 3. SearchBar Component

```typescript
// src/frontend/components/catalog/SearchBar.tsx
'use client';
import { useProductSearch } from '@/hooks/useProductSearch';

interface Props {
  products: ProductSummary[];
}

export function SearchBar({ products }: Props) {
  const { query, setQuery, filtered } = useProductSearch(products);
  return (
    <>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar productos..."
        aria-label="Buscar productos"
        className="..." // Tailwind
      />
      <ProductGrid products={filtered} />
    </>
  );
}
```

### 4. Sin paginación

El catálogo actual no está paginado. La búsqueda filtra sobre el array completo en memoria. Si el catálogo crece a más de 200 productos, se evaluará búsqueda server-side en una HU posterior.

### 5. Sin cambios en backend

No se agrega ningún endpoint ni parámetro de query en el backend. La API sigue respondiendo todos los productos activos en `GET /catalog/products`.

### 6. Accesibilidad

El input usa `role="search"` implícito (type="search") y el resultado incluye un `aria-live="polite"` con el conteo:
```html
<p aria-live="polite">{filtered.length} productos encontrados</p>
```
