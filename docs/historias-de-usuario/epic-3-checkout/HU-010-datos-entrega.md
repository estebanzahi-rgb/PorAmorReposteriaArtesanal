# HU-010: Ingresar datos del cliente y elegir tipo de entrega

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-010 |
| **Epic** | EPIC 3 — Checkout |
| **Estado** | APROBADA |
| **Prioridad** | Alta |
| **Dependencias** | HU-001, HU-008 |
| **Bloquea** | HU-011 |

## Descripción

Yo como **usuario autenticado con productos en el carrito** quiero **ingresar mis datos de contacto y elegir si recojo el pedido o requiero domicilio** para **que la repostería sepa cómo y dónde entregarme mi pedido**.

## Notas de Arquitectura

- **Dominio:** Order
- **Entidades / VOs involucrados:** `CustomerInfo { name, phone, email }`, `DeliveryType: enum(PICKUP | DELIVERY)`, `DeliveryAddress { street, city, notes? }`
- **Puerto de entrada:** `SaveCheckoutInfoUseCase(userId, customerInfo, deliveryInfo)`
- **Puerto de salida:** `OrderDraftRepository.save(draft)`
- **Capa Next.js:** Client Component con validación en tiempo real; Server Action para persistir
- **Restricciones técnicas:** El email se pre-rellena con el email de la cuenta Google (editable). El costo de domicilio se carga desde `DeliveryRateRepository` (configurable por el admin en HU-022). Si `deliveryType = PICKUP`, no se requiere dirección.

## Criterios de Aceptación

### Escenario 1: Ingresar datos de contacto con campos pre-rellenados

```gherkin
Dado que soy un usuario autenticado en /checkout
Cuando la página de datos carga
Entonces veo el campo "Email" pre-rellenado con mi correo de Google
Y los campos "Nombre completo" y "Teléfono" están vacíos y son obligatorios
```

### Escenario 2: Elegir tipo de entrega — Recogida en local

```gherkin
Dado que estoy completando el formulario de checkout
Cuando selecciono la opción "Recoger en el local"
Entonces el formulario de dirección no se muestra
Y el costo de envío en el resumen muestra $0
```

### Escenario 3: Elegir tipo de entrega — Domicilio

```gherkin
Dado que estoy completando el formulario de checkout
Cuando selecciono la opción "Envío a domicilio"
Entonces aparece el formulario de dirección con los campos: Dirección, Ciudad e Indicaciones opcionales
Y el costo de envío se muestra en el resumen con el valor configurado por el admin
```

### Escenario 4: Intentar continuar con campos obligatorios vacíos

```gherkin
Dado que estoy en el formulario de checkout
Y no he llenado el campo "Teléfono"
Cuando hago clic en "Continuar"
Entonces el campo "Teléfono" se resalta con el mensaje: "Este campo es obligatorio"
Y no avanzo al siguiente paso
```

### Escenario 5: Intentar continuar con domicilio sin ingresar dirección

```gherkin
Dado que seleccioné "Envío a domicilio"
Y no ingresé la dirección
Cuando hago clic en "Continuar"
Entonces el campo "Dirección" se resalta con el mensaje: "Este campo es obligatorio"
Y no avanzo al siguiente paso
```

## Edge Cases

- Teléfono con formato inválido → validar que sea un número colombiano (10 dígitos) antes de permitir continuar
- El admin actualizó la tarifa de domicilio mientras el usuario está en checkout → la tarifa mostrada no cambia hasta que el usuario recargue o vuelva a esta pantalla

## Fuera de alcance

- Múltiples direcciones guardadas por el usuario
- Cálculo de domicilio por zona o distancia (tarifa única configurable)
- Fecha y hora de entrega preferida

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenarios 4 y 5 separados. Mensajes de validación exactos |
| 2026-05-08 | Arquitecto | Email pre-rellenado desde cuenta Google documentado. Tarifa de domicilio como dependencia de HU-022 |
