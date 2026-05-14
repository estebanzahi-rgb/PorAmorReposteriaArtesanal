# ADR-001: Patrón isMerging — Prevenir race condition entre merge de carrito y carga de checkout

## Estado
Adoptado — 2026-05-13

## Contexto

Cuando un usuario no autenticado agrega productos al carrito anónimo (localStorage) y luego navega a `/checkout`, el middleware lo redirige a login. Después del callback OAuth, el usuario llega de vuelta a `/checkout`.

En ese momento ocurren dos efectos React simultáneamente:
- `CartProvider.useEffect` detecta la sesión nueva → llama `POST /cart/merge`
- `CheckoutPage.useEffect` detecta la sesión nueva → llama `GET /cart`

Si `GET /cart` resuelve antes que `POST /cart/merge`, el checkout recibe el carrito vacío y muestra "Tu carrito está vacío", perdiendo los productos que el usuario seleccionó antes del login.

## Decisión

`CartProvider` expone un flag `isMerging: boolean` a través del contexto.

- Se pone en `true` antes de llamar `POST /cart/merge`
- Se pone en `false` en el `finally` (tanto en éxito como en error)
- Un `useRef` actúa como mutex para prevenir merges simultáneos si el efecto se dispara más de una vez

`CheckoutPage` consume `isMerging` del contexto y espera a que sea `false` antes de lanzar `GET /cart`. El spinner de carga cubre también el estado `isMerging`.

```typescript
// cart-context.tsx
const [isMerging, setIsMerging] = useState(false);
const mergingRef = useRef(false);

if (anonItems.length > 0 && !mergingRef.current) {
  mergingRef.current = true;
  setIsMerging(true);
  apiFetch('/cart/merge', ...)
    .then(() => { clearAnonymousCart(); refresh(); })
    .catch(() => refresh())
    .finally(() => { mergingRef.current = false; setIsMerging(false); });
}

// checkout/page.tsx
const { isMerging } = useCart();
useEffect(() => {
  if (status !== 'loading' && !isMerging) load();
}, [session, status, isMerging]);

if (status === 'loading' || loading || isMerging) return <Spinner />;
```

## Consecuencias

**Positivas:**
- El checkout siempre recibe el carrito post-merge, nunca un estado intermedio vacío.
- El mutex `mergingRef` previene merges duplicados si el efecto se dispara múltiples veces.
- El usuario ve un spinner coherente durante todo el proceso de carga post-login.

**Negativas / Trade-offs:**
- El checkout depende implícitamente de `CartProvider`. Si `CartProvider` no está en el árbol de componentes, `isMerging` siempre será `false` y el comportamiento es correcto (no hay merge pendiente).
- El spinner de checkout puede durar un tick adicional si la merge es lenta.

## Alternativas descartadas

- **Merge en checkout page + no merge en CartProvider**: Crea doble responsabilidad y requiere importar `clearAnonymousCart` en dos lugares. El CartProvider ya es el dueño del estado del carrito.
- **Retry con sleep**: Frágil. No garantiza que el merge terminó, solo que pasó un tiempo arbitrario.
- **Server Action en callback OAuth**: Requiere acceso al localStorage desde el servidor, lo cual no es posible en el contexto del callback.

## Aplicación en nuevas tiendas

Este patrón aplica siempre que:
1. Haya carrito anónimo (localStorage) que se fusiona al login.
2. Haya una página de checkout que carga el carrito desde el backend.

Si se implementa una nueva tienda con este stack, **no eliminar `isMerging`** del contexto aunque parezca sobreingeniería — el bug es sutil y solo aparece bajo condiciones específicas de red.
