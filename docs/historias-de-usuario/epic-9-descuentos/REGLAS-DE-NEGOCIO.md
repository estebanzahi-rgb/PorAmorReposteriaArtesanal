# Reglas de negocio — Descuentos

## Tipos de descuento

| Tipo | Quién lo activa | Sobre qué aplica | Configuración |
|---|---|---|---|
| Descuento por producto | Admin (fecha/periodo) | X% off un producto específico | Fecha inicio, fecha fin, porcentaje |
| Descuento por cantidad | Regla automática | X% off al comprar Y+ unidades del mismo producto | Cantidad mínima, porcentaje |
| Cupón | Admin genera, cliente ingresa código | % o valor fijo sobre el total del pedido | Código, tipo (% o valor), límite de usos (1 o N) |

## Reglas de aplicación por pedido

1. Solo puede aplicarse **1 descuento regular** por pedido (descuento por producto ó descuento por cantidad).
2. Si ambos aplican simultáneamente sobre el mismo producto, **gana el de mayor valor** y el sistema muestra una nota de aclaración al cliente:
   > *"Se aplicó el descuento de mayor valor disponible para este producto."*
3. Un **cupón siempre es adicional** al descuento regular — es el único caso donde pueden coexistir 2 descuentos en un pedido.
4. Los cupones pueden ser de **uso único** (se invalidan tras el primer uso) o de **múltiples usos** (el admin define el límite o lo deja ilimitado).

## Prioridad de cálculo en el checkout

```
Precio final = (precio base con descuento regular aplicado) - (valor del cupón si existe)
```

## Edge cases documentados

- Descuento por producto activo + regla de cantidad activa sobre mismo producto → aplica el mayor, muestra nota
- Cupón ya usado (uso único) → error: "Este cupón ya fue utilizado"
- Cupón expirado → error: "Este cupón no es válido o ha expirado"
- Cupón inválido → error: "El código ingresado no existe"
- Descuento de producto vence a medianoche y el cliente tiene el producto en el carrito → el descuento se recalcula al momento del checkout, no al momento de agregar al carrito
