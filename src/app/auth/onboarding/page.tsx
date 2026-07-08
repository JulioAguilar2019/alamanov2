'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { EL_SALVADOR_LOCATIONS } from '@/lib/location-data';
import { compressLocalImage } from '@/lib/image-compression';
import { uploadImage } from '@/lib/image-upload-helper';
import {
  User,
  Briefcase,
  MapPin,
  Image as ImageIcon,
  Loader2,
  Check,
  ChevronRight,
  ChevronLeft,
  Navigation,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface CategoryWithSubcategories {
  id: string;
  name: string;
  subcategories: {
    id: string;
    name: string;
  }[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
  const [fetchingCategories, setFetchingCategories] = useState(true);

  // Estados del Formulario
  const [fullName, setFullName] = useState('');
  const [description, setDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [minPrice, setMinPrice] = useState('10');
  const [maxPrice, setMaxPrice] = useState('50');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [department, setDepartment] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'fetching' | 'granted' | 'denied'>('idle');

  // Archivos de Imagen
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([]);

  // Mensaje de Error
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Obtener usuario autenticado y categorías
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      setUserId(session.user.id);
      setFullName(session.user.user_metadata?.full_name || '');

      // Cargar categorías y subcategorías de la BD
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, subcategories(id, name)');

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error('Error al cargar categorías:', err);
      } finally {
        setFetchingCategories(false);
      }
    }
    init();
  }, [router, supabase]);

  // Generar link de WhatsApp automáticamente al cambiar número
  useEffect(() => {
    if (phoneNumber) {
      // Remover caracteres no numéricos
      const cleanNum = phoneNumber.replace(/\D/g, '');
      // Si no empieza con código de El Salvador (503) y tiene 8 dígitos, agregarlo
      const formattedNum = cleanNum.length === 8 ? `503${cleanNum}` : cleanNum;
      setWhatsappLink(`https://wa.me/${formattedNum}`);
    } else {
      setWhatsappLink('');
    }
  }, [phoneNumber]);

  // Solicitar ubicación GPS de manera amigable
  const requestGPSLocation = () => {
    setGpsStatus('fetching');
    setErrorMsg(null);

    if (!navigator.geolocation) {
      setGpsStatus('denied');
      setErrorMsg('La geolocalización no está soportada por tu navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setGpsStatus('granted');
      },
      (error) => {
        console.warn('GPS permiso denegado', error);
        setGpsStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Manejar cambio de Avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Solo se permiten archivos de imagen.');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  // Manejar cambio de imágenes de portafolio
  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles: File[] = [];
      const previews: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          validFiles.push(file);
          previews.push(URL.createObjectURL(file));
        }
      }

      if (portfolioFiles.length + validFiles.length > 5) {
        setErrorMsg('Puedes subir un máximo de 5 fotos de portafolio en el MVP.');
        return;
      }

      setPortfolioFiles((prev) => [...prev, ...validFiles]);
      setPortfolioPreviews((prev) => [...prev, ...previews]);
      setErrorMsg(null);
    }
  };

  const removePortfolioImage = (index: number) => {
    setPortfolioFiles((prev) => prev.filter((_, i) => i !== index));
    setPortfolioPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Enviar Onboarding a la Base de Datos
  const handleFinish = async () => {
    if (!userId) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Validaciones
      if (!department || !municipality) {
        throw new Error('Debes seleccionar tu departamento y municipio.');
      }
      if (selectedSubcategories.length === 0) {
        throw new Error('Debes seleccionar al menos una subcategoría de servicios.');
      }

      let uploadedAvatarUrl = '';
      const uploadedPortfolioUrls: string[] = [];

      // 2. Comprimir y subir Avatar
      if (avatarFile) {
        const compressedAvatar = await compressLocalImage(avatarFile);
        uploadedAvatarUrl = await uploadImage(compressedAvatar, 'avatars');
      }

      // 3. Comprimir y subir Fotos de Portafolio
      for (const file of portfolioFiles) {
        const compressedFile = await compressLocalImage(file);
        const url = await uploadImage(compressedFile, 'portfolio');
        uploadedPortfolioUrls.push(url);
      }

      // 4. Actualizar tabla profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: fullName,
          description: description,
          phone_number: phoneNumber,
          whatsapp_link: whatsappLink,
          min_price: parseFloat(minPrice),
          max_price: parseFloat(maxPrice),
          department: department,
          municipality: municipality,
          latitude: latitude,
          longitude: longitude,
          avatar_url: uploadedAvatarUrl || undefined,
        });

      if (profileError) throw profileError;

      // 5. Vincular subcategorías (limpiar antiguas e insertar nuevas)
      await supabase
        .from('profile_subcategories')
        .delete()
        .eq('profile_id', userId);

      const subcategoryInserts = selectedSubcategories.map((subId) => ({
        profile_id: userId,
        subcategory_id: subId,
      }));

      const { error: subError } = await supabase
        .from('profile_subcategories')
        .insert(subcategoryInserts);

      if (subError) throw subError;

      // 6. Insertar items del portafolio
      if (uploadedPortfolioUrls.length > 0) {
        const portfolioInserts = uploadedPortfolioUrls.map((url, index) => ({
          profile_id: userId,
          title: `Proyecto ${index + 1}`,
          image_url: url,
        }));

        const { error: portError } = await supabase
          .from('portfolio_items')
          .insert(portfolioInserts);

        if (portError) throw portError;
      }

      // Redirigir al dashboard finalizado con éxito
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error('Error al completar onboarding:', err);
      setErrorMsg(err.message || 'Ocurrió un error al guardar los datos.');
      setLoading(false);
    }
  };

  const handleSubcategoryToggle = (id: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(id) ? prev.filter((subId) => subId !== id) : [...prev, id]
    );
  };

  // Obtener municipios filtrados
  const selectedDepartmentData = EL_SALVADOR_LOCATIONS.find((d) => d.name === department);
  const municipalities = selectedDepartmentData ? selectedDepartmentData.municipalities : [];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 text-white">
      {/* Glow Effects */}
      <div className="absolute top-10 left-10 -z-10 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="absolute bottom-10 right-10 -z-10 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="w-full max-w-2xl">
        {/* Indicador de Pasos */}
        <div className="mb-8 flex items-center justify-between px-4">
          {[
            { step: 1, label: 'Perfil', icon: User },
            { step: 2, label: 'Servicios', icon: Briefcase },
            { step: 3, label: 'Ubicación', icon: MapPin },
            { step: 4, label: 'Fotos', icon: ImageIcon },
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center space-y-1">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition duration-300 ${
                  step === item.step
                    ? 'border-teal-400 bg-teal-500/20 text-teal-400 shadow-md'
                    : step > item.step
                    ? 'border-violet-500 bg-violet-600 text-white'
                    : 'border-slate-800 bg-slate-900 text-slate-500'
                }`}
              >
                {step > item.step ? <Check className="h-5 w-5" /> : <item.icon className="h-5 w-5" />}
              </div>
              <span
                className={`text-xs font-medium ${
                  step >= item.step ? 'text-slate-200' : 'text-slate-600'
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Contenido de la Tarjeta */}
        <div className="border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl rounded-2xl">
          {errorMsg && (
            <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* PASO 1: Información Profesional */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold">Cuéntanos sobre ti</h3>
                <p className="text-sm text-slate-400">Introduce tus datos básicos profesionales para mostrar a tus clientes.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nombre Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 outline-none focus:border-teal-500"
                  placeholder="Tu nombre y apellido"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Teléfono Celular</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 outline-none focus:border-teal-500"
                  placeholder="Ej: 71234567"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sobre tu Trabajo / Oficio</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 outline-none focus:border-teal-500"
                  placeholder="Describe tus habilidades, experiencia y lo que ofreces..."
                />
              </div>
            </div>
          )}

          {/* PASO 2: Selección de Servicios y Tarifas */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold">Servicios y Tarifas</h3>
                <p className="text-sm text-slate-400">Selecciona los servicios que realizas y define tu rango estimado de precios.</p>
              </div>

              {fetchingCategories ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="space-y-2">
                      <h4 className="text-sm font-semibold text-teal-400">{cat.name}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cat.subcategories?.map((sub) => (
                          <label
                            key={sub.id}
                            className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition ${
                              selectedSubcategories.includes(sub.id)
                                ? 'border-teal-500 bg-teal-500/10 text-white'
                                : 'border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400'
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
                                selectedSubcategories.includes(sub.id)
                                  ? 'border-teal-500 bg-teal-500'
                                  : 'border-slate-700'
                              }`}
                            >
                              {selectedSubcategories.includes(sub.id) && <Check className="h-3 w-3 text-slate-950" />}
                            </div>
                            <span className="text-sm">{sub.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rango de Precios */}
              <div className="grid grid-cols-2 gap-4">
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
            </div>
          )}

          {/* PASO 3: Ubicación Geográfica */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold">Tu Zona de Cobertura</h3>
                <p className="text-sm text-slate-400">Configura dónde trabajas para mostrarte a clientes de tu sector.</p>
              </div>

              {/* Select de Departamento */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Departamento</label>
                <select
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setMunicipality(''); // Reiniciar municipio
                  }}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 outline-none focus:border-teal-500"
                >
                  <option value="">Selecciona un departamento</option>
                  {EL_SALVADOR_LOCATIONS.map((d) => (
                    <option key={d.slug} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select de Municipio */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Municipio / Distrito</label>
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

              {/* Geolocalización por GPS (Llamativa y amigable) */}
              <div className="rounded-xl border border-teal-500/20 bg-slate-950/80 p-5 space-y-4">
                <div className="flex gap-3">
                  <Navigation className="h-6 w-6 text-teal-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-semibold">Habilitar ubicación GPS</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Al aceptar los permisos de ubicación en tu navegador, nuestro sistema calculará tu distancia exacta a los clientes. **Esto permite que aparezcas automáticamente en los primeros lugares** para los clientes que busquen servicios cerca de tu zona geográfica.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <button
                    type="button"
                    onClick={requestGPSLocation}
                    disabled={gpsStatus === 'fetching'}
                    className={`flex items-center gap-2 rounded-xl py-2.5 px-5 text-sm font-semibold transition ${
                      gpsStatus === 'granted'
                        ? 'bg-teal-500 text-slate-950 font-bold hover:bg-teal-400'
                        : 'bg-violet-600 hover:bg-violet-500 text-white'
                    }`}
                  >
                    {gpsStatus === 'fetching' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : gpsStatus === 'granted' ? (
                      <>
                        <Check className="h-4 w-4" /> GPS Activado
                      </>
                    ) : (
                      'Autorizar Ubicación GPS'
                    )}
                  </button>

                  <span className="text-xs text-slate-500">
                    {gpsStatus === 'granted' && latitude && longitude
                      ? `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
                      : gpsStatus === 'denied'
                      ? 'Permiso rechazado. Usaremos la división municipal.'
                      : 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* PASO 4: Imagen de Perfil y Fotos de Portafolio */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold">Imágenes de tu Trabajo</h3>
                <p className="text-sm text-slate-400">Una buena foto de perfil y muestras de tus proyectos incrementan tus cotizaciones hasta en un 80%.</p>
              </div>

              {/* Subir Foto de Perfil */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Foto de Perfil (Avatar)</label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-700 bg-slate-950 flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar Preview" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-slate-600" />
                    )}
                  </div>
                  <label className="rounded-xl border border-slate-700 hover:border-teal-500 bg-slate-950 py-2.5 px-4 text-sm font-semibold cursor-pointer transition">
                    Cargar Foto
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Subir Fotos del Portafolio */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fotos de Portafolio (Máximo 5)</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {portfolioPreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                      <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePortfolioImage(index)}
                        className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] hover:bg-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {portfolioFiles.length < 5 && (
                    <label className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 bg-slate-950 cursor-pointer hover:border-teal-500 hover:bg-slate-900 transition">
                      <ImageIcon className="h-6 w-6 text-slate-600" />
                      <span className="text-[10px] text-slate-600 mt-1">Agregar</span>
                      <input type="file" accept="image/*" multiple onChange={handlePortfolioChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navegación de Pasos */}
          <div className="mt-8 flex justify-between gap-4 border-t border-slate-800 pt-6">
            <button
              type="button"
              onClick={() => setStep((prev) => prev - 1)}
              disabled={step === 1 || loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 py-3 px-5 text-sm font-semibold text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  if (step === 1 && (!fullName || !phoneNumber || !description)) {
                    setErrorMsg('Por favor completa todos los campos.');
                    return;
                  }
                  if (step === 2 && selectedSubcategories.length === 0) {
                    setErrorMsg('Por favor selecciona al menos una subcategoría.');
                    return;
                  }
                  if (step === 3 && (!department || !municipality)) {
                    setErrorMsg('Por favor selecciona tu departamento y municipio.');
                    return;
                  }
                  setStep((prev) => prev + 1);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 py-3 px-5 text-sm font-semibold text-white hover:from-violet-500 hover:to-teal-400 transition"
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-teal-500 py-3 px-6 text-sm font-bold text-slate-950 hover:bg-teal-400 disabled:opacity-50 transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  'Finalizar Registro'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
