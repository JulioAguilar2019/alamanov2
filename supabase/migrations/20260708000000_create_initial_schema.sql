-- Migration: Initial Schema for Alamanov2
-- Created: 2026-07-08
-- Description: Sets up the initial PostgreSQL database schema, PostGIS extensions, functions, RLS policies, and triggers.

-- 1. Habilitar la extensión PostGIS para geolocalización por cercanía
create extension if not exists postgis;

-- 2. Crear tabla de Categorías principales
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  name varchar(255) not null,
  slug varchar(255) not null unique, -- Para rutas SEO
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Crear tabla de Subcategorías
create table if not exists subcategories (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references categories(id) on delete cascade not null,
  name varchar(255) not null,
  slug varchar(255) not null unique, -- Para rutas SEO
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Crear tabla de Perfiles de profesionales
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email varchar(255) not null unique,
  full_name varchar(255) not null,
  description text,
  phone_number varchar(50),
  whatsapp_link text,
  social_links jsonb default '{}'::jsonb, -- Almacena { "facebook": "...", "instagram": "..." }
  avatar_url text, -- Imagen de Cloudinary
  min_price decimal(10,2) default 0.00,
  max_price decimal(10,2) default 0.00,
  
  -- Ubicación (Híbrida: Departamentos/Municipios + GPS)
  department varchar(100) not null,
  municipality varchar(100) not null,
  latitude double precision,
  longitude double precision,
  
  average_rating decimal(3,2) default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Crear tabla de mapeo muchos a muchos entre perfiles y subcategorías
create table if not exists profile_subcategories (
  profile_id uuid references profiles(id) on delete cascade not null,
  subcategory_id uuid references subcategories(id) on delete cascade not null,
  primary key (profile_id, subcategory_id)
);

-- 6. Crear tabla del Portafolio de profesionales (imágenes únicamente)
create table if not exists portfolio_items (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  title varchar(255) not null,
  description text,
  image_url text not null, -- URL de Cloudinary
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Crear tabla de Reseñas de clientes
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  client_name varchar(100) not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Crear tabla de Destaques comprados (monetización con Wompi)
create table if not exists featured_listings (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  featured_type varchar(50) default 'premium',
  is_active boolean default true,
  start_date timestamp with time zone default timezone('utc'::text, now()) not null,
  end_date timestamp with time zone not null,
  wompi_transaction_id varchar(255)
);

-- 9. Crear función de PostGIS para ordenar profesionales por cercanía geográfica
create or replace function get_nearby_professionals(
  user_lat double precision,
  user_lng double precision,
  max_distance_meters double precision default 50000
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

-- 10. Habilitar la seguridad RLS en todas las tablas
alter table profiles enable row level security;
alter table portfolio_items enable row level security;
alter table reviews enable row level security;
alter table profile_subcategories enable row level security;
alter table categories enable row level security;
alter table subcategories enable row level security;
alter table featured_listings enable row level security;

-- 11. Definición de Políticas de Seguridad RLS
create policy "Profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

create policy "Portfolio items are viewable by everyone" on portfolio_items
  for select using (true);

create policy "Users can insert their own portfolio items" on portfolio_items
  for insert with check (auth.uid() = profile_id);

create policy "Users can update/delete their own portfolio items" on portfolio_items
  for all using (auth.uid() = profile_id);

create policy "Reviews are viewable by everyone" on reviews
  for select using (true);

create policy "Anyone can write a review" on reviews
  for insert with check (true);

create policy "Categories are viewable by everyone" on categories
  for select using (true);

create policy "Subcategories are viewable by everyone" on subcategories
  for select using (true);

-- 12. Trigger para crear automáticamente el perfil tras el registro del usuario
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, department, municipality)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Nuevo Profesional'),
    'Desconocido',
    'Desconocido'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
