# HU-05 — Configuración de antelación mínima para pedidos

**Como** administradora del negocio  
**Quiero** configurar cuántas horas de antelación mínima se necesitan para aceptar un pedido  
**Para** garantizar que haya tiempo suficiente para preparar los productos antes de la fecha de entrega solicitada por el cliente

---

## Criterios de Aceptación

### Escenario 1: La administradora actualiza la antelación mínima con un valor válido
**Dado** que la administradora está en la sección de "Configuración" del panel admin  
**Cuando** ingresa el valor "48" en el campo "Antelación mínima (horas)" y hace clic en "Guardar"  
**Entonces** el sistema persiste el nuevo valor y muestra el mensaje "Configuración guardada. Antelación mínima: 48 horas"

### Escenario 2: El cliente intenta seleccionar una fecha que no cumple la antelación mínima
**Dado** que la antelación mínima está configurada en 48 horas  
**Y** que la hora actual es el 2026-05-13 a las 10:00 hora Colombia (UTC-5)  
**Cuando** el cliente abre el selector de fecha en el checkout  
**Entonces** todas las fechas anteriores al 2026-05-15 aparecen deshabilitadas en el selector y el sistema muestra el mensaje "El primer día disponible para tu pedido es 15 may 2026"

### Escenario 3: El cliente selecciona una fecha que sí cumple la antelación mínima
**Dado** que la antelación mínima está configurada en 48 horas  
**Y** que la hora actual es el 2026-05-13 a las 10:00 hora Colombia  
**Cuando** el cliente selecciona la fecha 2026-05-16 en el checkout  
**Entonces** el sistema acepta la fecha y permite continuar con el proceso de confirmación del pedido

### Escenario 4: La administradora ingresa un valor de antelación fuera del rango permitido
**Dado** que la administradora está en la sección de "Configuración" del panel admin  
**Cuando** ingresa el valor "0" (o un número negativo o mayor a 720) en el campo de antelación mínima  
**Entonces** el sistema muestra el mensaje "La antelación mínima debe estar entre 1 y 720 horas" y no persiste el cambio

### Escenario 5: No hay configuración previa de antelación mínima (primera vez)
**Dado** que el sistema acaba de ser configurado y no existe ningún registro en `StoreSettings`  
**Cuando** un cliente accede al checkout  
**Entonces** el sistema aplica el valor por defecto de 24 horas para la antelación mínima y el selector de fecha deshabilita el día actual y el siguiente

---

## Edge Cases Identificados
- El cálculo de fecha mínima debe realizarse en hora de Colombia (UTC-5) para que el cliente vea fechas locales correctas
- El campo acepta solo números enteros positivos en el rango 1–720 (máximo 30 días)
- Si la administradora cambia el valor de antelación mientras un cliente está en el checkout, el checkout usa el valor que tenía al cargarse la página (sin revalidación en tiempo real)

---

## Fuera de Alcance
- Configuración de horarios de atención del negocio (días y horas hábiles) o días festivos bloqueados
- Límite de pedidos por día o franja horaria
- Antelación mínima diferente por categoría o tipo de producto
- Historial de cambios en la configuración de antelación

---

## Definición de Done
- [ ] Existe en el panel admin una sección de "Configuración" con el campo "Antelación mínima (horas)"
- [ ] El valor se persiste en la tabla `store_settings` de la base de datos y se recupera al recargar el panel
- [ ] El selector de fecha del checkout deshabilita las fechas que no cumplen la antelación mínima configurada
- [ ] Se usa el valor persistido en la base de datos, no un valor hardcodeado en el código
- [ ] La validación de rango (1–720) se aplica tanto en el frontend como en el backend
- [ ] Si no existe configuración, se usa el valor por defecto de 24 horas
- [ ] El mensaje de primer día disponible se muestra en el selector con fecha en formato "d MMM YYYY" en español
- [ ] Test unitario en dominio cubre el cálculo de fecha mínima dado un número X de horas de antelación
- [ ] Test E2E verifica que el checkout deshabilita fechas dentro del plazo mínimo

---

## Revisión DoR (Refinador)

- ✅ 5 escenarios incluyendo el caso de configuración inicial (Escenario 5)
- ✅ Fechas y horas concretas en Escenarios 2 y 3 (2026-05-13 10:00, resultado 2026-05-15)
- ✅ Mensajes exactos de error y confirmación definidos
- ✅ Rango válido (1–720) concreto y verificable
- ✅ Dependencia con HU-01 declarada explícitamente a continuación

**Dependencia declarada:** Esta HU extiende el comportamiento del selector de fecha introducido en HU-01. HU-01 debe estar implementada antes de iniciar el desarrollo de HU-05; el `DateTimePicker` del checkout debe aceptar una prop `minDate` que esta HU configura.

---

## Notas de Arquitectura

- **Dominio:** `store-config` (nuevo dominio de configuración del negocio)
- **Entidades / VOs involucrados:** `StoreSettings` (Aggregate Singleton — contiene `minLeadTimeHours: LeadTimeHours`), `LeadTimeHours` (Value Object — entero 1–720 con invariante de rango)
- **Puerto de entrada:** `IUpdateLeadTimeUseCase(hours: number, updatedBy: string): Promise<void>`, `IGetStoreSettingsUseCase(): Promise<StoreSettings>`
- **Puerto de salida:** `IStoreSettingsRepository.upsert(settings: StoreSettings): Promise<void>`, `IStoreSettingsRepository.find(): Promise<StoreSettings | null>`
- **Capa Next.js:** Server Action (guardar configuración desde admin) + Client Component (formulario admin con campo numérico y botón guardar) + lectura en Server Component del checkout (`/checkout/page.tsx`) para pasar `minLeadTimeHours` como prop al `DateTimePicker` Client Component
- **Schema Prisma:** Nuevo modelo (patrón Singleton — un único registro):
  ```prisma
  model StoreSettings {
    id               String   @id @default("singleton")
    minLeadTimeHours Int      @default(24)
    updatedAt        DateTime @updatedAt
    updatedBy        String   // email del admin que hizo el cambio

    @@map("store_settings")
  }
  ```
- **Variables de entorno nuevas:** Ninguna
- **Restricciones técnicas:**
  - El modelo `StoreSettings` usa `@id @default("singleton")` para garantizar que siempre exista un único registro; la operación de actualización usa `upsert` con `where: { id: "singleton" }`
  - La validación de fecha mínima en el checkout debe ocurrir también en el backend (Server Action de creación de pedido) para evitar bypass desde el cliente; el UseCase de `ICreateOrderUseCase` debe consultar `IGetStoreSettingsUseCase` antes de aceptar el `scheduledAt`
  - El cálculo de fecha mínima `minDate = new Date(Date.now() + hours * 60 * 60 * 1000)` debe operar en UTC y convertirse a `America/Bogota` en la UI
  - **Dependencia de implementación:** Requiere HU-01 implementada; el `DateTimePicker` debe recibir `minDate: Date` como prop

**Estado: APROBADA**
