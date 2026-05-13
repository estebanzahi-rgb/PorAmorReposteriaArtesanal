# HU-07 — Integración de Google Analytics 4

**Como** dueña del negocio  
**Quiero** tener Google Analytics 4 integrado en el portal  
**Para** conocer cuántos visitantes tiene el sitio, qué productos son los más vistos y qué porcentaje de visitantes inicia el proceso de compra

---

## Criterios de Aceptación

### Escenario 1: El script de GA4 se carga en todas las páginas públicas
**Dado** que la variable de entorno `NEXT_PUBLIC_GA_MEASUREMENT_ID` tiene el valor "G-XXXXXXXXXX"  
**Y** que un visitante accede a cualquier página pública del portal (home, catálogo, detalle de producto)  
**Cuando** la página termina de cargar  
**Entonces** el script `https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX` está presente en el DOM y el evento `page_view` queda registrado en GA4

### Escenario 2: Se registra el evento de vista de producto al navegar al detalle
**Dado** que el visitante navega a la página de detalle del producto "Torta de Chocolate" (precio base $45.000, categoría "Tortas")  
**Cuando** la página carga completamente  
**Entonces** GA4 registra el evento `view_item` con los parámetros: `item_id` (id del producto), `item_name` ("Torta de Chocolate"), `item_category` ("Tortas") y `value` (45000)

### Escenario 3: Se registra el evento de inicio de checkout
**Dado** que el visitante tiene artículos en el carrito con un total de $90.000 y navega a la página de checkout  
**Cuando** la página de checkout carga  
**Entonces** GA4 registra el evento `begin_checkout` con los parámetros: `value` (90000) y `currency` ("COP")

### Escenario 4: El script de GA no se carga cuando la variable de entorno no está definida
**Dado** que la variable de entorno `NEXT_PUBLIC_GA_MEASUREMENT_ID` está vacía o no está definida (entorno de desarrollo local)  
**Cuando** cualquier página pública carga  
**Entonces** el script de GA4 no se inyecta en el DOM y no se registra ningún evento (para no contaminar los datos reales con tráfico de desarrollo)

---

## Edge Cases Identificados
- El script de GA no debe bloquear el renderizado de la página; debe cargarse con `strategy="afterInteractive"` de `next/script`
- Si el usuario tiene un bloqueador de anuncios (AdBlock, uBlock), el script no cargará — comportamiento esperado, no es un error de la aplicación
- Los eventos de GA no son visibles en tiempo real en el panel de GA4 estándar; puede haber latencia de hasta 24–48 horas en los reportes (excepto en el modo de depuración de GA4)
- Los eventos `view_item` y `begin_checkout` solo deben dispararse una vez por carga de página, no en re-renders del componente

---

## Fuera de Alcance
- Eventos de e-commerce extendidos: `add_to_cart`, `remove_from_cart`, `purchase`
- Google Tag Manager (se usa gtag directo en esta fase)
- Gestión de consentimiento de cookies conforme a GDPR/CCPA (no aplica en Colombia en esta fase)
- Dashboards o reportes personalizados dentro de la aplicación
- Conversiones de pago completado (`purchase` event)

---

## Definición de Done
- [ ] El script de GA4 se carga en todas las páginas públicas con `strategy="afterInteractive"`
- [ ] El evento `page_view` se registra automáticamente en cada navegación entre páginas (incluyendo navegación client-side de Next.js)
- [ ] El evento `view_item` se dispara en la página de detalle de producto con los parámetros: `item_id`, `item_name`, `item_category`, `value`
- [ ] El evento `begin_checkout` se dispara cuando el usuario llega a la página de checkout con `value` y `currency: "COP"`
- [ ] El script NO se inyecta en el DOM cuando `NEXT_PUBLIC_GA_MEASUREMENT_ID` está vacío o undefined
- [ ] La variable `NEXT_PUBLIC_GA_MEASUREMENT_ID` está documentada en `.env.example`

---

## Revisión DoR (Refinador)

- ✅ 4 escenarios concretos incluyendo el caso de ausencia de la variable de entorno (Escenario 4)
- ✅ Parámetros exactos de los eventos GA4 especificados con valores de ejemplo ($45.000, $90.000, "COP")
- ✅ Sin dependencias bloqueantes con otras HUs del lote
- ✅ Fuera de alcance delimita correctamente (sin GTM, sin GDPR, sin evento `purchase`)
- ✅ Implementable en menos de 3 días

---

## Notas de Arquitectura

- **Dominio:** N/A — funcionalidad de tracking de presentación sin lógica de negocio
- **Entidades / VOs involucrados:** N/A
- **Puerto de entrada:** N/A
- **Puerto de salida:** N/A
- **Capa Next.js:** Client Components exclusivamente:
  - Componente `GoogleAnalytics` en `app/layout.tsx` usando `next/script` con `strategy="afterInteractive"` e inicialización de `gtag`
  - Hook `useGA4PageView()` para registrar `page_view` en navegaciones client-side (escucha cambios de `pathname` del router)
  - Llamadas directas a `window.gtag('event', ...)` en `useEffect` dentro de los componentes de detalle de producto y checkout
- **Schema Prisma:** Sin cambios
- **Variables de entorno nuevas:** `NEXT_PUBLIC_GA_MEASUREMENT_ID` (ej. `G-XXXXXXXXXX`)
- **Restricciones técnicas:**
  - En Next.js 15 App Router con Server Components, el componente `GoogleAnalytics` debe tener la directiva `'use client'` ya que accede a `window.gtag`
  - Llamadas a `window.gtag()` deben ir envueltas en un guard `typeof window !== 'undefined'` para prevenir errores de SSR
  - Los eventos `view_item` y `begin_checkout` deben dispararse con `useEffect(() => { ... }, [])` (array vacío) para ejecutarse una sola vez después del montaje, no en cada re-render
  - El evento `page_view` en Next.js App Router no se dispara automáticamente en navegaciones client-side con el script de gtag estándar; se necesita un listener de `pathname` con `usePathname()` del router para dispararlo manualmente en cada cambio de ruta

**Estado: APROBADA**
