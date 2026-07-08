import { createServerClient } from '@/lib/supabase/server';
import MarketplaceClient from '@/components/modules/marketplace/MarketplaceClient';

export const dynamic = 'force-dynamic';

export default async function MarketplacePage() {
  const supabase = await createServerClient();

  // 1. Obtener todas las categorías y subcategorías disponibles para filtros
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, subcategories(id, name, slug)')
    .order('name');

  // 2. Obtener lista inicial de profesionales ordenada por prioridad (destacados primero, calificaciones)
  const { data: professionals, error } = await supabase.rpc('search_professionals', {
    filter_search: null,
    filter_subcategory_slug: null,
    filter_department: null,
    filter_municipality: null,
    filter_min_price: null,
    filter_max_price: null,
    user_lat: null,
    user_lng: null,
  });

  if (error) {
    console.error('Error al cargar profesionales en el servidor:', error);
  }

  return (
    <MarketplaceClient
      initialCategories={categories || []}
      initialProfessionals={professionals || []}
    />
  );
}
