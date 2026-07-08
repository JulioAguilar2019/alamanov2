# Módulo 5: Roadmap - MVP vs. Fase 2 (Innovaciones para LATAM)

Este módulo establece los alcances del **Mínimo Viable Producto (MVP)** necesario para el lanzamiento comercial rápido y las funcionalidades avanzadas de la **Fase 2** diseñadas para que la plataforma destaque e innove en El Salvador y la región de Centroamérica/LATAM.

---

## 1. Alcance del MVP (Fase de Lanzamiento)

El objetivo del MVP es lanzar la plataforma lo antes posible con las características core que solucionan la necesidad principal: conectar profesionales/técnicos con clientes finales.

### Funcionalidades Incluidas en el MVP
* **Puesta en Marcha:** Configuración de Next.js App Router, Tailwind CSS v4, base de datos en Supabase y subida de imágenes a Cloudinary.
* **Base de Datos Organizada:** Esquema relacional en inglés con categorías, subcategorías y perfiles.
* **Autenticación Esencial:** Registro y Login por correo y Google.
* **Onboarding del Profesional:** Formulario paso a paso para completar datos, seleccionar categorías, tarifas, subir fotos del portafolio (comprimidas localmente en el navegador) y seleccionar su ubicación (Departamento/Municipio de El Salvador).
* **Buscador y Marketplace:**
  * Filtro de precios con un Slider interactivo y dos inputs numéricos sincronizados a los extremos (Mín y Máx).
  * Filtro por categorías y subcategorías.
  * Geolocalización híbrida: Ordenamiento geográfico por cercanía si se habilitan permisos de GPS, y fallback por selección de municipio/departamento si no están activos.
* **Perfil Público Atractivo (Portafolio):** Vista premium con galería de imágenes Masonry, promedio de calificaciones y **CTAs directos como enlace de WhatsApp** y llamadas.
* **Monetización MVP:** Planes de destaques básicos integrados con el checkout de **Wompi**.

---

## 2. Fase 2: Innovación y Crecimiento (Diferenciadores Clave)

Para consolidar el liderazgo en El Salvador y expandirse por LATAM, implementaremos características avanzadas enfocadas en generar confianza, mejorar la experiencia de usuario y optimizar la conversión.

### Funcionalidades de la Fase 2

#### A. Mapa Interactivo de Profesionales (Geolocalización Visual)
* Integración de mapas interactivos usando **Leaflet** (código abierto) o **Mapbox**.
* Los clientes podrán ver un mapa de su zona con pines interactivos de los profesionales activos a su alrededor. Al hacer clic en un pin, se abrirá una tarjeta flotante con la foto, calificación y acceso directo al perfil del profesional.

#### B. Sistema de Verificación de Identidad (Confianza y Seguridad)
* **El Reto en LATAM:** La seguridad y desconfianza al contratar servicios a domicilio es un factor crítico.
* **La Solución:** Creación de un flujo de verificación de identidad (KYC simple). Los profesionales pueden subir una foto de su documento de identidad (ej. **DUI en El Salvador**, Cédula de Identidad en otros países).
* Una vez verificado por un administrador, el profesional obtiene una **insignia de "Identidad Verificada"** (Checkmark azul o verde), lo que aumentará su visibilidad y confianza de cara al cliente.

#### C. Chat Interno en Tiempo Real
* Canal de mensajería directo dentro de la plataforma utilizando **Supabase Realtime**.
* Los clientes podrán enviar mensajes, adjuntar fotos del problema (ej. una tubería rota) y negociar tarifas sin necesidad de compartir su número telefónico inmediatamente.

#### D. Aplicación Web Progresiva (PWA)
* Configuración del manifiesto de la aplicación y Service Workers.
* Permitirá a los profesionales y clientes instalar Alamanov en sus teléfonos directamente desde el navegador (sin pasar por las tiendas de aplicaciones App Store o Play Store).
* Habilita **notificaciones push en el móvil** para alertar al profesional cuando recibe un nuevo mensaje de chat o una nueva calificación.

#### E. Sistema de Reputación Avanzada
* Calificaciones detalladas por criterios (puntualidad, calidad del trabajo, precio razonable).
* Los clientes podrán subir fotos del "antes y después" del trabajo realizado al momento de escribir la reseña.
