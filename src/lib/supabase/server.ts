import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para SERVER (Eleuthia/Éter, Iteración 14 — "La Forja
 * Oculta"). Complementa a `client.ts` (cliente de navegador, `anon key`,
 * pensado para Client Components) con la mitad que faltaba: Server
 * Components, Route Handlers y `proxy.ts` necesitan leer/escribir la
 * sesión de Auth desde las COOKIES de la request, no desde `localStorage`
 * (que no existe en el server) — `@supabase/ssr` es el reemplazo oficial y
 * mantenido del extinto `@supabase/auth-helpers-nextjs` para exactamente
 * este caso (ver docs de Supabase, "Server-Side Auth for Next.js App
 * Router").
 *
 * Sigue usando la MISMA `anon key` pública que `client.ts` — no la
 * `service_role key`. La autenticación real (quién sos) vive en la cookie
 * de sesión que el usuario ya trae; RLS (ver `sql/001_init.sql` y
 * `sql/002_admin_tables.sql`) es lo que decide qué puede hacer ese usuario
 * autenticado. Nunca hace falta bypassear RLS para este panel admin de un
 * solo usuario.
 *
 * `createClient()` es async porque `cookies()` de Next.js App Router lo es
 * desde Next 15+ — hay que await-earla en cada Server Component/Route
 * Handler que llame a esta función (no se puede cachear un singleton como
 * en `client.ts`: cada request trae sus propias cookies).
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase no está configurado todavía: faltan NEXT_PUBLIC_SUPABASE_URL / " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local. Ver src/lib/supabase/SETUP.md."
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // `setAll` puede llamarse desde un Server Component (no desde un
          // Route Handler ni `proxy.ts`), donde Next.js no permite
          // escribir cookies — se ignora a propósito. `proxy.ts` es
          // quien realmente refresca la sesión en cada request; este catch
          // sólo evita que un Server Component que sólo LEE la sesión
          // rompa con un error de "cannot set cookies" al hacerlo.
        }
      },
    },
  });
}
