import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || null;
    const subcategory = searchParams.get('subcategory') || null;
    const department = searchParams.get('department') || null;
    const municipality = searchParams.get('municipality') || null;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null;
    const latitude = searchParams.get('latitude') ? parseFloat(searchParams.get('latitude')!) : null;
    const longitude = searchParams.get('longitude') ? parseFloat(searchParams.get('longitude')!) : null;

    const supabase = await createServerClient();

    // Invocar el RPC optimizado de búsqueda
    const { data, error } = await supabase.rpc('search_professionals', {
      filter_search: search,
      filter_subcategory_slug: subcategory,
      filter_department: department,
      filter_municipality: municipality,
      filter_min_price: minPrice,
      filter_max_price: maxPrice,
      user_lat: latitude,
      user_lng: longitude,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, professionals: data || [] });
  } catch (error: any) {
    console.error('Error en la API de búsqueda:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al buscar profesionales' },
      { status: 500 }
    );
  }
}
