-- Migration: Add search_professionals RPC
-- Created: 2026-07-08
-- Description: Creates a Postgres function to search, filter, and sort professionals by text, subcategory, pricing, and GPS location proximity.

create or replace function search_professionals(
  filter_search text default null,
  filter_subcategory_slug text default null,
  filter_department text default null,
  filter_municipality text default null,
  filter_min_price decimal default null,
  filter_max_price decimal default null,
  user_lat double precision default null,
  user_lng double precision default null
)
returns table (
  id uuid,
  full_name varchar,
  description text,
  avatar_url text,
  phone_number varchar,
  whatsapp_link text,
  min_price decimal,
  max_price decimal,
  department varchar,
  municipality varchar,
  latitude double precision,
  longitude double precision,
  average_rating decimal,
  is_featured boolean,
  distance_meters double precision
)
language plpgsql
as $$
begin
  return query
  select 
    p.id,
    p.full_name,
    p.description,
    p.avatar_url,
    p.phone_number,
    p.whatsapp_link,
    p.min_price,
    p.max_price,
    p.department,
    p.municipality,
    p.latitude,
    p.longitude,
    p.average_rating,
    exists(
      select 1 from featured_listings f 
      where f.profile_id = p.id and f.is_active = true
    ) as is_featured,
    case 
      when user_lat is not null and user_lng is not null and p.latitude is not null and p.longitude is not null
      then st_distance(
        st_setsrid(st_point(p.longitude, p.latitude), 4326)::geography,
        st_setsrid(st_point(user_lng, user_lat), 4326)::geography
      )
      else null
    end as distance_meters
  from profiles p
  where 
    -- Filtro de texto (búsqueda en nombre y descripción)
    (filter_search is null or p.full_name ilike '%' || filter_search || '%' or p.description ilike '%' || filter_search || '%')
    
    -- Filtro de subcategoría
    and (filter_subcategory_slug is null or exists (
      select 1 from profile_subcategories ps
      join subcategories s on s.id = ps.subcategory_id
      where ps.profile_id = p.id and s.slug = filter_subcategory_slug
    ))
    
    -- Filtro de ubicación
    and (filter_department is null or p.department = filter_department)
    and (filter_municipality is null or p.municipality = filter_municipality)
    
    -- Filtros de precios
    and (filter_min_price is null or p.min_price >= filter_min_price)
    and (filter_max_price is null or p.max_price <= filter_max_price)
  order by 
    -- Ordenar: Primero destacados, luego por distancia (si hay GPS), luego por calificación/fecha
    is_featured desc,
    case 
      when user_lat is not null and user_lng is not null 
      then 1 -- Usamos distancia abajo
      else 2
    end asc,
    distance_meters asc nulls last,
    p.average_rating desc,
    p.created_at desc;
end;
$$;
