# HU-012: Seleccionar método de pago

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-012 |
| **Epic** | EPIC 4 — Pagos (Mock) |
| **Estado** | APROBADA |
| **Prioridad** | Alta |
| **Dependencias** | HU-011 |
| **Bloquea** | HU-013 |

## Descripción

Yo como **usuario autenticado con un resumen de pedido confirmado** quiero **elegir mi método de pago preferido entre PSE, tarjeta de crédito/débito o MercadoPago** para **completar mi compra con el medio que más me convenga**.

## Notas de Arquitectura

- **Dominio:** Payment
- **Entidades / VOs involucrados:** `PaymentMethod: enum(PSE | CARD | MERCADOPAGO)`, `PaymentIntent { orderId, method, amount }`
- **Puerto de entrada:** `SelectPaymentMethodUseCase(orderId, method: PaymentMethod)`
- **Puerto de salida:** `PaymentGatewayPort` (interfaz — implementada con mock en esta fase)
- **Capa Next.js:** Client Component
- **Restricciones técnicas:** En esta fase todos los métodos usan un `MockPaymentAdapter` que aprueba cualquier transacción. La interfaz `PaymentGatewayPort` está diseñada para ser reemplazada por adaptadores reales (PSE real, Stripe, MercadoPago SDK) en futuras iteraciones sin cambiar el Use Case.

## Criterios de Aceptación

### Escenario 1: Ver opciones de pago disponibles

```gherkin
Dado que estoy en la pantalla de pago con el resumen confirmado
Cuando la pantalla carga
Entonces veo tres opciones de pago: "PSE", "Tarjeta crédito/débito" y "MercadoPago"
Y ninguna opción está preseleccionada
Y el botón "Pagar" está deshabilitado hasta seleccionar una opción
```

### Escenario 2: Seleccionar PSE

```gherkin
Dado que estoy en la pantalla de pago
Cuando selecciono "PSE"
Entonces la opción PSE aparece visualmente seleccionada
Y el botón "Pagar $[total]" se habilita mostrando el monto total del pedido
```

### Escenario 3: Seleccionar Tarjeta crédito/débito

```gherkin
Dado que estoy en la pantalla de pago
Cuando selecciono "Tarjeta crédito/débito"
Entonces la opción Tarjeta aparece visualmente seleccionada
Y el botón "Pagar $[total]" se habilita
```

### Escenario 4: Seleccionar MercadoPago

```gherkin
Dado que estoy en la pantalla de pago
Cuando selecciono "MercadoPago"
Entonces la opción MercadoPago aparece visualmente seleccionada
Y el botón "Pagar $[total]" se habilita
```

### Escenario 5: Aplicar cupón antes de pagar

```gherkin
Dado que estoy en la pantalla de pago
Cuando ingreso un cupón válido en el campo "¿Tienes un cupón?"
Entonces el descuento del cupón se aplica al total
Y el botón "Pagar" muestra el monto actualizado con el descuento
```

## Edge Cases

- Usuario intenta enviar el pago sin seleccionar método → botón "Pagar" permanece deshabilitado
- El total del pedido cambia por un cupón → el `PaymentIntent` debe actualizarse con el nuevo monto antes de procesar

## Fuera de alcance

- Formulario de datos de tarjeta (en esta fase solo se selecciona el método, el mock aprueba directamente)
- Cuotas o diferidos
- Pagos parciales

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenario 1 separado de selección. Botón deshabilitado observable |
| 2026-05-08 | Arquitecto | Puerto PaymentGatewayPort documentado para reemplazabilidad futura. MockPaymentAdapter en esta fase |
