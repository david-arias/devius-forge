"use client";

import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Telemetría de la Forja — Minerva, Iteración 24 → migrada a Supabase en la 25.
 *
 * Los Custom Events de Vercel son sólo del plan Pro, así que los eventos
 * propios se guardan en `public.telemetry_events` (`008_telemetry.sql`).
 * `<Analytics />`/`<SpeedInsights />` siguen montados para visitas y Web
 * Vitals (gratis) — ver `components/poseidon/Telemetry.tsx`.
 *
 * Contrato:
 *  - Catálogo tipado: nombres y propiedades cerrados (deben coincidir con el
 *    CHECK de la tabla). Nunca datos personales.
 *  - Fire-and-forget: no se espera la respuesta, nunca lanza, nunca bloquea
 *    la UI (un CV se descarga igual aunque Supabase esté caído).
 *  - No ensucia datos: apagado en `next dev` (salvo
 *    `NEXT_PUBLIC_TELEMETRY_DEV=true`) y en rutas `/admin`.
 */
type ForgeEvents = {
  cv_downloaded: { source: "hero" | "mobile_menu" | "footer" };
  contact_message_sent: { source: "footer_form" };
  achievement_unlocked: { id: string; title: string };
};

export type ForgeEventName = keyof ForgeEvents;

const TELEMETRY_ENABLED =
  process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_TELEMETRY_DEV === "true";

export function trackForgeEvent<E extends ForgeEventName>(name: E, properties: ForgeEvents[E]) {
  if (!TELEMETRY_ENABLED || typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin")) return;

  try {
    const payload = {
      event_name: name,
      properties: { ...properties, path: window.location.pathname },
    };
    // Los builders de supabase-js son "lazy": la request sólo sale al llamar
    // `.then()`. Sin `.select()` a propósito — RLS no deja al visitante leer
    // la fila que inserta.
    getSupabaseClient()
      .from("telemetry_events")
      .insert(payload)
      .then(
        ({ error }) => {
          if (error && process.env.NODE_ENV !== "production") {
            console.warn("[Minerva] telemetry insert:", error.message);
          }
        },
        () => {}
      );
  } catch {
    // Supabase sin configurar u otro fallo síncrono: la telemetría nunca rompe una interacción.
  }
}
