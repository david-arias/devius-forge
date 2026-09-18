/**
 * Configuración pública del sitio — Apolo, Iteración 23.
 * Única fuente de verdad del dominio para metadata, JSON-LD, sitemap y
 * robots. En Vercel, definir `NEXT_PUBLIC_SITE_URL` (sin barra final);
 * si falta, en Vercel se usa el dominio de producción del proyecto y,
 * como último recurso, `https://devius.dev`.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return `https://${vercelProd.replace(/\/+$/, "")}`;
  return "https://devius.dev";
}

export const SITE_URL = resolveSiteUrl();

/** Rutas que nunca deben indexarse (robots.ts + cabecera X-Robots-Tag en proxy.ts). */
export const PRIVATE_PATH_PREFIXES = ["/admin", "/api"] as const;
