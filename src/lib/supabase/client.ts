import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MISSING_SUPABASE_ENV_MESSAGE, readSupabaseEnv, type SupabaseEnv } from "./env";

/**
 * Cliente de Supabase (Deméter/Eleuthia/Éter, Iteración 12 — preparación
 * de backend). Cubre las tres piezas que el proyecto va a necesitar de
 * Supabase: Database (Deméter — reemplaza `fetchXFromSource` en
 * `src/lib/demeter/queries/*.ts`, ver Iteración 10 y `schema.ts` acá al
 * lado), Auth (Eleuthia — sesión del panel admin) y Storage (Éter — bucket
 * `quest-images`, ver abajo).
 *
 * Este es el cliente de NAVEGADOR/cliente-público — usa la `anon key`, que
 * es segura de exponer en el bundle del cliente SIEMPRE que la tabla tenga
 * Row Level Security (RLS) habilitado con políticas de sólo-lectura pública
 * (ver `schema.ts`). NUNCA pongas acá la `service_role key` — esa key
 * bypassea RLS por completo y sólo debe vivir en código server-only (una
 * Server Action o Route Handler, nunca en un archivo que un Client
 * Component pueda importar).
 *
 * FIX (post-entrega Iteración 14): este archivo usaba `createClient` de
 * `@supabase/supabase-js` con `persistSession: true`, que guarda la sesión
 * en `localStorage`. El problema: `src/lib/supabase/server.ts` y
 * `src/proxy.ts` usan `createServerClient` de `@supabase/ssr`, que SÓLO
 * lee la sesión desde COOKIES — nunca desde `localStorage`. Resultado:
 * el login "funcionaba" (signInWithPassword devolvía éxito, sin error
 * visible) pero el server nunca se enteraba de la sesión nueva, así que
 * `proxy.ts` seguía viendo al usuario como anónimo y rebotaba
 * silenciosamente `/admin` de vuelta a `/admin/login` — el botón se
 * quedaba trabado en "Entrando…" sin redirect ni error real. La solución
 * es usar `createBrowserClient` de `@supabase/ssr` acá: escribe la sesión
 * en cookies (con el mismo formato que `server.ts`/`proxy.ts` esperan) en
 * vez de `localStorage`, así el browser y el server quedan sincronizados
 * en la MISMA fuente de verdad de sesión.
 *
 * Variables de entorno esperadas en `.env.local` (ver `.env.local.example`
 * en la raíz del proyecto):
 *   SUPABASE_URL=https://<project-ref>.supabase.co
 *   SUPABASE_ANON_KEY=<anon-public-key>
 *
 * Inicialización perezosa (lazy singleton) a propósito: este archivo puede
 * importarse en build-time (SSG) antes de que `.env.local` exista todavía
 * en este entorno — construir el cliente recién en el primer uso real
 * evita que un `import` suelto rompa `next build` mientras Supabase no
 * esté conectado de verdad. Cuando SÍ se conecte, alcanza con crear
 * `.env.local` — ningún código de acá tiene que cambiar.
 */
let cachedClient: SupabaseClient | null = null;

/**
 * Config inyectada por `SupabaseRuntimeConfig` (Iteración 28). En el
 * navegador NO hay `process.env` con estos valores (ya no llevan prefijo
 * `NEXT_PUBLIC_`): el layout los pasa como props desde el servidor y este
 * módulo los guarda acá antes de que cualquier handler cree el cliente.
 */
let runtimeConfig: SupabaseEnv | null = null;

export function setSupabaseRuntimeConfig(config: SupabaseEnv) {
  // Sólo la primera vez: el cliente ya cacheado no debe cambiar de proyecto a mitad de sesión.
  if (!runtimeConfig) runtimeConfig = config;
}

/** `true` si ya hay credenciales (útil para no intentar llamadas condenadas a fallar). */
export function hasSupabaseConfig(): boolean {
  if (runtimeConfig) return true;
  const env = readSupabaseEnv();
  return Boolean(env.url && env.anonKey);
}

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  // 1) Config de runtime (navegador) · 2) env del proceso (servidor/build).
  const { url, anonKey } = runtimeConfig ?? readSupabaseEnv();

  if (!url || !anonKey) {
    throw new Error(MISSING_SUPABASE_ENV_MESSAGE);
  }

  // `createBrowserClient` (no `createClient` de `@supabase/supabase-js`):
  // persiste la sesión en cookies, no en `localStorage`, para que
  // `src/lib/supabase/server.ts` y `src/proxy.ts` (que leen la sesión vía
  // `@supabase/ssr` + cookies) vean la MISMA sesión que este cliente crea
  // en el login. Ver comentario largo arriba.
  cachedClient = createBrowserClient(url, anonKey);

  return cachedClient;
}

/**
 * Nombre del bucket de Storage para las imágenes/mockups reales de cada
 * Quest (ver Iteración 9 — `quest.media` y `caseStudy.media` en el schema
 * de Deméter ya están preparados para recibir URLs de acá). Centralizado
 * en una constante para no tener el string repetido/desincronizado entre
 * el código y el bucket real creado en el dashboard de Supabase.
 */
export const QUEST_IMAGES_BUCKET = "quest-images";
