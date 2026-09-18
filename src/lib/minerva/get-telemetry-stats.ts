import { getTelemetryStats as fetchTelemetryStats } from "@/lib/demeter/queries/telemetry";

/**
 * Servicio de Minerva (Iteración 25): telemetría propia lista para el panel.
 * Server-only — NO se re-exporta desde `lib/minerva/index.ts` para que ningún
 * import público arrastre el cliente con cookies.
 */
export async function getTelemetryStatsForView() {
  try {
    return { stats: await fetchTelemetryStats(), error: null as string | null };
  } catch (err) {
    return { stats: null, error: err instanceof Error ? err.message : "Error desconocido." };
  }
}
