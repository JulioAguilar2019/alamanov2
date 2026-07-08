import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/modules/dashboard/DashboardLayout';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // 1. Obtener datos del perfil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    // Si no hay perfil, crearlo por seguridad o redirigir
    redirect('/auth/login');
  }

  // 2. Si el perfil no ha completado el onboarding, redirigir
  if (profile.department === 'Desconocido') {
    redirect('/auth/onboarding');
  }

  // 3. Obtener subcategorías asociadas al perfil
  const { data: profileSubs } = await supabase
    .from('profile_subcategories')
    .select('subcategory_id')
    .eq('profile_id', user.id);

  const selectedSubcategoryIds = profileSubs?.map((ps) => ps.subcategory_id) || [];

  // 4. Obtener items del portafolio
  const { data: portfolioItems } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });

  // 5. Obtener todas las categorías y subcategorías disponibles para edición
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, subcategories(id, name)');

  return (
    <DashboardLayout
      profile={profile}
      initialSubcategoryIds={selectedSubcategoryIds}
      portfolioItems={portfolioItems || []}
      categories={categories || []}
    />
  );
}
