import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Métricas de capacidad del sistema — Deméter, Iteración 41 ("Capacidad
 * de la Forja"). Llama a la función SQL `public.get_system_metrics()`
 * (`011_system_metrics.sql`, SECURITY DEFINER restringida a
 * `authenticated`) y devuelve los bytes ya formateados (MB/GB) y como
 * porcentaje del plan gratuito de Supabase.
 *
 * Server-only (usa `next/headers` vía `createServerSupabaseClient`): sólo
 * la importa `/admin/page.tsx`. Nunca lanza — si la función SQL todavía
 * no existe (no se corrió la migración) o la sesión expiró, devuelve
 * `{ ok: false, error }` y el dashboard muestra un aviso en vez de caerse.
 */

/** Límites del plan Free de Supabase (usados sólo como referencia visual). */
export const SUPABASE_FREE_LIMITS = {
  dbBytes: 500 * 1024 * 1024, // 500 MB
  storageBytes: 1024 * 1024 * 1024, // 1 GB
} as const;

const MetricsRowSchema = z.object({
  db_bytes: z.coerce.number(),
  storage_bytes: z.coerce.number(),
  storage_objects: z.coerce.number(),
  buckets: z.array(z.object({ id: z.string(), objects: z.coerce.number(), bytes: z.coerce.number() })),
  top_tables: z.array(z.object({ name: z.string(), bytes: z.coerce.number() })),
  measured_at: z.string(),
});

export type UsageLevel = "ok" | "warn" | "critical";

export interface CapacityMetric {
  bytes: number;
  /** "12.4 MB", "1.02 GB"… */
  label: string;
  limitBytes: number;
  limitLabel: string;
  /** 0–100, redondeado a 1 decimal (puede pasar de 100 si se excede el plan). */
  percent: number;
  /** ok < 70% ≤ warn < 90% ≤ critical */
  level: UsageLevel;
}

export interface SystemMetrics {
  database: CapacityMetric;
  storage: CapacityMetric & { objects: number };
  buckets: { id: string; objects: number; bytes: number; label: string }[];
  topTables: { name: string; bytes: number; label: string }[];
  measuredAt: string;
}

export type SystemMetricsResult = { ok: true; metrics: SystemMetrics } | { ok: false; error: string };

/** Bytes → texto legible en base 1024 ("0 B", "845 KB", "12.4 MB", "1.02 GB"). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  const decimals = exponent === 0 ? 0 : value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(decimals)} ${units[exponent]}`;
}

function toCapacity(bytes: number, limitBytes: number): CapacityMetric {
  const percent = Math.round((bytes / limitBytes) * 1000) / 10;
  return {
    bytes,
    label: formatBytes(bytes),
    limitBytes,
    limitLabel: formatBytes(limitBytes),
    percent,
    level: percent >= 90 ? "critical" : percent >= 70 ? "warn" : "ok",
  };
}

export async function getSystemMetrics(): Promise<SystemMetricsResult> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc("get_system_metrics");

    if (error) {
      const missing = error.code === "PGRST202" || /could not find the function/i.test(error.message);
      return {
        ok: false,
        error: missing
          ? "Falta la función get_system_metrics() — corré 011_system_metrics.sql en el SQL Editor de Supabase."
          : `No se pudieron leer las métricas: ${error.message}`,
      };
    }

    const row = MetricsRowSchema.parse(data);
    return {
      ok: true,
      metrics: {
        database: toCapacity(row.db_bytes, SUPABASE_FREE_LIMITS.dbBytes),
        storage: { ...toCapacity(row.storage_bytes, SUPABASE_FREE_LIMITS.storageBytes), objects: row.storage_objects },
        buckets: row.buckets.map((bucket) => ({ ...bucket, label: formatBytes(bucket.bytes) })),
        topTables: row.top_tables.map((table) => ({ ...table, label: formatBytes(table.bytes) })),
        measuredAt: row.measured_at,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudieron leer las métricas del sistema." };
  }
}
