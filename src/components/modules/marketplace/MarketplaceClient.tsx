'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PriceRangeSlider from '@/components/ui/PriceRangeSlider';
import { EL_SALVADOR_LOCATIONS } from '@/lib/location-data';
import {
  Search,
  MapPin,
  Star,
  DollarSign,
  Navigation,
  Briefcase,
  Loader2,
  Phone,
  MessageCircle,
  Award
} from 'lucide-react';

interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

interface Professional {
  id: string;
  full_name: string;
  description: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  whatsapp_link: string | null;
  min_price: number;
  max_price: number;
  department: string;
  municipality: string;
  latitude: number | null;
  longitude: number | null;
  average_rating: number;
  is_featured: boolean;
  distance_meters: number | null;
}

interface MarketplaceClientProps {
  initialCategories: Category[];
  initialProfessionals: Professional[];
}

export default function MarketplaceClient({
  initialCategories,
  initialProfessionals,
}: MarketplaceClientProps) {
  const [professionals, setProfessionals] = useState<Professional[]>(initialProfessionals);
  const [loading, setLoading] = useState(false);

  // Estados de Filtros
  const [searchText, setSearchText] = useState('');
  const [selectedSubcategorySlug, setSelectedSubcategorySlug] = useState<string>('');
  const [department, setDepartment] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(250);

  // Geolocalización
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'fetching' | 'granted' | 'denied'>('idle');

  // Obtener municipios
  const selectedDepartmentData = EL_SALVADOR_LOCATIONS.find((d) => d.name === department);
  const municipalities = selectedDepartmentData ? selectedDepartmentData.municipalities : [];

  // Función principal para consultar la API
  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.append('search', searchText);
      if (selectedSubcategorySlug) params.append('subcategory', selectedSubcategorySlug);
      if (department) params.append('department', department);
      if (municipality) params.append('municipality', municipality);
      if (minPrice > 0) params.append('minPrice', minPrice.toString());
      if (maxPrice < 250) params.append('maxPrice', maxPrice.toString());
      if (latitude && longitude && gpsStatus === 'granted') {
        params.append('latitude', latitude.toString());
        params.append('longitude', longitude.toString());
      }

      const res = await fetch(`/api/marketplace/search?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProfessionals(data.professionals);
      }
    } catch (error) {
      console.error('Error al realizar búsqueda:', error);
    } finally {
      setLoading(false);
    }
  };

  // Escuchar cambios en los filtros para recargar automáticamente (Debounce o reactivo simple)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchResults();
    }, 400); // 400ms de retraso para evitar llamadas excesivas al escribir

    return () => clearTimeout(delayDebounceFn);
  }, [searchText, selectedSubcategorySlug, department, municipality, minPrice, maxPrice, latitude, longitude, gpsStatus]);

  // Activar localización GPS
  const handleActivateGPS = () => {
    setGpsStatus('fetching');
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGpsStatus('granted');
      },
      () => {
        setGpsStatus('denied');
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Encabezado */}
      <section className="relative overflow-hidden border-b border-white/5 bg-slate-900/20 py-16 px-6">
        <div className="absolute top-1/2 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-3xl" />
        
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <h1 className="text-4xl font-extrabold sm:text-5xl tracking-tight">
            Encuentra Profesionales y Oficios
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Filtra por tarifas, especialidades y **encuentra automáticamente a los más cercanos** a tu ubicación en El Salvador.
          </p>
        </div>
      </section>

      {/* Grid del Buscador */}
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* PANEL IZQUIERDO: Filtros */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-6 sticky top-24 backdrop-blur-xl">
            <h3 className="font-bold text-lg border-b border-white/5 pb-2 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-teal-400" /> Filtros de Búsqueda
            </h3>

            {/* Búsqueda por Texto */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">¿Qué buscas?</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Search className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  placeholder="Ej. plomero, pintor..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pr-3 pl-9 text-xs text-white outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Filtro por Categorías / Subcategorías */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Especialidad</label>
              <select
                value={selectedSubcategorySlug}
                onChange={(e) => setSelectedSubcategorySlug(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white outline-none focus:border-teal-500"
              >
                <option value="">Todas las especialidades</option>
                {initialCategories.map((cat) => (
                  <optgroup key={cat.id} label={cat.name}>
                    {cat.subcategories.map((sub) => (
                      <option key={sub.id} value={sub.slug}>
                        {sub.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Filtros de Ubicación */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Departamento</label>
                <select
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setMunicipality('');
                  }}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white outline-none focus:border-teal-500"
                >
                  <option value="">Todo El Salvador</option>
                  {EL_SALVADOR_LOCATIONS.map((d) => (
                    <option key={d.slug} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Municipio</label>
                <select
                  value={municipality}
                  disabled={!department}
                  onChange={(e) => setMunicipality(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white outline-none focus:border-teal-500 disabled:opacity-50"
                >
                  <option value="">Todos los municipios</option>
                  {municipalities.map((m) => (
                    <option key={m.slug} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filtro de Rango de Precios */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Rango de Precios</label>
              <PriceRangeSlider
                minLimit={0}
                maxLimit={250}
                initialMin={minPrice}
                initialMax={maxPrice}
                onChange={(min, max) => {
                  setMinPrice(min);
                  setMaxPrice(max);
                }}
              />
            </div>

            {/* Activador de GPS Cercano */}
            <div className="border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={handleActivateGPS}
                disabled={gpsStatus === 'fetching'}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition ${
                  gpsStatus === 'granted'
                    ? 'bg-teal-500 text-slate-950 font-bold hover:bg-teal-400'
                    : 'bg-violet-600 hover:bg-violet-500 text-white'
                }`}
              >
                <Navigation className={`h-4 w-4 ${gpsStatus === 'granted' ? 'fill-current' : ''}`} />
                {gpsStatus === 'granted'
                  ? 'Ordenar por Cercanía GPS'
                  : gpsStatus === 'fetching'
                  ? 'Localizando...'
                  : 'Buscar por Cercanía GPS'}
              </button>
            </div>

          </div>
        </aside>

        {/* PANEL DERECHO: Tarjetas de Profesionales */}
        <main className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
              Resultados ({professionals.length})
            </span>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-teal-400" />}
          </div>

          {professionals.length === 0 ? (
            <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-16 text-center text-slate-500">
              <p className="text-sm">No se encontraron profesionales con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {professionals.map((prof) => (
                <div
                  key={prof.id}
                  className={`relative rounded-2xl border bg-slate-900/20 p-6 flex flex-col justify-between space-y-4 backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-lg ${
                    prof.is_featured
                      ? 'border-amber-500/40 shadow-md shadow-amber-500/5 bg-gradient-to-b from-amber-500/5 to-slate-950/20'
                      : 'border-white/10 hover:border-violet-500/40'
                  }`}
                >
                  {/* Badge Destacado */}
                  {prof.is_featured && (
                    <span className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[9px] font-bold text-amber-400 uppercase tracking-widest">
                      <Award className="h-3 w-3" /> Destacado
                    </span>
                  )}

                  {/* Header de Tarjeta */}
                  <div className="flex gap-4">
                    <div className="h-14 w-14 overflow-hidden rounded-full border border-slate-700 bg-slate-950 shrink-0">
                      {prof.avatar_url ? (
                        <img src={prof.avatar_url} alt={prof.full_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-500 text-lg font-bold uppercase">
                          {prof.full_name[0]}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-base text-white">{prof.full_name}</h4>
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <MapPin className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                        <span>{prof.municipality}, {prof.department}</span>
                      </div>
                      
                      {/* Distancia GPS si está disponible */}
                      {prof.distance_meters !== null && prof.distance_meters !== undefined && (
                        <span className="text-[10px] text-teal-400 font-semibold block">
                          A {(prof.distance_meters / 1000).toFixed(1)} km de distancia
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Descripción Breve */}
                  <p className="text-slate-350 text-xs leading-relaxed line-clamp-3">
                    {prof.description || 'El profesional no ha detallado una descripción.'}
                  </p>

                  {/* Footer de Tarjeta */}
                  <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-400 text-xs">
                        <Star className="h-4 w-4 fill-current" />
                      </div>
                      <span className="text-xs font-bold">{prof.average_rating.toFixed(1)}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] uppercase text-slate-500 block font-semibold">Tarifa Promedio</span>
                      <div className="flex items-center text-white font-extrabold text-sm">
                        <DollarSign className="h-4 w-4 text-teal-400" />
                        <span>{prof.min_price.toFixed(0)} - {prof.max_price.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA Ver Perfil */}
                  <Link
                    href={`/profesionales/${prof.id}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/50 py-3 text-xs font-bold hover:border-violet-500 hover:bg-slate-800 transition"
                  >
                    Ver Portafolio Completo
                  </Link>

                </div>
              ))}
            </div>
          )}
        </main>
        
      </div>
    </div>
  );
}
