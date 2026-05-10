# Historias de Usuario — PorAmor Repostería Artesanal

## Estados posibles de una HU

| Estado | Descripción |
|---|---|
| `PENDIENTE APROBACIÓN` | Redactada por el PO, esperando validación del Arquitecto |
| `APROBADA` | Validada y lista para diseño/construcción |
| `EN DESARROLLO` | El Desarrollador está implementando la HU |
| `EN REVISIÓN QA` | El QA está validando la implementación |
| `COMPLETADA` | Implementada, probada y desplegada |
| `BLOQUEADA` | Tiene dependencias sin resolver |
| `DESCARTADA` | Fuera de alcance — conservada por trazabilidad |

## Índice de Epics e Historias de Usuario

### EPIC 0 — Autenticación de Usuario
> Google OAuth. Login requerido solo para checkout. Carrito y catálogo son públicos.

| ID | Historia | Estado |
|---|---|---|
| HU-001 | Iniciar sesión con Google | APROBADA |
| HU-002 | Cerrar sesión / gestión de sesión | APROBADA |
| HU-003 | Protección de rutas para usuarios no autenticados | APROBADA |

### EPIC 1 — Catálogo de Productos
> Exploración pública. Incluye el configurador de tortas (tamaño, sabor, relleno, cubierta, mensaje, dibujo, topper).

| ID | Historia | Estado |
|---|---|---|
| HU-004 | Explorar catálogo con categorías y búsqueda | APROBADA |
| HU-005 | Ver detalle de producto con variantes simples (ej. trufas) | APROBADA |
| HU-006 | Configurar torta personalizada | APROBADA |

### EPIC 2 — Carrito de Compras
> Carrito anónimo (localStorage) que se fusiona al autenticarse.

| ID | Historia | Estado |
|---|---|---|
| HU-007 | Agregar producto / configuración al carrito | APROBADA |
| HU-008 | Ver y gestionar carrito (cantidades, eliminar) | APROBADA |
| HU-009 | Fusionar carrito anónimo con carrito del usuario al autenticarse | APROBADA |

### EPIC 3 — Checkout
> Requiere autenticación. Incluye tipo de entrega (recogida / domicilio con costo extra).

| ID | Historia | Estado |
|---|---|---|
| HU-010 | Ingresar datos del cliente y elegir tipo de entrega | APROBADA |
| HU-011 | Ver resumen del pedido antes de pagar | APROBADA |

### EPIC 4 — Pagos (Mock)
> PSE / Tarjeta / MercadoPago. Mocks que aprueban cualquier transacción en esta fase.

| ID | Historia | Estado |
|---|---|---|
| HU-012 | Seleccionar método de pago | APROBADA |
| HU-013 | Procesar pago mock y confirmar pedido | APROBADA |

### EPIC 5 — Notificaciones
> Email a la dueña + link WhatsApp generado al confirmar pedido.

| ID | Historia | Estado |
|---|---|---|
| HU-014 | Enviar email a la dueña al recibir un pedido | APROBADA |
| HU-015 | Generar link WhatsApp con resumen del pedido | APROBADA |

### EPIC 6 — Admin: Autenticación
> Google OAuth restringido al correo autorizado de la dueña.

| ID | Historia | Estado |
|---|---|---|
| HU-016 | Acceso al panel de administración (Google cuenta autorizada) | APROBADA |

### EPIC 7 — Admin: Catálogo
> CRUD de productos. Gestión del configurador de tortas con precios por opción.

| ID | Historia | Estado |
|---|---|---|
| HU-017 | Crear y editar producto con variantes simples | APROBADA |
| HU-018 | Gestionar opciones del configurador de tortas con precios | APROBADA |
| HU-019 | Activar / desactivar producto del catálogo | APROBADA |

### EPIC 8 — Admin: Pedidos
> Ver pedidos, cambiar estados (máquina de estados), gestionar tarifa de domicilio.

| ID | Historia | Estado |
|---|---|---|
| HU-020 | Ver listado de pedidos con filtros | APROBADA |
| HU-021 | Actualizar estado de un pedido (máquina de estados) | APROBADA |
| HU-022 | Gestionar tarifa de domicilio | APROBADA |

### EPIC 9 — Descuentos
> Descuento por producto (tiempo limitado), por cantidad, y cupones (% o valor fijo, uso único o múltiple).

| ID | Historia | Estado |
|---|---|---|
| HU-023 | Ver precios con descuento activo en catálogo y carrito | APROBADA |
| HU-024 | Aplicar cupón en el checkout | APROBADA |
| HU-025 | Cálculo y visualización del descuento en resumen del pedido | APROBADA |
| HU-026 | Admin — Crear descuento por producto (tiempo limitado) | APROBADA |
| HU-027 | Admin — Crear regla de descuento por cantidad | APROBADA |
| HU-028 | Admin — Gestionar cupones (crear, ver usos, anular) | APROBADA |

---

## Resumen

| Épica | HUs | Completadas |
|---|---|---|
| EPIC 0 — Autenticación | 3 | 3 |
| EPIC 1 — Catálogo | 3 | 3 |
| EPIC 2 — Carrito | 3 | 3 |
| EPIC 3 — Checkout | 2 | 2 |
| EPIC 4 — Pagos | 2 | 2 |
| EPIC 5 — Notificaciones | 2 | 2 |
| EPIC 6 — Admin Auth | 1 | 1 |
| EPIC 7 — Admin Catálogo | 3 | 3 |
| EPIC 8 — Admin Pedidos | 3 | 3 |
| EPIC 9 — Descuentos | 6 | 6 |
| **Total** | **28** | **28** |
