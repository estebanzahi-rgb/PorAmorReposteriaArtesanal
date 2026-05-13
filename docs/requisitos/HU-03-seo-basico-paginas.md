# HU-03 — SEO básico en páginas públicas

**Como** dueña del negocio  
**Quiero** que las páginas públicas del portal tengan metadatos SEO correctos (título, descripción, Open Graph) y un sitemap XML generado automáticamente  
**Para** mejorar el posicionamiento del sitio en buscadores y que los enlaces compartidos en redes sociales se vean correctamente

---

## Criterios de Aceptación

### Escenario 1: La página de inicio tiene metadatos SEO correctos
**Dado** que un motor de búsqueda o usuario accede a la página de inicio del portal  
**Cuando** se analiza el `<head>` de la respuesta HTML renderizada en el servidor  
**Entonces** la página contiene: un `<title>` con el nombre del negocio y descripción breve, una `<meta name="description">` con al menos 120 caracteres, y las etiquetas `og:title`, `og:description`, `og:image` y `og:url` con valores no vacíos

### Escenario 2: La página de catálogo tiene metadatos SEO diferenciados
**Dado** que un motor de búsqueda accede a la página del catálogo `/catalogo`  
**Cuando** se analiza el `<head>` de la respuesta HTML  
**Entonces** la página tiene `<title>` y `<meta description>` distintos a los de la página de inicio, y las etiquetas Open Graph son específicas del catálogo

### Escenario 3: La página de detalle de producto tiene metadatos dinámicos basados en el producto
**Dado** que existe un producto activo con slug `torta-de-chocolate`, nombre "Torta de Chocolate", descripción de 150 caracteres e imagen principal  
**Cuando** se accede a `/catalogo/torta-de-chocolate`  
**Entonces** el `<title>` es "Torta de Chocolate — PorAmor Repostería Artesanal", la `<meta name="description">` contiene la descripción del producto (truncada a 160 caracteres si es más larga), y `og:image` apunta a la URL de la imagen principal del producto

### Escenario 4: El sitemap XML está disponible y contiene todas las URLs de productos activos
**Dado** que el portal tiene 12 productos con estado `ACTIVE`  
**Cuando** se accede a `/sitemap.xml`  
**Entonces** el archivo XML retorna HTTP 200 con `Content-Type: application/xml`, contiene las URLs de la página de inicio, del catálogo y de los 12 productos activos, y su estructura es válida según el protocolo sitemaps.org

### Escenario 5: La página de un producto inexistente retorna 404 sin metadatos de indexación
**Dado** que no existe ningún producto con slug `producto-que-no-existe`  
**Cuando** se accede a `/catalogo/producto-que-no-existe`  
**Entonces** la respuesta HTTP retorna código 404, la página contiene `<meta name="robots" content="noindex">` y no genera errores de renderizado en el servidor

---

## Edge Cases Identificados
- Productos sin imagen principal: `og:image` debe apuntar a una imagen de fallback estática del negocio (ej. `/images/og-fallback.jpg`)
- Caracteres especiales (tildes, ñ, &) en el nombre del producto deben codificarse correctamente como entidades HTML en los meta tags
- El sitemap excluye productos con estado `INACTIVE`
- Si la variable `NEXT_PUBLIC_SITE_URL` no está configurada, las URLs del sitemap y los OG tags no deben usar rutas relativas (retornar un error de build claro)

---

## Fuera de Alcance
- SEO para páginas del panel admin (privadas, deben tener `noindex` por defecto)
- SEO para páginas de checkout y carrito
- Schema markup estructurado (JSON-LD, rich snippets de productos)
- Robots.txt dinámico (el archivo estático `public/robots.txt` es suficiente en esta fase)
- Paginación del sitemap (para catálogos de más de 1000 productos)

---

## Definición de Done
- [ ] Las páginas home, catálogo y detalle de producto tienen `<title>` y `<meta description>` únicos entre sí
- [ ] Las tres páginas tienen tags Open Graph completos: `og:title`, `og:description`, `og:image`, `og:url`
- [ ] La ruta `/sitemap.xml` retorna XML válido que incluye todos los productos con estado `ACTIVE`
- [ ] Las páginas 404 de productos inexistentes retornan HTTP 404 con `<meta name="robots" content="noindex">`
- [ ] La imagen de fallback para `og:image` está definida y existe en `/public`
- [ ] La variable `NEXT_PUBLIC_SITE_URL` está documentada en `.env.example`
- [ ] Test E2E verifica la presencia de los meta tags clave en al menos la página de inicio y el detalle de un producto activo

---

## Revisión DoR (Refinador)

- ✅ 5 escenarios Gherkin con contexto concreto y resultado verificable
- ✅ Escenario 3 usa datos concretos: slug, nombre, descripción de 150 caracteres, formato exacto del título
- ✅ Escenario 5 cubre el caso de producto inexistente con HTTP 404 + noindex
- ✅ Fuera de alcance bien delimitado (admin, checkout, JSON-LD, robots.txt dinámico)
- ✅ Sin dependencias bloqueantes con otras HUs del lote
- ✅ Implementable en menos de 4 días (solo cambios en Next.js frontend)

---

## Notas de Arquitectura

- **Dominio:** N/A — funcionalidad de presentación pura sin lógica de negocio nueva en el backend
- **Entidades / VOs involucrados:** `Product` (lectura de campos existentes: `name`, `description`, `images`, `slug`, `status`)
- **Puerto de entrada:** N/A — se reutiliza el puerto de lectura de catálogo existente (`IGetProductBySlugUseCase`, `IListProductsUseCase`)
- **Puerto de salida:** N/A
- **Capa Next.js:** Server Components exclusivamente. La función `generateMetadata(params)` de Next.js 15 App Router se define en cada `page.tsx` pública. El sitemap se implementa en `app/sitemap.ts` como función async que retorna `MetadataRoute.Sitemap`.
- **Schema Prisma:** Sin cambios
- **Variables de entorno nuevas:** `NEXT_PUBLIC_SITE_URL` (ej. `https://poramorreposteria.com`) — requerida para construir URLs absolutas en OG tags y sitemap
- **Restricciones técnicas:**
  - `generateMetadata` en la página de detalle de producto realiza una llamada al backend para obtener el producto por slug; usar `fetch` con `next: { revalidate: 3600 }` (o `cache: 'force-cache'`) para no duplicar la request respecto al render de la página
  - El `app/sitemap.ts` debe hacer una única query de todos los productos activos con solo los campos `slug` y `updatedAt`; en catálogos futuros de más de 1000 productos se necesitará paginación del sitemap (deuda técnica a documentar)
  - Next.js 15 genera `sitemap.ts` y `generateMetadata` de forma nativa; no se necesita librería externa (ej. `next-seo`)
  - La descripción del producto debe truncarse a 160 caracteres para `<meta description>` y a 200 para `og:description`

**Estado: APROBADA**
