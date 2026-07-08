import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  Phone,
  MessageCircle,
  MapPin,
  Star,
  DollarSign,
  ChevronLeft,
  Calendar,
  Share2,
  AlertCircle
} from 'lucide-react';

interface Params {
  params: Promise<{ id: string }>;
}

// Generación de metadatos dinámicos para SEO
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, description, department, municipality, avatar_url')
    .eq('id', id)
    .single();

  if (!profile) {
    return {
      title: 'Profesional no encontrado | Alamanov2',
    };
  }

  const title = `${profile.full_name} | Servicios Profesionales en ${profile.municipality}, El Salvador`;
  const description = profile.description 
    ? `${profile.description.substring(0, 150)}...` 
    : `Cotiza servicios directamente con ${profile.full_name} en ${profile.municipality}, El Salvador. Ver portafolio, calificaciones y WhatsApp.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : ['/images/og-default.jpg'],
    },
  };
}

export default async function PublicProfilePage({ params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();

  // 1. Consultar el perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (!profile) {
    notFound();
  }

  // 2. Consultar subcategorías asociadas
  const { data: subcategoriesPivot } = await supabase
    .from('profile_subcategories')
    .select('subcategories(name)')
    .eq('profile_id', id);

  const subcategoryNames = subcategoriesPivot?.map((pivot: any) => pivot.subcategories?.name).filter(Boolean) || [];

  // 3. Consultar items del portafolio
  const { data: portfolioItems } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('profile_id', id)
    .order('created_at', { ascending: false });

  // 4. Consultar reseñas
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('profile_id', id)
    .order('created_at', { ascending: false });

  // Calcular calificación promedio exacta y contador
  const totalReviews = reviews?.length || 0;
  const averageRating = totalReviews > 0
    ? (reviews!.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews).toFixed(1)
    : '0.0';

  // Datos estructurados JSON-LD para SEO (Schema.org)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    'name': profile.full_name,
    'image': profile.avatar_url || 'https://images.unsplash.com/photo-1521791136064-7986c2959213',
    'telephone': profile.phone_number || '',
    'url': `https://alamanov.com/profesionales/${profile.id}`,
    'priceRange': `$$ / $${profile.min_price} - $${profile.max_price}`,
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': profile.municipality,
      'addressRegion': profile.department,
      'addressCountry': 'SV',
    },
    'aggregateRating': totalReviews > 0 ? {
      '@type': 'AggregateRating',
      'ratingValue': averageRating,
      'reviewCount': totalReviews,
    } : undefined,
  };

  // Acción de servidor rápida para guardar una reseña
  async function addReviewAction(formData: FormData) {
    'use server';
    const clientName = formData.get('clientName') as string;
    const ratingStr = formData.get('rating') as string;
    const comment = formData.get('comment') as string;

    if (!clientName || !ratingStr) return;

    const supabaseServer = await createServerClient();
    await supabaseServer.from('reviews').insert({
      profile_id: id,
      client_name: clientName,
      rating: parseInt(ratingStr),
      comment,
    });
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-white font-sans pb-24">
      {/* Script JSON-LD inyectado para SEO de Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Glow Effects */}
      <div className="absolute top-0 left-10 -z-10 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="absolute top-1/2 right-10 -z-10 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />

      {/* Header / Navegación */}
      <header className="border-b border-white/5 bg-slate-900/30 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/marketplace" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
            <ChevronLeft className="h-5 w-5" /> Regresar al buscador
          </Link>
          <button className="flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/40 py-2 px-4 text-xs font-semibold hover:bg-slate-800 transition">
            <Share2 className="h-4 w-4" /> Compartir
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: Tarjeta de Presentación */}
        <section className="md:col-span-1 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-center space-y-6 backdrop-blur-xl">
            {/* Avatar */}
            <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border-2 border-teal-500 shadow-lg shadow-teal-500/10">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-400 text-3xl font-extrabold">
                  {profile.full_name[0]}
                </div>
              )}
            </div>

            {/* Nombre e Info Básica */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{profile.full_name}</h2>
              <div className="flex items-center justify-center gap-1.5 text-teal-400 text-sm font-semibold">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{profile.municipality}, {profile.department}</span>
              </div>
            </div>

            {/* Badges de Categoría */}
            <div className="flex flex-wrap justify-center gap-1.5">
              {subcategoryNames.map((name, i) => (
                <span key={i} className="rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-[11px] font-semibold text-violet-400">
                  {name}
                </span>
              ))}
            </div>

            {/* Calificación Promedio */}
            <div className="flex items-center justify-center gap-2 border-t border-b border-white/5 py-4">
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(parseFloat(averageRating)) ? 'fill-current' : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold">{averageRating}</span>
              <span className="text-xs text-slate-500">({totalReviews} reseñas)</span>
            </div>

            {/* Tarifas */}
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Tarifa Estimada</span>
              <div className="flex items-center justify-center text-2xl font-extrabold text-white">
                <DollarSign className="h-6 w-6 text-teal-400 shrink-0" />
                <span>{profile.min_price} - {profile.max_price}</span>
                <span className="text-xs text-slate-500 font-medium ml-1">/ serv.</span>
              </div>
            </div>

            {/* CTAs de Alta Conversión */}
            <div className="space-y-2.5 pt-4">
              {profile.whatsapp_link && (
                <a
                  href={profile.whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-3.5 px-4 text-sm font-bold text-slate-950 shadow-lg shadow-teal-500/10 hover:bg-teal-400 hover:shadow-teal-500/25 transition duration-300 relative group overflow-hidden"
                >
                  {/* Animación de pulso */}
                  <span className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <MessageCircle className="h-5 w-5 fill-current" />
                  Contactar por WhatsApp
                </a>
              )}
              {profile.phone_number && (
                <a
                  href={`tel:+${profile.phone_number.replace(/\D/g, '')}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/50 py-3.5 px-4 text-sm font-semibold hover:bg-slate-800 transition duration-300"
                >
                  <Phone className="h-4 w-4" />
                  Llamar Directo
                </a>
              )}
            </div>
          </div>
        </section>

        {/* COLUMNA DERECHA: Biografía, Portafolio y Calificaciones */}
        <section className="md:col-span-2 space-y-8">
          {/* Biografía / Sobre mí */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 space-y-4 backdrop-blur-xl">
            <h3 className="text-lg font-bold border-b border-white/5 pb-2">Sobre Mi Trabajo</h3>
            <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-line">
              {profile.description || 'El profesional no ha detallado una biografía.'}
            </p>
          </div>

          {/* Portafolio (Masonry Grid) */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 space-y-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold border-b border-white/5 pb-2">Galería de Trabajos</h3>
            
            {!portfolioItems || portfolioItems.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Aún no hay imágenes en este portafolio.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {portfolioItems.map((item) => (
                  <div key={item.id} className="group relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer">
                    <img src={item.image_url} alt={item.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 flex items-end p-4 transition duration-200">
                      <span className="text-xs font-semibold text-white">{item.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reseñas y Calificaciones */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 space-y-8 backdrop-blur-xl">
            <h3 className="text-lg font-bold border-b border-white/5 pb-2">Reseñas de Clientes</h3>

            {/* Listado de Calificaciones */}
            <div className="space-y-4">
              {!reviews || reviews.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">Este profesional aún no tiene calificaciones. ¡Sé el primero en dejar una!</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="border-b border-white/5 pb-4 space-y-2 last:border-b-0">
                    <div className="flex justify-between items-center">
                      <h5 className="font-semibold text-sm">{rev.client_name}</h5>
                      <div className="flex text-amber-400 text-xs">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} className={`h-4.5 w-4.5 ${idx < rev.rating ? 'fill-current' : 'text-slate-800'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">{rev.comment}</p>
                    <span className="text-[10px] text-slate-600 block">
                      {new Date(rev.created_at).toLocaleDateString('es-SV', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Formulario para agregar Reseña */}
            <div className="border-t border-white/5 pt-6 space-y-4">
              <h4 className="text-sm font-semibold text-teal-400">Deja tu reseña o calificación</h4>
              <form action={addReviewAction} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tu Nombre</label>
                    <input
                      name="clientName"
                      type="text"
                      required
                      placeholder="Ej. Roberto Menjívar"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Calificación (Estrellas)</label>
                    <select
                      name="rating"
                      required
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white outline-none focus:border-teal-500"
                    >
                      <option value="5">5 estrellas (Excelente)</option>
                      <option value="4">4 estrellas (Muy bueno)</option>
                      <option value="3">3 estrellas (Aceptable)</option>
                      <option value="2">2 estrellas (Regular)</option>
                      <option value="1">1 estrella (Malo)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tu Comentario</label>
                  <textarea
                    name="comment"
                    rows={3}
                    placeholder="Cuéntanos tu experiencia contratando a este profesional..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white outline-none focus:border-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 hover:bg-violet-500 py-2.5 px-5 text-xs font-bold text-white transition"
                >
                  Enviar Calificación
                </button>
              </form>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
