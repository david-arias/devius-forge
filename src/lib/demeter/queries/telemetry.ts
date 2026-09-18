import { createServerSupabaseClient } from "@/lib/supabase/server";

export type TelemetryEventName = "cv_downloaded" | "contact_message_sent" | "achievement_unlocked";

export interface TelemetryEventStat {
  total: number;
  last7d: number;
  lastAt: string | null;
}

export interface AchievementStat {
  id: string;
  title: string;
  total: number;
}

export interface TelemetryStats {
  byEvent: Record<TelemetryEventName, TelemetryEventStat>;
  achievements: AchievementStat[];
  totalEvents: number;
}

const EMPTY: TelemetryEventStat = { total: 0, last7d: 0, lastAt: null };
const EVENT_NAMES: TelemetryEventName[] = ["cv_downloaded", "contact_message_sent", "achievement_unlocked"];

/**
 * getTelemetryStats — Deméter, Iteración 25. SERVER-ONLY, sin caché (datos
 * privados leídos con la sesión del admin; RLS sólo deja leer a
 * `authenticated`). Agrega en Postgres vía las RPC de `008_telemetry.sql`
 * (`get_telemetry_stats`, `get_achievement_stats`) — no trae filas crudas.
 *
 * Lanza si la tabla/funciones no existen: la página lo muestra como aviso.
 */
export async function getTelemetryStats(): Promise<TelemetryStats> {
  const supabase = await createServerSupabaseClient();

  const [events, achievements] = await Promise.all([
    supabase.rpc("get_telemetry_stats"),
    supabase.rpc("get_achievement_stats"),
  ]);

  if (events.error) throw new Error(`No se pudo leer la telemetría: ${events.error.message}`);
  if (achievements.error) throw new Error(`No se pudo leer la telemetría de logros: ${achievements.error.message}`);

  const byEvent = Object.fromEntries(EVENT_NAMES.map((name) => [name, { ...EMPTY }])) as Record<
    TelemetryEventName,
    TelemetryEventStat
  >;

  let totalEvents = 0;
  for (const row of (events.data ?? []) as { event_name: string; total: number | string; last_7d: number | string; last_at: string | null }[]) {
    if (!EVENT_NAMES.includes(row.event_name as TelemetryEventName)) continue;
    const total = Number(row.total);
    totalEvents += total;
    byEvent[row.event_name as TelemetryEventName] = {
      total,
      last7d: Number(row.last_7d),
      lastAt: row.last_at,
    };
  }

  const achievementRows = (achievements.data ?? []) as { achievement_id: string | null; title: string | null; total: number | string }[];

  return {
    byEvent,
    totalEvents,
    achievements: achievementRows
      .filter((row) => row.achievement_id)
      .map((row) => ({
        id: row.achievement_id as string,
        title: row.title ?? (row.achievement_id as string),
        total: Number(row.total),
      })),
  };
}
