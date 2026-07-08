# Módulo 2: Autenticación, Onboarding y Gestión de Perfiles

Este módulo define los flujos de inicio de sesión, el asistente de registro paso a paso (onboarding) para profesionales, la compresión y carga de imágenes a Cloudinary, y la estructura de las vistas de perfil públicas optimizadas para SEO.

---

## 1. Autenticación con Supabase Auth

Implementaremos el sistema de login y registro utilizando `@supabase/ssr` en Next.js.

### Características del Sistema de Autenticación
* **Registro de Profesionales:** Requiere email y contraseña.
* **Inicio de Sesión Social:** Soporte para Google OAuth (ideal para facilidad de acceso en dispositivos móviles).
* **Middlewares:** Redirección automática si un usuario no autenticado intenta acceder a `/dashboard`, o si un usuario ya autenticado intenta ir a `/auth/login`.

---

## 2. Asistente de Registro (Onboarding Flow)

Para evitar la fricción, dividiremos el registro de un profesional en 4 pasos dinámicos e intuitivos:

### Paso 1: Información Profesional
* Campos básicos: Nombre completo, descripción de servicios/biografía corta, teléfono de contacto.
* Generación de enlace de WhatsApp automático: `https://wa.me/503XXXXXXXX` (anteponiendo el código de área del país si es necesario).

### Paso 2: Categorías y Tarifas
* Selección de categorías principales y múltiples subcategorías a las que aplica (ej. "Fontanería" y "Reparación de Fugas").
* Definición de tarifas: Inputs de Precio Mínimo (`min_price`) y Precio Máximo (`max_price`) por hora o por visita.

### Paso 3: Ubicación Geográfica (Híbrida)
* **Ubicación Administrativa:** Selects encadenados de Departamentos de El Salvador (ej. San Salvador, La Libertad) y Municipios/Distritos asociados.
* **Ubicación GPS:** Botón llamativo "Obtener mi ubicación actual" que utiliza la API del navegador:
  ```javascript
  navigator.geolocation.getCurrentPosition(
    (position) => {
      setCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    },
    (error) => console.log("Permiso denegado de geolocalización")
  );
  ```
  *Nota: Si el usuario deniega el permiso, se guardará únicamente su departamento y municipio.*

### Paso 4: Fotos de Portafolio y Perfil (Compresión Local)
* Selección de foto de perfil y hasta 5 fotos de trabajos anteriores.
* Antes de subir a Cloudinary, el navegador ejecuta `compressLocalImage(file)`.
* Las imágenes optimizadas se envían al servidor y se cargan a Cloudinary usando un API Route o firmas de subida segura, guardando las URLs en Supabase (`avatar_url` y `portfolio_items`).

---

## 3. Dashboard del Profesional (`/dashboard`)

Una interfaz privada con diseño minimalista oscuro o premium que permite:
* **Editar Perfil:** Actualizar descripción, teléfono, tarifas y redes sociales.
* **Gestionar Ubicación:** Cambiar municipio o actualizar coordenadas GPS.
* **Administrar Portafolio:** Subir nuevas fotos (comprimidas localmente) o borrar trabajos antiguos.
* **Métricas Simples:** Total de visitas a su perfil y clics en el botón de WhatsApp (registrado mediante un evento onClick en la base de datos).

---

## 4. Perfil Público Portafolio (`/profesionales/[slug]`)

La carta de presentación del profesional ante los clientes. Debe ser visualmente deslumbrante (glassmorphism, animaciones fluidas) y optimizada para SEO.

### Elementos Clave
* **Galería del Portafolio:** Visualizador de imágenes en cuadrícula estilo Masonry, con lightbox interactivo.
* **CTAs de Alta Conversión:**
  * Botón flotante persistente de "Contactar por WhatsApp" (ícono de WhatsApp en verde brillante con animación de pulso).
  * Botones secundarios para llamadas directas y redes sociales (Facebook, Instagram, LinkedIn).
* **Calificaciones y Reseñas:**
  * Visualización de estrellas (rating promedio).
  * Formulario rápido para que los clientes dejen una reseña.
* **Optimización SEO:**
  * URLs amigables: `/profesionales/juan-perez-plomero`.
  * Metadatos dinámicos estructurados con Schema.org en formato JSON-LD para que Google lo indexe como `LocalBusiness` o `ProfessionalService`:
    ```json
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Juan Pérez - Plomería El Salvador",
      "image": "url_de_cloudinary",
      "telephone": "+50370000000",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "San Salvador",
        "addressCountry": "SV"
      }
    }
    ```
