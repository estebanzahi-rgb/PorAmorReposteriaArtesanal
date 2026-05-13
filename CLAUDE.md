# PorAmor Repostería Artesanal — Portal Web

## Contexto del equipo

Arquitecto AWS Associate con 14 años de experiencia en integraciones IBM.
Metodología: Clean Architecture + Domain-Driven Design (DDD).
El equipo opera como una célula de desarrollo senior con roles especializados.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Node.js + NestJS (TypeScript) |
| Frontend | Next.js 15 (App Router) + Tailwind CSS |
| Base de datos | PostgreSQL + Prisma ORM |
| Pruebas unitarias/integración | Vitest |
| Pruebas E2E | Playwright |
| Infraestructura | AWS CDK (Fargate + RDS) |
| Arquitectura | Hexagonal / Puertos y Adaptadores |

## Agentes disponibles

| Agente | Rol | Cuándo activarlo |
|---|---|---|
| `product-owner` | Define HUs con criterios Gherkin | Fase 1 — Definición |
| `refinador-hu` | Audita HUs contra el DoR antes de aprobarlas | Fase 1 — Refinamiento |
| `arquitecto` | Diseña contratos, estructura, interfaces. Revisa, aprueba y sincroniza cambios al repositorio (git → push) | Fase 2 — Diseño / Fase 3 — Gate de calidad y sync Git |
| `desarrollador-fullstack` | Implementa siguiendo HUs y diseño | Fase 3 — Construcción |
| `qa-engineer` | Estrategia de pruebas y cobertura | Fase 3 — Construcción |

## Fases de desarrollo

- **Fase 1 — Definición:** El PO transforma necesidades en HUs → Refinador valida DoR → Arquitecto valida viabilidad técnica → HU marcada APROBADA
- **Fase 2 — Diseño:** El Arquitecto define contratos de datos y estructura de carpetas
- **Fase 3 — Construcción:** Desarrollador + QA entregan código probado

## Pipeline autónomo de HUs (Fase 1)

```
PO redacta HU
     ↓
Refinador aplica DoR checklist → corrige issues
     ↓
Arquitecto valida viabilidad técnica → agrega Notas de Arquitectura
     ↓
HU marcada como APROBADA → guardada en archivo
     ↓
Siguiente HU (sin pausa para validación manual)
```

**Regla de oro:** No se avanza de Fase 1 a Fase 2 sin que todas las HUs estén APROBADAS.

## Criterios de done del agente QA

El agente `qa-engineer` **no puede reportar una tarea como completada** hasta cumplir todos estos puntos:

1. **Tests corriendo en verde** — Ejecutar `npx playwright test` y `npx vitest run` contra los servidores locales levantados. Cero fallos antes de entregar.
2. **Monitoreo de consola en cada test E2E** — Todo test que visita una página debe registrar errores de consola y de página:
   ```ts
   const errors: string[] = [];
   page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
   page.on('pageerror', (err) => errors.push(err.message));
   // ... al final:
   expect(errors.filter(e => !e.includes('chrome-extension'))).toHaveLength(0);
   ```
3. **Cobertura del golden path** — Siempre debe existir un test que navegue el flujo principal del negocio de extremo a extremo (catálogo → detalle de producto → agregar al carrito).
4. **Sin tests solo escritos** — Escribir un test sin haberlo visto pasar en verde no cuenta como entregado.

## Convenciones de código

- TypeScript estricto en todo el proyecto (`strict: true`)
- Nombres en inglés en el código; español en documentación y HUs
- Sin comentarios obvios; solo documentar invariantes de dominio y decisiones no evidentes
- Sin manejo de errores para escenarios imposibles
- Validar solo en bordes del sistema

## Estructura del proyecto

```
.claude/           → Agentes, comandos y configuración de Claude Code
docs/
  requisitos/      → Historias de Usuario aprobadas
  diseno/          → Contratos de datos, diagramas de arquitectura
  api/             → Especificaciones de endpoints
src/
  backend/         → NestJS — estructura hexagonal por dominio
  frontend/        → Next.js App Router
infra/             → AWS CDK stacks
```
