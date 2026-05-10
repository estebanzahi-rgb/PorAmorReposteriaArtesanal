# Stack y Variables de Entorno

## Stack definitivo

| Capa | Tecnología | Versión mínima |
|---|---|---|
| Backend framework | NestJS | 10.x |
| Lenguaje | TypeScript | 5.x (strict: true) |
| ORM | Prisma | 5.x |
| Base de datos | PostgreSQL | 15.x |
| Frontend framework | Next.js (App Router) | 15.x |
| Estilos | Tailwind CSS | 3.x |
| Componentes UI | shadcn/ui | latest |
| Autenticación | NextAuth.js v5 (Auth.js) | 5.x |
| Email | Resend | latest |
| Testing unitario | Vitest | latest |
| Testing E2E | Playwright | latest |
| Infraestructura | AWS CDK | 2.x |

## Variables de entorno requeridas

### Backend (`src/backend/.env`)
```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/poramor"

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Admin
ADMIN_EMAILS="duena@gmail.com"   # separados por coma si hay varios

# Notificaciones
OWNER_EMAIL="duena@gmail.com"
OWNER_WHATSAPP="573001234567"    # sin + ni espacios
RESEND_API_KEY=""

# App
NODE_ENV="development"
PORT=3001
JWT_SECRET=""                     # para firmar sesiones
```

### Frontend (`src/frontend/.env.local`)
```env
# API Backend
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Google OAuth (NextAuth)
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
AUTH_SECRET=""                    # openssl rand -base64 32

# Admin
ADMIN_EMAILS="duena@gmail.com"

# App
NEXTAUTH_URL="http://localhost:3000"
```

## Puertos por defecto (desarrollo local)
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- PostgreSQL: `localhost:5432`
