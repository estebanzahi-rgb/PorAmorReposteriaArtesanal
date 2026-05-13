# HU-06 — Carga de imágenes de productos desde el panel admin

**Como** administradora del negocio  
**Quiero** poder subir imágenes de productos directamente desde el panel de administración  
**Para** no depender de URLs externas y poder actualizar las fotos de los productos fácilmente desde el celular o computadora

---

## Criterios de Aceptación

### Escenario 1: La administradora sube una imagen válida para un producto
**Dado** que la administradora está en el formulario de edición del producto "Torta Red Velvet" en el panel admin  
**Cuando** selecciona un archivo `foto-torta.jpg` de 2 MB y hace clic en "Subir imagen"  
**Entonces** la imagen se sube al servicio de almacenamiento, la URL pública resultante se agrega al array `images` del producto, y la imagen aparece en la galería de imágenes del formulario de edición

### Escenario 2: La administradora intenta subir un archivo que no es imagen
**Dado** que la administradora está en el formulario de edición de un producto  
**Cuando** selecciona un archivo `catalogo.pdf` e intenta subirlo  
**Entonces** el sistema muestra el mensaje "Solo se permiten imágenes en formato JPG, PNG o WebP" y no realiza ninguna llamada al servicio de almacenamiento

### Escenario 3: La administradora intenta subir una imagen que supera el límite de tamaño
**Dado** que la administradora está en el formulario de edición de un producto  
**Cuando** selecciona un archivo `foto-hd.jpg` de 8 MB  
**Entonces** el sistema muestra el mensaje "La imagen no puede superar los 5 MB" antes de realizar ninguna petición al servidor

### Escenario 4: La administradora elimina una imagen existente del producto
**Dado** que el producto "Torta Red Velvet" tiene 2 imágenes en su galería  
**Cuando** la administradora hace clic en el botón de eliminar de la primera imagen y confirma la acción  
**Entonces** esa URL se elimina del array `images` del producto en la base de datos y la imagen desaparece de la galería en el formulario de edición

### Escenario 5: El servicio de almacenamiento falla durante la subida
**Dado** que el servicio de almacenamiento (Cloudinary) no responde  
**Cuando** la administradora intenta subir una imagen válida  
**Entonces** el sistema muestra el mensaje "Error al subir la imagen. Intenta nuevamente." y no modifica el array `images` del producto

---

## Edge Cases Identificados
- Un producto puede tener máximo 5 imágenes; si ya tiene 5, el botón "Subir imagen" aparece deshabilitado con el tooltip "Has alcanzado el límite de 5 imágenes por producto"
- La primera imagen del array `images` se usa como imagen principal/thumbnail en el catálogo y en Open Graph
- Los nombres de archivo se sanitizan antes de subirlos (eliminar caracteres especiales, espacios → guiones)
- El archivo se valida tanto en el cliente (MIME type y tamaño por UX) como en el servidor (por seguridad)

---

## Fuera de Alcance
- Reordenamiento de imágenes con drag & drop (la primera del array es la principal por convención)
- Recorte o redimensionamiento de imágenes en el cliente antes de subir
- Eliminación del archivo físico del servicio de almacenamiento al desvincularlo del producto (limpieza de archivos huérfanos)
- CDN personalizado o dominio propio para imágenes

---

## Definición de Done
- [ ] El formulario de edición de producto en el admin tiene un componente de carga de imágenes con botón "Subir imagen"
- [ ] Se valida tipo de archivo (JPG/PNG/WebP) y tamaño máximo (5 MB) en el cliente antes de hacer la petición
- [ ] La imagen se sube a Cloudinary (free tier) y la URL pública se agrega a `Product.images[]`
- [ ] La galería muestra las imágenes actuales del producto con botón de eliminar en cada una
- [ ] Al eliminar una imagen, la URL se remueve del array `images` en la base de datos
- [ ] El formulario deshabilita el botón de subida cuando el producto ya tiene 5 imágenes
- [ ] Las variables de entorno de Cloudinary están documentadas en `.env.example`
- [ ] Test de integración verifica que el adaptador de Cloudinary recibe el archivo y retorna la URL pública

---

## Revisión DoR (Refinador)

- ✅ 5 escenarios con datos concretos: nombre de archivo, tamaño en MB, mensaje de error exacto
- ✅ Límites concretos y verificables: 5 MB máximo, formatos JPG/PNG/WebP, máximo 5 imágenes
- ✅ Fuera de alcance bien delimitado (sin drag & drop, sin recorte, sin eliminación física)
- ✅ El Escenario 5 cubre la degradación ante fallo del servicio externo
- ✅ Sin dependencias bloqueantes con otras HUs del lote
- ✅ Implementable en menos de 5 días

---

## Notas de Arquitectura

- **Dominio:** `catalog` (extensión del caso de uso de edición de producto)
- **Entidades / VOs involucrados:** `Product` (Aggregate — campo `images: string[]` ya existe), `ProductImage` (Value Object — URL pública validada, no vacía)
- **Puerto de entrada:** `IUploadProductImageUseCase(productId: string, file: Buffer, mimeType: string, filename: string): Promise<string>` (retorna URL pública)
- **Puerto de salida:** `IImageStoragePort.upload(file: Buffer, filename: string, mimeType: string): Promise<string>`
- **Adaptador de salida:** `CloudinaryImageAdapter` en `catalog/infrastructure/adapters/`
- **Capa Next.js:** Client Component (file input o dropzone con preview) + API Route Handler (`/api/products/[id]/images` — método POST y DELETE). Se usa Route Handler y no Server Action para controlar el `Content-Type: multipart/form-data` y evitar el límite de 4 MB del body parser de Server Actions en Next.js 15.
- **Schema Prisma:** Sin cambios (`Product.images String[]` ya existe en el schema)
- **Variables de entorno nuevas:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Restricciones técnicas:**
  - **Estrategia de upload recomendada:** El backend NestJS genera una firma de upload (signed upload) para Cloudinary; el cliente Next.js sube el archivo directamente a Cloudinary usando esa firma. Esto evita que el archivo transite por los servidores de Render y Vercel, reduciendo latencia y consumo de bandwidth.
  - Si se usa upload desde el servidor NestJS: el archivo se recibe como `multipart/form-data` en el controller, se pasa como `Buffer` al UseCase, y el adaptador lo envía a Cloudinary via SDK (`cloudinary.uploader.upload_stream`)
  - La validación de tipo MIME en el servidor debe basarse en el magic number del buffer (primeros bytes del archivo), no en la extensión del nombre, para prevenir bypass de seguridad
  - Cloudinary free tier: 25 GB de almacenamiento + 25 GB de bandwidth/mes — suficiente para esta fase del proyecto

**Estado: APROBADA**
