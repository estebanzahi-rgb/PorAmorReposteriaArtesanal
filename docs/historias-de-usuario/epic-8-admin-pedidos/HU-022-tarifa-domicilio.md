# HU-022: Gestionar tarifa de domicilio

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-022 |
| **Epic** | EPIC 8 — Admin: Pedidos |
| **Estado** | APROBADA |
| **Prioridad** | Media |
| **Dependencias** | HU-016 |
| **Bloquea** | HU-010 |

## Descripción

Yo como **administradora** quiero **configurar la tarifa de domicilio que se cobra a los clientes** para **ajustar los costos de entrega cuando sea necesario**.

## Notas de Arquitectura

- **Dominio:** Order / Delivery
- **Entidades / VOs involucrados:** `DeliveryRate { id, amount: number, updatedAt, updatedBy }`
- **Puerto de entrada:** `UpdateDeliveryRateUseCase(amount: number)`
- **Puerto de salida:** `DeliveryRateRepository.save(rate)`
- **Capa Next.js:** Server Action desde la pantalla de configuración del admin
- **Restricciones técnicas:** Existe exactamente un registro de `DeliveryRate` en la base de datos (upsert). La nueva tarifa aplica solo a pedidos futuros — los `OrderSummary` ya generados mantienen el valor con el que fueron creados. `amount >= 0` (puede ser 0 si el domicilio es gratis temporalmente).

## Criterios de Aceptación

### Escenario 1: Ver tarifa de domicilio actual

```gherkin
Dado que estoy en /admin/configuracion
Cuando la página carga
Entonces veo la tarifa de domicilio actual con el valor y la fecha de la última actualización
```

### Escenario 2: Actualizar tarifa de domicilio

```gherkin
Dado que la tarifa actual es $8.000
Cuando ingreso el nuevo valor $10.000 y hago clic en "Guardar"
Entonces la tarifa se actualiza a $10.000
Y veo la confirmación: "Tarifa de domicilio actualizada correctamente"
Y los nuevos pedidos que elijan domicilio verán la tarifa de $10.000
```

### Escenario 3: Nueva tarifa no afecta pedidos existentes

```gherkin
Dado que el pedido PAM-2026-0001 fue creado con tarifa de domicilio $8.000
Cuando actualizo la tarifa a $10.000
Entonces el pedido PAM-2026-0001 sigue mostrando $8.000 de costo de domicilio
Y solo los pedidos creados después del cambio usan $10.000
```

### Escenario 4: Tarifa de domicilio en $0 (domicilio gratis temporalmente)

```gherkin
Dado que estoy en la configuración de tarifa
Cuando ingreso el valor $0 y guardo
Entonces la tarifa se actualiza a $0
Y en el checkout los clientes ven el domicilio como "Gratis"
```

## Edge Cases

- Valor negativo ingresado → mostrar error: "La tarifa no puede ser un valor negativo"
- Campo vacío al guardar → mostrar error: "Debes ingresar un valor para la tarifa"

## Fuera de alcance

- Tarifas por zona o distancia
- Tarifas diferenciadas por horario o día

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Escenario 3 explícito para no afectar pedidos existentes. Escenario 4 para $0 |
| 2026-05-08 | Arquitecto | Un solo registro DeliveryRate con upsert. Snapshot del valor en OrderSummary |
