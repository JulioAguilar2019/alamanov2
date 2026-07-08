# Módulo 3: Marketplace, Buscador y Filtros Avanzados

Este módulo detalla la implementación de la interfaz de búsqueda de profesionales, los filtros avanzados (incluyendo el slider de precios e inputs vinculados), la ordenación geográfica y las rutas dinámicas optimizadas para el posicionamiento SEO.

---

## 1. Diseño de la Interfaz del Marketplace (`/marketplace`)

La interfaz tendrá un diseño moderno, responsive y de carga rápida (utilizando Next.js Server Components para la carga inicial y Client Components para los filtros interactivos).

### Secciones Principales
* **Barra de Búsqueda:** Input con autocompletado para profesiones, nombres o palabras clave (ej. "jardinero", "diseño web").
* **Panel Lateral / Superior de Filtros:** Controles para ajustar precios, ubicaciones y categorías.
* **Resultados de Búsqueda:** Grid de tarjetas de profesionales. Los perfiles que han pagado por destacar (`featured_listings`) aparecerán en la parte superior con un diseño dorado/premium y la etiqueta "Destacado".

---

## 2. Filtro de Precios (Slider + Inputs Sincronizados)

Implementaremos un filtro de precios compuesto por un slider de doble rango (Rango Mínimo y Rango Máximo) y dos inputs numéricos a los extremos.

### Comportamiento Reactivo
* **Sincronización Bidireccional:** Si el usuario mueve el control deslizante del mínimo, el input del precio mínimo se actualiza inmediatamente. Si el usuario escribe manualmente `25.50` en el input del máximo, el extremo correspondiente del slider se posiciona en ese valor.
* **Límites Dinámicos:** El precio mínimo no puede superar al máximo, y viceversa.
* **Componente Propuesto:** Utilizaremos un componente personalizado construido con `Radix UI Slider` o código nativo sincronizado en React.

---

## 3. Filtrado por Ubicación y Geolocalización por GPS

Para cumplir el requisito de "mostrar primero los profesionales más cercanos a la zona del cliente", combinaremos dos estrategias:

### Caso A: El cliente no otorga permisos de GPS (Filtro por División Política)
* Selects encadenados: **Departamento** y **Municipio**.
* La consulta en Supabase filtra usando `where department = '...' and municipality = '...'`.
* El orden de prioridad en este caso será:
  1. Perfiles destacados (`featured_listings` activos) en el municipio seleccionado.
  2. Perfiles estándar en el municipio seleccionado.
  3. Perfiles en municipios aledaños del mismo departamento.

### Caso B: El cliente activa su GPS (Filtro por Cercanía Exacta)
* Obtenemos la latitud y longitud del navegador del cliente.
* Invocamos la función PostgreSQL de Supabase `get_nearby_professionals(client_lat, client_lng)`.
* Esto retorna a los profesionales ordenados estrictamente de menor a mayor distancia en metros, independientemente de los límites municipales. Los perfiles destacados dentro de la distancia máxima se priorizarán en el renderizado con un multiplicador visual.

---

## 4. Estructura de Rutas Amigables para SEO

Para capturar búsquedas de Google del tipo *"plomeros en santa tecla"* o *"diseñadores gráficos en el salvador"*, crearemos rutas dinámicas y generaremos metadatos dinámicos.

### Estructura de URLs SEO-Friendly
* Búsqueda por subcategoría: `/profesionales/[subcategory_slug]`
  * Ej: `/profesionales/plomeria`
* Búsqueda por subcategoría y departamento: `/profesionales/[subcategory_slug]/[department_slug]`
  * Ej: `/profesionales/plomeria/san-salvador`
* Búsqueda por subcategoría, departamento y municipio: `/profesionales/[subcategory_slug]/[department_slug]/[municipality_slug]`
  * Ej: `/profesionales/plomeria/la-libertad/santa-tecla`

### Generación Dinámica de Metadatos (`generateMetadata`)
En cada página dinámica de Next.js, configuraremos los títulos y descripciones de manera óptima:
```typescript
export async function generateMetadata({ params }) {
  const { subcategory_slug, department_slug, municipality_slug } = params;
  
  // Consultar nombres legibles desde la BD usando los slugs
  const title = `${subcategory} en ${municipality || department || 'El Salvador'} | Alamanov`;
  const description = `Encuentra los mejores profesionales en ${subcategory} ubicados en ${municipality || department}. Portafolios verificados, cotizaciones directas por WhatsApp y calificaciones reales.`;
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ['/images/og-default.jpg'],
    }
  };
}
```
