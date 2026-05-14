# ADR-003: Layout dual para tablas admin — cards en móvil, tabla en desktop

## Estado
Adoptado — 2026-05-13

## Contexto

Las tablas de administración (pedidos, productos, etc.) tienen muchas columnas. En pantallas móviles, el patrón `overflow-x: auto` obliga al usuario a hacer scroll horizontal, lo que es no intuitivo en touch — los usuarios simplemente no descubren que pueden deslizar, y la columna de acciones queda fuera de pantalla.

## Decisión

Toda tabla de administración con 4+ columnas usa **layout dual**:

- **Móvil** (`md:hidden`): lista de cards. Cada card muestra los datos más relevantes en stacking vertical y termina con un botón de acción a ancho completo.
- **Desktop** (`hidden md:block`): tabla tradicional con todas las columnas.

```tsx
{/* Mobile — cards */}
<div className="md:hidden space-y-3">
  {items.map((item) => (
    <div key={item.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
      {/* campos clave en 2 columnas */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono font-semibold text-sm">{item.identifier}</p>
          <p className="text-xs text-muted-foreground">{item.date}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      {/* acción principal a ancho completo */}
      <Link href={`/admin/.../${item.id}`} className="block w-full text-center ...">
        Ver detalle →
      </Link>
    </div>
  ))}
</div>

{/* Desktop — table */}
<div className="hidden md:block overflow-x-auto">
  <table className="w-full text-sm">
    ...
  </table>
</div>
```

## Consecuencias

**Positivas:**
- La acción principal siempre es visible en móvil sin necesidad de descubrir el scroll.
- El layout de cards es más legible en pantallas pequeñas.
- La tabla desktop mantiene la densidad de información para trabajo en escritorio.

**Negativas:**
- Duplica el markup (dos bloques HTML para el mismo dato).
- Al agregar una columna nueva a la tabla, hay que recordar actualizar también el card móvil.

## Campos recomendados en el card móvil

No mostrar todas las columnas en el card — solo las 3-4 más relevantes para la acción:
1. Identificador principal (número de pedido, nombre de producto, etc.)
2. Estado con badge de color
3. Dato de negocio clave (cliente, total, categoría)
4. Fecha (texto pequeño)
5. Botón de acción a `w-full`

## Aplicación en nuevas tiendas

Este patrón aplica en todas las páginas de listado admin:
- `/admin/pedidos`
- `/admin/catalogo`
- `/admin/cupones`
- Cualquier nueva sección admin con listados
