"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Telemetría de Vercel — Poseidón, Iteración 24.
 *
 * - Sólo se monta en builds de producción (ver `layout.tsx`): `next dev`
 *   nunca carga los scripts, así que no ensucia las métricas.
 * - `beforeSend` descarta todo lo que venga de `/admin` (el CMS no es
 *   tráfico de visitantes) y limpia query strings (p. ej. `?next=`).
 * - Vive en un Client Component porque `beforeSend` es una función y no
 *   puede cruzar la frontera Server → Client desde el layout.
 */
function scrubEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = new URL(event.url);
  if (url.pathname.startsWith("/admin")) return null;
  url.search = "";
  return { ...event, url: url.toString() };
}

export function Telemetry() {
  return (
    <>
      <Analytics beforeSend={scrubEvent} />
      <SpeedInsights
        beforeSend={(data) => (new URL(data.url).pathname.startsWith("/admin") ? null : data)}
      />
    </>
  );
}
