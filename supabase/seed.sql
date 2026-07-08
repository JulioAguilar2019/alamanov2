-- Seed Data for Alamanov2
-- Created: 2026-07-08
-- Description: Inserts default categories and subcategories for local services, tech roles, professions, and beauty/wellness.

-- Insertar Categorías principales y retornar IDs para relacionar
with cat_hogar as (
  insert into categories (name, slug, description) 
  values ('Servicios del Hogar y Oficios', 'servicios-del-hogar-y-oficios', 'Servicios técnicos para mantenimiento, reparación y mejoras de viviendas y locales comerciales.')
  returning id
),
cat_tech as (
  insert into categories (name, slug, description) 
  values ('Tecnología, Diseño y Medios', 'tecnologia-diseno-y-medios', 'Servicios de programación, diseño visual, marketing digital y producción audiovisual.')
  returning id
),
cat_prof as (
  insert into categories (name, slug, description) 
  values ('Profesiones y Consultorías', 'profesiones-y-consultorias', 'Servicios profesionales regulados, asesorías comerciales y clases particulares.')
  returning id
),
cat_beauty as (
  insert into categories (name, slug, description) 
  values ('Belleza y Bienestar', 'belleza-y-bienestar', 'Servicios de cuidado personal, estilismo, entrenamiento físico y terapias de salud.')
  returning id
)
-- Insertar Subcategorías correspondientes
insert into subcategories (category_id, name, slug, description) values
  ((select id from cat_hogar), 'Plomería y Fontanería', 'plomeria-fontaneria', 'Reparación de fugas, instalación de grifería y destapado de tuberías.'),
  ((select id from cat_hogar), 'Electricidad', 'electricidad', 'Instalaciones eléctricas residenciales, cableados e iluminación.'),
  ((select id from cat_hogar), 'Albañilería y Construcción', 'albanileria-construccion', 'Trabajos de albañilería general, paredes, pisos y acabados.'),
  ((select id from cat_hogar), 'Pintura y Decoración', 'pintura-decoracion', 'Aplicación de pintura en interiores y exteriores, empapelados.'),
  ((select id from cat_hogar), 'Jardinería', 'jardineria', 'Mantenimiento de jardines, poda de césped y diseño de áreas verdes.'),
  
  ((select id from cat_tech), 'Desarrollo de Software y Web', 'desarrollo-software-web', 'Creación de sitios web, aplicaciones móviles y sistemas a medida.'),
  ((select id from cat_tech), 'Diseño Gráfico e Ilustración', 'diseno-grafico-ilustracion', 'Logotipos, branding corporativo, flyers y contenido digital.'),
  ((select id from cat_tech), 'Fotografía y Video', 'fotografia-video', 'Cobertura de eventos, sesiones de fotos y edición audiovisual.'),
  ((select id from cat_tech), 'Marketing Digital', 'marketing-digital', 'Gestión de redes sociales, pauta publicitaria y posicionamiento SEO.'),

  ((select id from cat_prof), 'Asesoría Legal / Abogados', 'asesoria-legal-abogados', 'Servicios jurídicos, contratos, escrituras y consultas legales.'),
  ((select id from cat_prof), 'Contabilidad y Finanzas', 'contabilidad-finanzas', 'Declaración de impuestos, auditorías y balances contables.'),
  ((select id from cat_prof), 'Tutorías y Clases Particulares', 'tutorias-clases-particulares', 'Refuerzo escolar, idiomas, matemáticas y música.'),

  ((select id from cat_beauty), 'Estética y Peluquería', 'estetica-peluqueria', 'Cortes de cabello, peinados, manicure, pedicure y maquillaje.'),
  ((select id from cat_beauty), 'Entrenador Personal', 'entrenador-personal', 'Planes de entrenamiento físico y acondicionamiento deportivo.'),
  ((select id from cat_beauty), 'Nutrición y Salud', 'nutricion-salud', 'Asesoría nutricional, dietas personalizadas y consultas de salud integrativa.');
