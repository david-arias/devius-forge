import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

/**
 * GET /api/draft — APOLO, Iteración 18 ("El Puente Bifröst").
 *
 * Activa el Draft Mode nativo de Next.js (`draftMode().enable()`, cookie
 * `__prerender_bypass`) y redirige al `slug` público que se quiere
 * previsualizar. Mientras esa cookie esté presente:
 *   - `unstable_cache` (usado por TODAS las lecturas de Deméter —
 *     `quests.ts`/`inventory.ts`/`skill-tree.ts`/`character.ts`, ver sus
 *     docblocks) se saltea automáticamente y pide siempre datos frescos.
 *   - `getQuestsForView`/`getInventoryForView` (Minerva) piden además los
 *     borradores (`includeDrafts: true`) — ver sus docblocks.
 *   - `PreviewBanner` (Hefesto) se vuelve visible en el sitio público.
 *
 * Seguridad: sigue la guía oficial de Next.js (`draft-mode.md`) — el
 * secreto es OPCIONAL acá a propósito. Si se define `DRAFT_MODE_SECRET`
 * (ver `.env.local.example`/guía de Vercel), este endpoint lo exige y
 * cualquier visitante sin el secreto correcto recibe 401. Sin esa env var
 * configurada, el endpoint queda abierto — aceptable para un portafolio
 * de un solo admin donde lo único que "filtra" el Draft Mode es contenido
 * en borrador, no datos sensibles ni credenciales. `slug` se valida como
 * ruta relativa (empieza con "/") antes de redirigir para evitar un
 * open-redirect a un dominio externo.
 *
 * Se usa `GET` (no `POST`) siguiendo la guía de Next.js: el botón "Ver
 * Preview" de Hefesto navega acá vía `<form method="get" target="_blank">`
 * (nunca un `<Link>`, que Next.js prefetchea — prefetch de este endpoint
 * activaría/redirigiría el Draft Mode sin que el usuario hiciera click).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const rawSlug = searchParams.get("slug") ?? "/";

  const expectedSecret = process.env.DRAFT_MODE_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return new Response("Token de preview inválido.", { status: 401 });
  }

  // Sólo rutas relativas propias del sitio — nunca un slug que apunte a otro host.
  const safeSlug = rawSlug.startsWith("/") ? rawSlug : "/";

  const draft = await draftMode();
  draft.enable();

  redirect(safeSlug);
}
