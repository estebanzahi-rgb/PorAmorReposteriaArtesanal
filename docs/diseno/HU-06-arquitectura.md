# Arquitectura HU-06 — Subida de imágenes

## Auditoría de código existente

| Artefacto | Ubicación | Estado |
|---|---|---|
| Campo `images String[]` en `Product` | `src/backend/prisma/schema.prisma` | Existe — ya almacena URLs de imágenes |
| `UpdateProductDto` | `src/backend/src/catalog/interfaces/http/dtos/update-product.dto.ts` | Existe — ya acepta `images: string[]` |
| Panel admin de productos | `src/frontend/app/admin/...` (inferido) | Existe — integrar uploader |
| Route Handlers Next.js | En uso en el proyecto | Patrón disponible |

No existe lógica de upload. Las imágenes actualmente deben cargarse como URLs externas. No se necesitan cambios en el backend NestJS.

---

## Cambios al schema Prisma

Ninguno. El campo `images String[]` ya existe en `Product`.

---

## Nuevas entidades / Value Objects

Ninguna (implementación en capa de infraestructura del frontend).

---

## Ports nuevos o modificados

Ninguno en backend. La lógica de upload reside completamente en el Route Handler de Next.js.

---

## Estructura de carpetas

```
src/frontend/
  app/
    api/
      admin/
        upload-image/
          route.ts                          ← NUEVO — POST /api/admin/upload-image
  components/admin/
    ImageUploader.tsx                       ← NUEVO — Client Component con drag-and-drop
  lib/
    cloudinary.ts                           ← NUEVO — helper para signed upload params
```

---

## Variables de entorno nuevas

Estas variables van en Vercel (frontend), lado servidor — **sin prefijo `NEXT_PUBLIC_`**:

| Variable | Dónde | Descripción | Ejemplo |
|---|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | Vercel (server-side) | Nombre del cloud Cloudinary | `mi-cloud-name` |
| `CLOUDINARY_API_KEY` | Vercel (server-side) | API Key de Cloudinary | `123456789012345` — desde Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | Vercel (server-side) | API Secret de Cloudinary | `abcdefghijklmnopqrstuvwxyz12` — nunca exponer en cliente |

---

## Notas de implementación

### 1. Flujo de upload — Signed Upload desde Route Handler

El flujo usa **signed upload directo a Cloudinary** para evitar pasar el API Secret al cliente:

```
Client (ImageUploader)
  1. POST /api/admin/upload-image  { filename, content_type }
  ← { signature, timestamp, api_key, cloud_name, upload_url }
  
  2. POST https://api.cloudinary.com/v1_1/{cloud_name}/image/upload
     (multipart con los params firmados + el archivo)
  ← { secure_url }
  
  3. La URL se agrega al array images[] del producto en el form
```

### 2. Route Handler — generación de firma

```typescript
// src/frontend/app/api/admin/upload-image/route.ts
import { createHash, createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cloudName  = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey     = process.env.CLOUDINARY_API_KEY!;
  const apiSecret  = process.env.CLOUDINARY_API_SECRET!;

  const timestamp  = Math.round(Date.now() / 1000);
  const folder     = 'poramor/products';

  // Parámetros a firmar — deben estar en orden alfabético
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash('sha256')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  return NextResponse.json({
    signature,
    timestamp,
    api_key: apiKey,
    cloud_name: cloudName,
    folder,
    upload_url: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  });
}
```

### 3. Carpeta de destino

Todas las imágenes de productos se suben a `poramor/products/`. El `secure_url` resultante se almacena directamente en `images[]`.

### 4. ImageUploader Component

```typescript
// src/frontend/components/admin/ImageUploader.tsx — Client Component
// Acepta { onUpload: (url: string) => void }
// 1. Muestra input file o zona drag-and-drop
// 2. Al seleccionar archivo: llama POST /api/admin/upload-image para obtener firma
// 3. Hace POST directo a Cloudinary con FormData (file + signature + timestamp + ...)
// 4. Llama onUpload(secure_url) con la URL resultante
// Estado de carga: spinner durante el upload
```

### 5. Restricciones del plan free Cloudinary

- 25 créditos/mes (cada upload consume ~1 crédito)
- Storage: 25 GB
- Para el tamaño del catálogo (decenas de productos) es más que suficiente

### 6. Transformaciones de imagen

En el `secure_url` se puede agregar transformaciones de Cloudinary para servir imágenes optimizadas:
```
https://res.cloudinary.com/{cloud}/image/upload/w_800,f_auto,q_auto/poramor/products/{public_id}
```
Esto se puede hacer en el componente `<Image>` de Next.js al mostrar las imágenes.

### 7. Sin cambios en el backend NestJS

El backend ya acepta `images: string[]` en el DTO de actualización de producto. El frontend solo necesita agregar la URL de Cloudinary al array antes de enviar el formulario de edición.
