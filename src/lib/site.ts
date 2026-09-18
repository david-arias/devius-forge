/**
 * Configuración pública del sitio — Apolo, Iteración 23 (env renombrada en la 27).
 * Única fuente de verdad del dominio para metadata, JSON-LD, sitemap y robots.
 *
 * `SITE_URL` (sin prefijo `NEXT_PUBLIC_`): este módulo lo consumen SÓLO
 * Server Components y route handlers (`layout.tsx`, `sitemap.ts`,
 * `robots.ts`), así que el valor nunca necesita viajar al navegador —
 * en Vercel se puede guardar como variable privada, sin el aviso de
 * "Remove the public framework prefix".
 *
 * Orden de resolución: `SITE_URL` → `NEXT_PUBLIC_SITE_URL` (compatibilidad
 * con la iteración 23) → dominio de producción de Vercel → `https://devius.dev`.
 *
 * ⚠️ Si algún día un Client Component necesita el dominio, NO agregar el
 * prefijo acá: pasarlo por props desde un Server Component.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return `https://${vercelProd.replace(/\/+$/, "")}`;
  return "https://devius.dev";
}

export const SITE_URL = resolveSiteUrl();

/** Rutas que nunca deben indexarse (robots.ts + cabecera X-Robots-Tag en proxy.ts). */
export const PRIVATE_PATH_PREFIXES = ["/admin", "/api"] as const;
