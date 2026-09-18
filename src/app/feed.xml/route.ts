import { getQuests } from "@/lib/demeter/queries/quests";
import { SITE_URL } from "@/lib/site";

/**
 * GET /feed.xml — Apolo, Iteración 29 ("El Toque del Maestro"). RSS 2.0
 * de las Quests PUBLICADAS (`getQuests()` sin `includeDrafts` — mismo
 * criterio que `sitemap.ts`: nunca se expone un borrador acá, un Route
 * Handler público sin sesión no tiene por qué leer Draft Mode). Pensado
 * como un "flex" técnico para reclutadores/ingenieros que todavía usan
 * lectores de feeds — no es un requisito de producto, es una señal de
 * cuidado en el detalle.
 *
 * `revalidate` en vez de recalcular en cada request: mismo criterio que
 * `sitemap.ts` (ISR de una hora) — cada Server Action de Quests ya
 * invalida el tag `"quests"` de `unstable_cache` apenas guarda (ver
 * `quests.ts`), así que el feed nunca queda desincronizado por más de un
 * guardado real.
 *
 * Referenciado desde `layout.tsx` (`metadata.alternates.types`) para que
 * los lectores de feeds y los navegadores que todavía muestran el ícono
 * de RSS en la barra de direcciones lo detecten solos.
 */
export const revalidate = 3600;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const quests = await getQuests();

  const items = quests
    .map((quest) => {
      const link = `${SITE_URL}/quests/${encodeURIComponent(quest.id)}`;
      const pubDate = new Date(quest.updatedAt ?? Date.now()).toUTCString();
      return `    <item>
      <title>${escapeXml(quest.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(quest.summary)}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Devius — Quests</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Casos de estudio (Quests) publicados en el portafolio de Devius.</description>
    <language>es</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
