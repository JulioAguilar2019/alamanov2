import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Crea un cliente de Supabase para su uso exclusivo en Server Components,
 * Server Actions o Route Handlers de Next.js, manejando las cookies.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // El método setAll puede fallar si se llama desde un Server Component
            // que está renderizando la página (ya que las cabeceras HTTP ya fueron enviadas).
            // Esto es normal y esperado en Next.js.
          }
        },
      },
    }
  );
}
