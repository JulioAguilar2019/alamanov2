# Módulo 1: Diseño e Implementación de la Base de Datos (Supabase / PostgreSQL)

Este módulo cubre la definición del esquema de la base de datos en PostgreSQL (gestionada a través de Supabase), utilizando nombres de tablas y campos completamente en **inglés y notación snake_case**. También incluye subcategorías y la extensión PostGIS para ordenamiento por cercanía geográfica.

---

## 1. Extensiones Necesarias
Ejecutar en la consola SQL de Supabase para activar las extensiones necesarias para geolocalización y UUIDs:
```sql
create extension if not exists postgis;
create extension if not exists pgcrypto;
```

---

## 2. Definición del Esquema SQL

### Tabla: `categories`
Almacena las categorías principales de servicios (ej. "Construcción y Hogar", "Tecnología y Diseño").
```sql
create table categories (
  id uuid default gen_random_uuid() primary key,
  name varchar(255) not null,
  slug varchar(255) not null unique, -- Para rutas SEO optimizadas
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Tabla: `subcategories`
Almacena subcategorías para mayor granularidad (ej. "Plomería", "Electricidad" dentro de Construcción).
```sql
create table subcategories (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references categories(id) on delete cascade not null,
  name varchar(255) not null,
  slug varchar(255) not null unique, -- Para rutas SEO optimizadas (ej. /profesionales/plomeria)
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Tabla: `profiles`
Almacena la información de los profesionales (ligada a `auth.users` de Supabase).
```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email varchar(255) not null unique,
  full_name varchar(255) not null,
  description text,
  phone_number varchar(50),
  whatsapp_link text,
  social_links jsonb default '{}'::jsonb, -- Almacena enlaces como { "facebook": "...", "instagram": "..." }
  avatar_url text, -- Foto de perfil (Cloudinary)
  min_price decimal(10,2) default 0.00, -- Para el filtro de precios
  max_price decimal(10,2) default 0.00,
  
  -- Ubicación (Híbrida: División administrativa + GPS)
  department varchar(100) not null, -- Ej. "San Salvador"
  municipality varchar(100) not null, -- Ej. "San Salvador Centro"
  latitude double precision,
  longitude double precision,
  
  average_rating decimal(3,2) default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Tabla: `profile_subcategories`
Relación muchos a muchos entre los profesionales y las subcategorías que ofrecen.
```sql
create table profile_subcategories (
  profile_id uuid references profiles(id) on delete cascade not null,
  subcategory_id uuid references subcategories(id) on delete cascade not null,
  primary key (profile_id, subcategory_id)
);
```

### Tabla: `portfolio_items`
Galería de imágenes de trabajos anteriores del profesional.
```sql
create table portfolio_items (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  title varchar(255) not null,
  description text,
  image_url text not null, -- Almacenada en Cloudinary
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Tabla: `reviews`
Reseñas escritas por clientes para calificar al profesional.
```sql
create table reviews (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  client_name varchar(100) not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Tabla: `featured_listings`
Monetización de anuncios destacados vinculados a Wompi.
```sql
create table featured_listings (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  featured_type varchar(50) default 'premium', -- 'premium', 'gold', etc.
  is_active boolean default true,
  start_date timestamp with time zone default timezone('utc'::text, now()) not null,
  end_date timestamp with time zone not null,
  wompi_transaction_id varchar(255)
);
```

---

## 3. Funciones Especiales de PostgreSQL (Búsqueda por Cercanía)

Para ordenar y buscar profesionales por distancia geográfica a partir de las coordenadas GPS del cliente, utilizaremos una función que calcule la distancia en metros con PostGIS.

```sql
create or replace function get_nearby_professionals(
  user_lat double precision,
  user_lng double precision,
  max_distance_meters double precision default 50000 -- 50 km por defecto
)
returns table (
  profile_id uuid,
  full_name varchar,
  avatar_url text,
  department varchar,
  municipality varchar,
  distance_meters double precision
) 
language plpgsql
as $$
begin
  return query
  select 
    p.id as profile_id,
    p.full_name,
    p.avatar_url,
    p.department,
    p.municipality,
    st_distance(
      st_setsrid(st_point(p.longitude, p.latitude), 4326)::geography,
      st_setsrid(st_point(user_lng, user_lat), 4326)::geography
    ) as distance_meters
  from profiles p
  where p.latitude is not null and p.longitude is not null
    and st_dwithin(
      st_setsrid(st_point(p.longitude, p.latitude), 4326)::geography,
      st_setsrid(st_point(user_lng, user_lat), 4326)::geography,
      max_distance_meters
    )
  order by distance_meters asc;
end;
$$;
```

---

## 4. Políticas de Seguridad RLS (Row Level Security)

Es vital asegurar que los usuarios solo puedan editar sus propios datos, pero que el público pueda consultar los portafolios y perfiles.

```sql
-- Habilitar RLS en las tablas críticas
alter table profiles enable row level security;
alter table portfolio_items enable row level security;
alter table reviews enable row level security;
alter table profile_subcategories enable row level security;

-- Políticas para 'profiles'
create policy "Profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- Políticas para 'portfolio_items'
create policy "Portfolio items are viewable by everyone" on portfolio_items
  for select using (true);

create policy "Users can insert their own portfolio items" on portfolio_items
  for insert with check (auth.uid() = profile_id);

create policy "Users can update/delete their own portfolio items" on portfolio_items
  for all using (auth.uid() = profile_id);

-- Políticas para 'reviews'
create policy "Reviews are viewable by everyone" on reviews
  for select using (true);

create policy "Anyone can write a review" on reviews
  for insert with check (true);
```
