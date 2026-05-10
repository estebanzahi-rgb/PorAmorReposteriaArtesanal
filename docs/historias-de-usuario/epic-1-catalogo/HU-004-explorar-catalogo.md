# HU-004: Explorar catálogo con categorías y búsqueda

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-004 |
| **Epic** | EPIC 1 — Catálogo de Productos |
| **Estado** | APROBADA |
| **Prioridad** | Alta |
| **Dependencias** | Ninguna |
| **Bloquea** | HU-005, HU-007 |

## Descripción

Yo como **visitante (autenticado o no)** quiero **explorar el catálogo de productos con filtros por categoría y búsqueda por nombre** para **encontrar rápidamente lo que busco**.

## Notas de Arquitectura

- **Dominio:** Catalog
- **Entidades / VOs involucrados:** `Product`, `Category`, `ProductVariant`
- **Puerto de entrada:** `GetProductsUseCase(filter?: { category?: string; search?: string }): Product[]`
- **Puerto de salida:** `ProductRepository.findAll(filter)`
- **Capa Next.js:** Server Component con parámetros de URL como filtros (`searchParams`)
- **Restricciones técnicas:** Los filtros se pasan como query params en la URL para permitir SSR y compartir links. Solo se muestran productos con `status = ACTIVE`.

## Criterios de Aceptación

### Escenario 1: Ver catálogo completo sin filtros

```gherkin
Dado que soy un visitante en /catalogo
Cuando la página carga
Entonces veo todos los productos activos agrupados por categoría
Y cada producto muestra nombre, imagen principal y precio base
Y los productos están ordenados por categoría
```

### Escenario 2: Filtrar por categoría

```gherkin
Dado que estoy en /catalogo
Cuando selecciono la categoría "Tortas"
Entonces solo veo los productos activos de la categoría "Tortas"
Y la URL cambia a /catalogo?categoria=tortas
Y el filtro "Tortas" aparece visualmente seleccionado
```

### Escenario 3: Buscar por nombre de producto

```gherkin
Dado que estoy en /catalogo
Cuando escribo "trufa" en el campo de búsqueda y confirmo
Entonces veo solo los productos cuyo nombre contiene "trufa"
Y la URL cambia a /catalogo?buscar=trufa
```

### Escenario 4: Búsqueda sin resultados

```gherkin
Dado que estoy en /catalogo
Cuando busco un término que no coincide con ningún producto activo
Entonces veo el mensaje: "No encontramos productos para tu búsqueda. Intenta con otro término."
Y veo un botón "Ver todos los productos"
Y al hacer clic en ese botón regreso al catálogo completo
```

### Escenario 5: Catálogo sin productos activos

```gherkin
Dado que no existen productos activos en el catálogo
Cuando accedo a /catalogo
Entonces veo el mensaje: "Pronto tendremos novedades. ¡Vuelve pronto!"
Y no se muestra ninguna tarjeta de producto
```

## Edge Cases

- Categoría inexistente en URL (`/catalogo?categoria=xyz`) → mostrar catálogo completo sin mostrar error al usuario
- Búsqueda con caracteres especiales o SQL-injection → sanitizar en el Use Case antes de consultar el repositorio
- Categoría con todos sus productos desactivados → no mostrar la sección de esa categoría

## Fuera de alcance

- Paginación (se evalúa cuando el catálogo supere 50 productos activos)
- Filtros por rango de precio
- Ordenamiento personalizado por el usuario

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Gherkin atómico verificado. Mensajes de UI exactos agregados |
| 2026-05-08 | Arquitecto | Notas de arquitectura agregadas. Restricción de `status = ACTIVE` documentada |
