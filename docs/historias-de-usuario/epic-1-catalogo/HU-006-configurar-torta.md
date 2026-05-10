# HU-006: Configurar torta personalizada

## Metadata

| Campo | Valor |
|---|---|
| **ID** | HU-006 |
| **Epic** | EPIC 1 — Catálogo de Productos |
| **Estado** | APROBADA |
| **Prioridad** | Alta |
| **Dependencias** | HU-004 |
| **Bloquea** | HU-007 |

## Descripción

Yo como **visitante (autenticado o no)** quiero **configurar una torta personalizada eligiendo tamaño, sabor, relleno, cubierta y extras opcionales** para **pedir exactamente la torta que imagino**.

## Notas de Arquitectura

- **Dominio:** Catalog
- **Entidades / VOs involucrados:** `CakeProduct`, `CakeOption { id, dimension, name, priceModifier: number, isActive: boolean }`, `CakeConfiguration { sizeId, flavorId, fillingId, toppingType, toppingDescription?, message?, drawing?, topperId? }`
- **Puerto de entrada:** `GetCakeConfiguratorOptionsUseCase(): CakeConfiguratorOptions`
- **Puerto de salida:** `CakeOptionRepository.findAllActive()`
- **Capa Next.js:** Server Component para cargar opciones; Client Component para el configurador interactivo (precio reactivo)
- **Restricciones técnicas:**
  - Campos obligatorios: `sizeId`, `flavorId`, `fillingId`, `toppingType`
  - Si `toppingType = VINTAGE`, `toppingDescription` es obligatorio
  - Precio = `basePrice(size) + priceModifier(flavor) + priceModifier(filling) + priceModifier(topping) + price(topper?)`
  - `message` máximo 60 caracteres
  - La `CakeConfiguration` se serializa como JSON al agregarse al carrito

## Criterios de Aceptación

### Escenario 1: Completar configuración mínima obligatoria

```gherkin
Dado que estoy en la página del configurador de tortas
Cuando selecciono un tamaño, un sabor, un relleno y la cubierta "Naked Cake"
Entonces el precio total se actualiza en tiempo real reflejando las opciones elegidas
Y el botón "Agregar al carrito" está habilitado
```

### Escenario 2: Precio actualizado en tiempo real al cambiar opciones

```gherkin
Dado que estoy en el configurador con un tamaño seleccionado que muestra precio $X
Cuando cambio el sabor a una opción con modificador de precio adicional
Entonces el precio total se actualiza inmediatamente sin recargar la página
Y veo el desglose: precio base + modificadores activos
```

### Escenario 3: Seleccionar cubierta Vintage activa campo de descripción obligatorio

```gherkin
Dado que estoy configurando una torta con los campos obligatorios básicos completados
Cuando selecciono la cubierta "Vintage"
Entonces aparece un campo de texto "Describe los colores y estilo que deseas"
Y ese campo se marca como obligatorio
Y el botón "Agregar al carrito" permanece deshabilitado hasta que ese campo tenga contenido
```

### Escenario 4: Agregar topper suma su precio al total

```gherkin
Dado que tengo una configuración válida con precio $X
Cuando selecciono un topper con precio $T
Entonces el precio total pasa a ser $X + $T
Y el topper seleccionado se muestra en el resumen de la configuración
```

### Escenario 5: Intentar agregar al carrito sin completar campos obligatorios

```gherkin
Dado que estoy en el configurador
Y no he seleccionado todos los campos obligatorios (tamaño, sabor, relleno, cubierta)
Cuando intento hacer clic en "Agregar al carrito"
Entonces el botón permanece deshabilitado
Y los campos pendientes se resaltan visualmente indicando que son requeridos
```

### Escenario 6: Configuración completa con mensaje y dibujo

```gherkin
Dado que completé todos los campos obligatorios del configurador
Cuando escribo un mensaje de hasta 60 caracteres en el campo "Mensaje para la torta"
Y escribo una descripción en el campo "Dibujo simple"
Entonces ambos datos se incluyen en el resumen de la configuración
Y el precio no cambia por agregar mensaje o descripción de dibujo
```

## Edge Cases

- Mensaje con más de 60 caracteres → el campo debe truncar o bloquear la entrada en el carácter 60
- Opción desactivada por el admin mientras el usuario configura → recargar opciones y notificar: "Una opción que habías seleccionado ya no está disponible. Por favor revisa tu configuración."
- Sin toppers activos → ocultar sección de toppers completamente
- Todos los sabores tienen `priceModifier = 0` → mostrar precio base sin desglose adicional

## Fuera de alcance

- Subida de imagen de referencia para el dibujo (solo descripción de texto)
- Vista previa visual generada de la torta
- Configuración de más de un relleno por torta

## Historial de cambios

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-08 | PO | Creación inicial |
| 2026-05-08 | Refinador | Verificado: botón deshabilitado es observable. Escenarios atómicos. Límite de 60 chars en mensaje documentado |
| 2026-05-08 | Arquitecto | Notas de arquitectura agregadas. CakeConfiguration VO definido. Fórmula de precio y campos obligatorios documentados. Edge case de opción desactivada mid-flow agregado |
