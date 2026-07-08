'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/app/auth/actions';
import { createBrowserClient } from '@/lib/supabase/client';
import { EL_SALVADOR_LOCATIONS } from '@/lib/location-data';
import { compressLocalImage } from '@/lib/image-compression';
import { uploadImage } from '@/lib/image-upload-helper';
import {
  User,
  Briefcase,
  MapPin,
  Image as ImageIcon,
  LogOut,
  Settings,
  TrendingUp,
  Check,
  Loader2,
  DollarSign,
  Plus,
  Trash2,
  ExternalLink,
  Navigation
} from 'lucide-react';

interface Subcategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  description: string | null;
  phone_number: string | null;
  whatsapp_link: string | null;
  social_links: any;
  avatar_url: string | null;
  min_price: number;
  max_price: number;
  department: string;
  municipality: string;
  latitude: number | null;
  longitude: number | null;
  average_rating: number;
}

interface PortfolioItem {
  id: string;
  title: string;
  image_url: string;
}

interface DashboardProps {
  profile: Profile;
  initialSubcategoryIds: string[];
  portfolioItems: PortfolioItem[];
  categories: Category[];
}

type TabType = 'profile' | 'services' | 'location' | 'portfolio' | 'metrics';

export default function DashboardLayout({
  profile,
  initialSubcategoryIds,
  portfolioItems,
  categories,
}: DashboardProps) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados del Perfil
  const [fullName, setFullName] = useState(profile.full_name);
  const [description, setDescription] = useState(profile.description || '');
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number || '');
  const [minPrice, setMinPrice] = useState(profile.min_price.toString());
  const [maxPrice, setMaxPrice] = useState(profile.max_price.toString());
  const [facebook, setFacebook] = useState(profile.social_links?.facebook || '');
  const [instagram, setInstagram] = useState(profile.social_links?.instagram || '');
  
  // Ubicación
  const [department, setDepartment] = useState(profile.department);
  const [municipality, setMunicipality] = useState(profile.municipality);
  const [latitude, setLatitude] = useState<number | null>(profile.latitude);
  const [longitude, setLongitude] = useState<number | null>(profile.longitude);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'fetching' | 'granted' | 'denied'>('idle');

  // Subcategorías y Portafolio
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(initialSubcategoryIds);
  const [currentPortfolio, setCurrentPortfolio] = useState<PortfolioItem[]>(portfolioItems);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);

  // Obtener municipios
  const selectedDepartmentData = EL_SALVADOR_LOCATIONS.find((d) => d.name === department);
  const municipalities = selectedDepartmentData ? selectedDepartmentData.municipalities : [];

  // Guardar Cambios del Perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanNum = phoneNumber.replace(/\D/g, '');
    const formattedNum = cleanNum.length === 8 ? `503${cleanNum}` : cleanNum;
    const whatsappLink = phoneNumber ? `https://wa.me/${formattedNum}` : '';

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          description,
          phone_number: phoneNumber,
          whatsapp_link: whatsappLink,
          social_links: { facebook, instagram },
        })
        .eq('id', profile.id);

      if (error) throw error;
      setSuccessMsg('Información de perfil actualizada con éxito.');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  // Guardar Servicios y Precios
  const handleSaveServices = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Actualizar precios
      const { error: priceError } = await supabase
        .from('profiles')
        .update({
          min_price: parseFloat(minPrice),
          max_price: parseFloat(maxPrice),
        })
        .eq('id', profile.id);

      if (priceError) throw priceError;

      // 2. Actualizar subcategorías en tabla pivote
      await supabase
        .from('profile_subcategories')
        .delete()
        .eq('profile_id', profile.id);

      const subcategoryInserts = selectedSubcategories.map((subId) => ({
        profile_id: profile.id,
        subcategory_id: subId,
      }));

      const { error: subError } = await supabase
        .from('profile_subcategories')
        .insert(subcategoryInserts);

      if (subError) throw subError;

      setSuccessMsg('Servicios y precios guardados con éxito.');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar servicios.');
    } finally {
      setLoading(false);
    }
  };

  // Guardar Ubicación
  const handleSaveLocation = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          department,
          municipality,
          latitude,
          longitude,
        })
        .eq('id', profile.id);

      if (error) throw error;
      setSuccessMsg('Ubicación de cobertura actualizada.');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar ubicación.');
    } finally {
      setLoading(false);
    }
  };

  // Solicitar Ubicación GPS
  const requestGPS = () => {
    setGpsStatus('fetching');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGpsStatus('granted');
      },
      () => {
        setGpsStatus('denied');
        setErrorMsg('Permiso de GPS denegado. No pudimos extraer tus coordenadas.');
      }
    );
  };

  // Subir foto de perfil nueva
  const handleAvatarUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      setErrorMsg(null);
      try {
        const compressed = await compressLocalImage(file);
        const url = await uploadImage(compressed, 'avatars');
        
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: url })
          .eq('id', profile.id);

        if (error) throw error;
        setAvatarUrl(url);
        setSuccessMsg('Foto de perfil actualizada.');
        router.refresh();
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al subir la imagen.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Subir imagen al portafolio
  const handleAddPortfolio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setLoading(true);
      setErrorMsg(null);
      try {
        const compressed = await compressLocalImage(files[0]);
        const url = await uploadImage(compressed, 'portfolio');

        const { data, error } = await supabase
          .from('portfolio_items')
          .insert({
            profile_id: profile.id,
            title: `Proyecto ${currentPortfolio.length + 1}`,
            image_url: url,
          })
          .select()
          .single();

        if (error) throw error;
        setCurrentPortfolio((prev) => [data, ...prev]);
        setSuccessMsg('Imagen añadida a tu portafolio.');
        router.refresh();
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al añadir al portafolio.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Eliminar imagen del portafolio
  const handleDeletePortfolio = async (itemId: string) => {
    if (!confirm('¿Estás seguro de eliminar este proyecto del portafolio?')) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      setCurrentPortfolio((prev) => prev.filter((item) => item.id !== itemId));
      setSuccessMsg('Imagen eliminada de tu portafolio.');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubcategoryToggle = (id: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(id) ? prev.filter((subId) => subId !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      {/* Sidebar de navegación */}
      <aside className="w-64 border-r border-white/10 bg-slate-900/40 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          <div>
            <h1 className="text-xl font-extrabold tracking-wider">
              ALAMANO<span className="bg-gradient-to-r from-violet-400 to-teal-400 bg-clip-text text-transparent">V2</span>
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Panel de Profesional</p>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'profile', label: 'Mi Perfil', icon: User },
              { id: 'services', label: 'Servicios y Precios', icon: Briefcase },
              { id: 'location', label: 'Cobertura / GPS', icon: MapPin },
              { id: 'portfolio', label: 'Mi Portafolio', icon: ImageIcon },
              { id: 'metrics', label: 'Estadísticas', icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex w-full items-center gap-3 rounded-xl py-3 px-4 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/10'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-4">
          <a
            href={`/profesionales/${profile.id}`}
            target="_blank"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900 py-2.5 text-xs font-semibold hover:border-violet-500 hover:bg-slate-800 transition"
          >
            Ver Mi Perfil Público <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-xl py-3 px-4 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut className="h-5 w-5" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Area de Contenido */}
      <main className="flex-1 p-10 max-w-4xl">
        {/* Banner de Estado / Feedback */}
        {successMsg && (
          <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-teal-500/20 bg-teal-500/10 p-4 text-sm text-teal-400">
            <Check className="h-5 w-5" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            <Trash2 className="h-5 w-5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: PERFIL */}
        {activeTab === 'profile' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold">Configuración de Perfil</h2>
              <p className="text-sm text-slate-400">Edita los datos básicos que ven tus futuros clientes.</p>
            </div>

            <div className="flex items-center gap-6 rounded-2xl border border-white/10 bg-slate-900/30 p-6">
              <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-700 bg-slate-950">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-600 font-bold">
                    {fullName[0]}
                  </div>
                )}
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Foto de Perfil</h4>
                <label className="rounded-xl border border-slate-700 hover:border-teal-500 bg-slate-950 py-2 px-4 text-xs font-semibold cursor-pointer transition">
                  Cambiar Foto
                  <input type="file" accept="image/*" disabled={loading} onChange={handleAvatarUpdate} className="hidden" />
                </label>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nombre Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Teléfono (WhatsApp)</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Biografía Profesional</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Facebook URL</label>
                  <input
                    type="text"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Instagram URL</label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-teal-500 py-3 px-6 text-sm font-bold text-slate-950 hover:bg-teal-400 disabled:opacity-50 transition"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar Cambios
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: SERVICIOS Y PRECIOS */}
        {activeTab === 'services' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold">Servicios y Tarifas</h2>
              <p className="text-sm text-slate-400">Define los oficios que realizas y tus cobros estimados por servicio.</p>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {categories.map((cat) => (
                <div key={cat.id} className="space-y-2">
                  <h4 className="text-sm font-semibold text-teal-400">{cat.name}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {cat.subcategories.map((sub) => (
                      <label
                        key={sub.id}
                        className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${
                          selectedSubcategories.includes(sub.id)
                            ? 'border-teal-500 bg-teal-500/10 text-white'
                            : 'border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-450'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubcategories.includes(sub.id)}
                          onChange={() => handleSubcategoryToggle(sub.id)}
                          className="hidden"
                        />
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border ${
                            selectedSubcategories.includes(sub.id) ? 'border-teal-500 bg-teal-500' : 'border-slate-700'
                          }`}
                        >
                          {selectedSubcategories.includes(sub.id) && <Check className="h-3 w-3 text-slate-950" />}
                        </div>
                        <span className="text-xs">{sub.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tarifa Mínima ($)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pr-4 pl-8 outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tarifa Máxima ($)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pr-4 pl-8 outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveServices}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-teal-500 py-3 px-6 text-sm font-bold text-slate-950 hover:bg-teal-400 disabled:opacity-50 transition"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar Servicios
            </button>
          </div>
        )}

        {/* TAB 3: UBICACIÓN */}
        {activeTab === 'location' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold">Zona de Cobertura</h2>
              <p className="text-sm text-slate-400">Modifica tus áreas de atención y tus coordenadas de geolocalización.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Departamento</label>
                <select
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setMunicipality('');
                  }}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 outline-none focus:border-teal-500"
                >
                  {EL_SALVADOR_LOCATIONS.map((d) => (
                    <option key={d.slug} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Municipio</label>
                <select
                  value={municipality}
                  disabled={!department}
                  onChange={(e) => setMunicipality(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 outline-none focus:border-teal-500 disabled:opacity-50"
                >
                  <option value="">Selecciona un municipio</option>
                  {municipalities.map((m) => (
                    <option key={m.slug} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-teal-500/20 bg-slate-950/80 p-5 space-y-4">
                <div className="flex gap-3">
                  <Navigation className="h-6 w-6 text-teal-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-semibold">Actualizar Coordenadas GPS</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Mantener tu ubicación GPS exacta te ayuda a posicionarte mejor para los clientes en tu rango de cercanía de forma totalmente automatizada.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <button
                    type="button"
                    onClick={requestGPS}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 py-2.5 px-5 text-sm font-semibold text-white transition"
                  >
                    Obtener GPS Actual
                  </button>

                  <span className="text-xs text-slate-500">
                    {latitude && longitude
                      ? `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
                      : 'GPS no configurado.'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSaveLocation}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-teal-500 py-3 px-6 text-sm font-bold text-slate-950 hover:bg-teal-400 disabled:opacity-50 transition"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar Ubicación
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: PORTAFOLIO */}
        {activeTab === 'portfolio' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Muestras de Trabajo</h2>
                <p className="text-sm text-slate-400">Sube fotos de tus mejores trabajos anteriores.</p>
              </div>

              <label className="flex items-center gap-2 rounded-xl bg-teal-500 py-2.5 px-4 text-sm font-bold text-slate-950 hover:bg-teal-400 cursor-pointer transition">
                <Plus className="h-4 w-4" /> Agregar Foto
                <input type="file" accept="image/*" disabled={loading} onChange={handleAddPortfolio} className="hidden" />
              </label>
            </div>

            {currentPortfolio.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-12 text-center text-slate-500">
                <ImageIcon className="h-12 w-12 mx-auto text-slate-700 mb-3" />
                <p className="text-sm">Aún no has agregado fotos a tu portafolio.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {currentPortfolio.map((item) => (
                  <div key={item.id} className="group relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-200">
                      <button
                        onClick={() => handleDeletePortfolio(item.id)}
                        disabled={loading}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500 transition"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ESTADÍSTICAS / METRICS */}
        {activeTab === 'metrics' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold">Rendimiento de Perfil</h2>
              <p className="text-sm text-slate-400">Monitorea el interés de los clientes en tus servicios.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-6 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Visitas al Perfil</span>
                <p className="text-4xl font-extrabold text-white">124</p>
                <span className="text-[10px] text-teal-400">+12% esta semana</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-6 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Clics en WhatsApp</span>
                <p className="text-4xl font-extrabold text-teal-400">42</p>
                <span className="text-[10px] text-slate-400">Contactos directos</span>
              </div>
            </div>

            {/* Destaques info banner */}
            <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-r from-teal-500/5 to-violet-500/5 p-6 space-y-4">
              <h4 className="text-sm font-semibold">¿Quieres conseguir más clientes?</h4>
              <p className="text-xs text-slate-400">
                Los perfiles destacados reciben hasta **5 veces más visitas** y aparecen en el carrusel principal de la plataforma. Configura tu anuncio destacado y resalta hoy mismo en El Salvador.
              </p>
              <button
                type="button"
                className="rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 py-2.5 px-5 text-xs font-bold text-white hover:from-violet-500 hover:to-teal-400 transition"
              >
                Destacar Mi Anuncio
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
