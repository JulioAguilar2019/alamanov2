import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import MarketplaceClient from '@/components/modules/marketplace/MarketplaceClient';
import { EL_SALVADOR_LOCATIONS } from '@/lib/location-data';

interface Params {
  params: Promise<{ slug: string[] }>;
}

// Auxiliar para parsear slugs y retornar nombres legibles
async function parseSearchSlugs(slugs: string[]) {
  const subcategorySlug = slugs[0];
  const departmentSlug = slugs[1] || null;
  const municipalitySlug = slugs[2] || null;

  const supabase = await createServerClient();

  // 1. Obtener nombre de la subcategoría de la BD
  const { data: sub } = await supabase
    .from('subcategories')
    .select('name')
    .eq('slug', subcategorySlug)
    .single();

  if (!sub) return null;

  // 2. Obtener nombres de Departamento y Municipio
  let departmentName = '';
  let municipalityName = '';

  if (departmentSlug) {
    const dept = EL_SALVADOR_LOCATIONS.find((d) => d.slug === departmentSlug);
    if (!dept) return null;
    departmentName = dept.name;

    if (municipalitySlug) {
      const muni = dept.municipalities.find((m) => m.slug === municipalitySlug);
      if (!muni) return null;
      municipalityName = muni.name;
    }
  }

  return {
    subcategorySlug,
    subName: sub.name,
    departmentName,
    municipalityName,
  };
}

// Generación dinámica de metadatos SEO
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  
  if (!slug || slug.length === 0 || slug.length > 3) {
    return { title: 'Búsqueda de Servicios | Alamanov2' };
  }

  const parsed = await parseSearchSlugs(slug);
  if (!parsed) {
    return { title: 'Servicios no encontrados | Alamanov2' };
  }

  const { subName, departmentName, municipalityName } = parsed;
  const locationLabel = municipalityName 
    ? `${municipalityName}, ${departmentName}` 
    : departmentName 
    ? departmentName 
    : 'El Salvador';

  const title = `${subName} en ${locationLabel} | Calificaciones y Portafolios | Alamanov`;
  const description = `Encuentra profesionales expertos en ${subName} ubicados en ${locationLabel}. Revisa fotos de sus trabajos anteriores, opiniones reales y cotiza directo por WhatsApp.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ['/images/og-default.jpg'],
    },
  };
}

export default async function CategoryLocationPage({ params }: Params) {
  const { slug } = await params;

  if (!slug || slug.length === 0 || slug.length > 3) {
    notFound();
  }

  const parsed = await parseSearchSlugs(slug);
  if (!parsed) {
    notFound();
  }

  const { subcategorySlug, subName, departmentName, municipalityName } = parsed;
  const supabase = await createServerClient();

  // 1. Cargar las categorías y subcategorías para filtros
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, subcategories(id, name, slug)')
    .order('name');

  // 2. Consultar base de datos utilizando el RPC filtrado
  const { data: professionals } = await supabase.rpc('search_professionals', {
    filter_search: null,
    filter_subcategory_slug: subcategorySlug,
    filter_department: departmentName || null,
    filter_municipality: municipalityName || null,
    filter_min_price: null,
    filter_max_price: null,
    user_lat: null,
    user_lng: null,
  });

  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Indicador visual de landing pre-filtrada para el usuario */}
      <div className="bg-slate-900/40 border-b border-white/5 py-4 px-6 text-center text-xs text-slate-400">
        Mostrando resultados pre-filtrados para: <strong className="text-teal-400 font-bold">{subName}</strong> 
        {departmentName && (
          <>
            {' '}en <strong className="text-violet-400 font-bold">{municipalityName || departmentName}</strong>
          </>
        )}
      </div>

      <MarketplaceClient
        initialCategories={categories || []}
        initialProfessionals={professionals || []}
      />
    </div>
  );
}
