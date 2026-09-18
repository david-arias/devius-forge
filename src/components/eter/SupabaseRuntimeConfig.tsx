"use client";

import { setSupabaseRuntimeConfig } from "@/lib/supabase/client";

interface SupabaseRuntimeConfigProps {
  url?: string;
  anonKey?: string;
}

/**
 * SupabaseRuntimeConfig — Éter, Iteración 28.
 *
 * Puente entre las env vars SERVER-ONLY (`SUPABASE_URL`/`SUPABASE_ANON_KEY`,
 * sin prefijo `NEXT_PUBLIC_`) y el cliente de navegador de Supabase, que
 * necesita esos dos valores para el login del CMS, la subida de imágenes y
 * los inserts de telemetría.
 *
 * `RootLayout` (Server Component) lee las env vars y las pasa como props;
 * este componente las registra en el módulo `lib/supabase/client.ts`
 * durante su render, ANTES de que cualquier interacción del visitante
 * (click, submit) llegue a crear el cliente. No renderiza nada.
 *
 * Por qué sirve: Next.js sólo incrusta en el bundle de cliente las
 * variables con prefijo público, así que sin este puente el navegador no
 * tendría cómo conocerlas. Ahora viajan en el payload del servidor —
 * misma exposición real (la `anon key` es pública por diseño y está
 * protegida por RLS), pero en Vercel las variables se guardan como
 * privadas y desaparece el aviso del prefijo público.
 */
export function SupabaseRuntimeConfig({ url, anonKey }: SupabaseRuntimeConfigProps) {
  if (url && anonKey) setSupabaseRuntimeConfig({ url, anonKey });
  return null;
}
