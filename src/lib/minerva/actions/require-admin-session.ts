import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Segunda línea de defensa dentro de cada Server Action de escritura
 * (Minerva, Iteración 15) — RLS (`001_init.sql`/`002_admin_tables.sql`)
 * ya rechaza la escritura si `auth.role() != 'authenticated'`, pero eso
 * devuelve un error crudo de Postgres. Chequear la sesión acá primero da
 * un mensaje humano ("Sesión expirada…") antes de intentar la mutación,
 * mismo criterio "defense in depth" que `src/app/admin/(protected)/layout.tsx`.
 */
export async function requireAdminSession(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sesión expirada — volvé a iniciar sesión en /admin/login.");
  }
}
