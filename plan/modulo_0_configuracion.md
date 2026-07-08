# Módulo 0: Configuración Inicial del Proyecto

Este módulo define los pasos para preparar el entorno de desarrollo del proyecto **Alamanov2**, configurando las tecnologías clave: Next.js (App Router), Tailwind CSS v4, Supabase, Cloudinary y las bases para la integración de Wompi.

---

## 1. Stack Tecnológico y Dependencias

El proyecto se desarrolla con **Next.js 16 (App Router)**, **TypeScript** y **Tailwind CSS v4** (ya preinstalados).
Añadiremos las dependencias necesarias para las integraciones y utilidades de la aplicación.

### Comando de Instalación
Ejecutar en la raíz del proyecto:
```bash
pnpm add @supabase/supabase-js @supabase/ssr lucide-react browser-image-compression
pnpm add -D @types/node @types/react @types/react-dom
```

* **`@supabase/supabase-js`** y **`@supabase/ssr`**: Para la comunicación con la base de datos y autenticación, tanto en Server Components como en Client Components.
* **`lucide-react`**: Set de iconos modernos y consistentes.
* **`browser-image-compression`**: Librería JS ejecutada en el cliente (navegador) para comprimir y reducir el tamaño de las imágenes antes de enviarlas a Cloudinary.

---

## 2. Estructura de Directorios

Mantendremos una arquitectura limpia y modular bajo la carpeta `/src`:

```text
/src
  /app                     # Rutas y layouts de Next.js
    /api                   # Endpoints de API (Wompi webhooks, etc.)
    /auth                  # Rutas de autenticación (login, register, onboarding)
    /dashboard             # Panel de control privado del profesional
    /profesionales         # Páginas públicas de portafolio (para SEO)
    /marketplace           # Buscador general y filtros
    layout.tsx             # Layout global
    page.tsx               # Landing page principal
  /components              # Componentes de React
    /ui                    # Elementos atómicos (Botones, Inputs, Sliders)
    /shared                # Componentes compartidos (Navbar, Footer, Card)
    /modules               # Componentes específicos de cada módulo
      /profile
      /marketplace
      /onboarding
  /hooks                   # Hooks personalizados (useAuth, useLocation)
  /lib                     # Utilidades y configuración de clientes de APIs
    supabase.ts            # Cliente Supabase
    cloudinary.ts          # Utilidades para subida a Cloudinary
    image-compression.ts   # Helper local para compresión de imágenes
    location-data.ts       # Datos estructurados de Departamentos y Municipios de El Salvador
  /types                   # Definiciones de TypeScript (.d.ts)
```

---

## 3. Variables de Entorno (`.env.local`)

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes claves:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Cloudinary Configuration (Solo para imágenes)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Wompi Configuration (Monetización en El Salvador)
NEXT_PUBLIC_WOMPI_PUBLIC_API_KEY=your-wompi-public-key
WOMPI_PRIVATE_API_KEY=your-wompi-private-key
WOMPI_WEBHOOK_SECRET=your-webhook-secret
```

---

## 4. Helper de Compresión Local de Imágenes

Para garantizar que el almacenamiento en Cloudinary no se sature y que las subidas sean ultrarrápidas, implementaremos un helper en `src/lib/image-compression.ts`. Este script se ejecutará del lado del cliente y se encargará de comprimir la imagen.

### Implementación Propuesta (`src/lib/image-compression.ts`)
```typescript
import imageCompression from 'browser-image-compression';

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

export async function compressLocalImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // Validar que sea estrictamente una imagen
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten archivos de imagen.');
  }

  const defaultOptions = {
    maxSizeMB: 0.8, // Límite objetivo de 800KB
    maxWidthOrHeight: 1200, // Redimensionar el lado más largo a 1200px máx
    useWebWorker: true,
  };

  const finalOptions = { ...defaultOptions, ...options };

  try {
    const compressedFile = await imageCompression(file, finalOptions);
    return compressedFile;
  } catch (error) {
    console.error('Error al comprimir la imagen de forma local:', error);
    return file; // Si falla, retorna el original como fallback
  }
}
```

---

## 5. Integración con Stitch para el Diseño UI/UX

Para asegurar una estética de alto nivel y consistente con las directrices de diseño premium:
1. Usaremos **Stitch** para prototipar las vistas principales de la aplicación:
   * Landing Page (Presentación de la plataforma y CTAs atractivos).
   * Perfil Portafolio (Sección biografía, galería de proyectos, enlaces de contacto y calificaciones).
   * Marketplace (Buscador, tarjetas de profesionales, filtros flotantes).
2. Se exportarán las variantes de diseño para el responsive móvil, dando prioridad absoluta a la experiencia en smartphones (donde se realiza el 85% de las búsquedas de servicios locales en LATAM).
