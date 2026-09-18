/**
 * Resolución de credenciales de Supabase — Éter, Iteración 28.
 *
 * Por qué existe: la UI nueva de Vercel rechaza guardar variables con
 * prefijo `NEXT_PUBLIC_` como valores privados ("Remove the public
 * framework prefix to keep this value private"). Para no depender de ese
 * prefijo, el proyecto pasó a leer `SUPABASE_URL` / `SUPABASE_ANON_KEY`
 * (sin prefijo, server-only) y a pasarle esos valores al navegador EN
 * TIEMPO DE EJECUCIÓN desde el layout (ver `SupabaseRuntimeConfig.tsx`),
 * en vez de que Next.js los incruste en el bundle en build time.
 *
 * Los nombres viejos (`NEXT_PUBLIC_*`) siguen funcionando como fallback,
 * así que un `.env.local` o un deploy ya configurado no se rompe.
 *
 * ⚠️ Honestidad técnica: la `anon key` SIGUE llegando al navegador — es
 * obligatorio para que el login del CMS, la subida de imágenes y la
 * telemetría funcionen desde el cliente. Lo que cambia es CÓMO viaja
 * (payload del servidor, no variable de build) y cómo se guarda en
 * Vercel. Lo que protege los datos es RLS, no ocultar esta key.
 */
export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export function readSupabaseEnv(): Partial<SupabaseEnv> {
  return {
    url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export const MISSING_SUPABASE_ENV_MESSAGE =
  "Supabase no está configurado todavía: faltan SUPABASE_URL / SUPABASE_ANON_KEY " +
  "(en Vercel, como variables privadas; en local, en .env.local). " +
  "Mientras tanto, el sitio muestra sus estados vacíos.";
