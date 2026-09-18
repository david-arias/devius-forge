import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * robots.txt — Apolo, Iteración 23. Todo el sitio es rastreable salvo el
 * panel y los Route Handlers. Ojo: robots.txt es una cortesía, no
 * seguridad — `/admin` está protegido de verdad por `proxy.ts` + layout +
 * Server Actions, y además responde `X-Robots-Tag: noindex`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
