# HU-01 — Fecha y hora de entrega/recogida en el pedido

**Como** cliente  
**Quiero** indicar la fecha y hora en que recogeré o recibiré mi pedido durante el proceso de checkout  
**Para** que la repostería sepa cuándo preparar el pedido y lo tenga listo a tiempo

---

## Criterios de Aceptación

### Escenario 1: El cliente selecciona fecha y hora válidas para recogida
**Dado** que el cliente tiene artículos en el carrito y ha elegido el tipo de entrega "Recogida"  
**Cuando** el cliente selecciona una fecha futura válida y una franja horaria disponible en el checkout  
**Entonces** el sistema persiste la fecha y hora de recogida en el pedido y la muestra en el resumen del pedido confirmado

### Escenario 2: El cliente selecciona fecha y hora válidas para domicilio
**Dado** que el cliente tiene artículos en el carrito y ha elegido el tipo de entrega "Domicilio"  
**Cuando** el cliente selecciona una fecha futura válida y una franja horaria en el checkout  
**Entonces** el sistema persiste la fecha y hora de entrega en el pedido y la muestra en el resumen del pedido confirmado

### Escenario 3: El cliente intenta confirmar el checkout sin seleccionar fecha y hora
**Dado** que el cliente está en el paso de checkout y no ha seleccionado fecha ni hora de entrega  
**Cuando** el cliente hace clic en "Confirmar pedido"  
**Entonces** el sistema muestra el mensaje "Debes seleccionar una fecha y hora para tu pedido" y no avanza al paso de pago

### Escenario 4: El cliente intenta seleccionar una fecha pasada
**Dado** que el cliente está en el selector de fecha del checkout  
**Cuando** el cliente intenta seleccionar una fecha anterior a hoy (ej. ayer)  
**Entonces** esa fecha aparece deshabilitada en el selector y no puede ser elegida

### Escenario 5: La administradora visualiza la fecha de entrega en el panel admin
**Dado** que existe un pedido con fecha y hora de entrega registrada  
**Cuando** la administradora abre el detalle del pedido en el panel admin  
**Entonces** la fecha y hora de entrega se muestran de forma prominente en la vista de detalle del pedido

---

## Edge Cases Identificados
- Zona horaria: las fechas deben manejarse en hora de Colombia (UTC-5) en todo el sistema; el selector debe mostrar fechas en hora local del cliente
- El cliente cambia de "Recogida" a "Domicilio" después de haber seleccionado fecha: la fecha debe mantenerse; solo cambia el tipo de entrega
- Si el cliente recarga la página a mitad del checkout, la fecha seleccionada no debe perderse (persistir en estado de la UI)

---

## Fuera de Alcance
- Configuración de franjas horarias disponibles por parte del admin (tratado en HU-05)
- Validación de antelación mínima configurable (tratado en HU-05)
- Notificaciones de recordatorio al cliente antes de la fecha de entrega
- Límite de pedidos por día o franja horaria

---

## Definición de Done
- [ ] El campo `scheduledAt DateTime` existe en la tabla `orders` en la base de datos
- [ ] El checkout muestra un selector de fecha/hora obligatorio antes de confirmar el pedido
- [ ] No se puede confirmar el pedido sin fecha y hora seleccionadas; se muestra el mensaje definido
- [ ] Las fechas pasadas quedan deshabilitadas en el selector de fecha
- [ ] La fecha de entrega se muestra en el detalle del pedido en el panel admin
- [ ] La fecha de entrega se muestra en el resumen del pedido del cliente
- [ ] Tests E2E cubren el happy path completo de selección de fecha en checkout
- [ ] Tests unitarios cubren la validación de fecha futura en el Value Object del dominio

---

## Revisión DoR (Refinador)

- ✅ Tiene título claro y único
- ✅ Tiene descripción en formato "Yo como... quiero... para..."
- ✅ Tiene 5 escenarios Gherkin completos (2 happy paths, 2 edge cases de error, 1 vista admin)
- ✅ Cada Dado/Cuando/Entonces es concreto y verificable (no dice "el sistema responde correctamente")
- ✅ Tiene sección "Fuera de alcance" explícita; dependencias con HU-05 declaradas
- ✅ Criterios de done concretos con criterios de verificación en BD y UI
- ✅ No contradice HUs existentes; no genera ciclos de dependencia
- ✅ Implementable en menos de 5 días de desarrollo

---

## Notas de Arquitectura

- **Dominio:** `order`
- **Entidades / VOs involucrados:** `Order` (Aggregate — se extiende con `scheduledAt`), `ScheduledAt` (Value Object — encapsula `Date` en UTC con validación de fecha futura; expone `toColombiaTime(): Date`)
- **Puerto de entrada:** `ICreateOrderUseCase` (parámetros existentes + `scheduledAt: Date`)
- **Puerto de salida:** `IOrderRepository` (ya existe — requiere incluir `scheduledAt` en `save` y en la lectura del detalle de admin)
- **Capa Next.js:** Client Component (selector `DateTimePicker` en el checkout) + Server Action (persistencia del pedido incluye `scheduledAt`)
- **Schema Prisma:** Agregar campo al modelo `Order`:
  ```prisma
  scheduledAt DateTime  // fecha y hora de entrega/recogida, almacenada en UTC
  ```
  Nota de migración: la columna es NOT NULL. Si existen pedidos en producción, la migración manual debe proveer un valor default (ej. `DEFAULT NOW()`) que luego se elimina; seguir el protocolo de migraciones manuales en `docs/diseno/deployment.md`.
- **Variables de entorno nuevas:** Ninguna
- **Restricciones técnicas:**
  - El selector de fecha debe operar en zona horaria `America/Bogota` (UTC-5); usar `date-fns-tz` o `dayjs` con plugin `timezone` para evitar bugs en el cambio de día
  - La columna `scheduledAt` se almacena en UTC en PostgreSQL y se convierte a hora local solo en la capa de presentación
  - La validación de fecha futura debe ocurrir tanto en el cliente (UX) como en el servidor (invariante del Value Object `ScheduledAt`) para evitar bypass

**Estado: APROBADA**
