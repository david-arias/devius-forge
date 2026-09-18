import { draftMode } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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
 * Seguridad (revisada en la Iteración 27): la puerta principal es la
 * SESIÓN DE ADMIN (cookie de Supabase). El botón "Ver Preview" del CMS
 * siempre se usa con sesión iniciada, así que no hace falta ningún
 * secreto en el navegador — desapareció `NEXT_PUBLIC_DRAFT_MODE_SECRET`,
 * que además contradecía su propio nombre (un secreto público no es un
 * secreto, y Vercel ahora lo marca al guardarlo).
 *
 * `DRAFT_MODE_SECRET` (server-only, opcional) sigue existiendo como
 * segunda llave para usos sin sesión — por ejemplo abrir un preview desde
 * el celular o compartirlo con un cliente: `/api/draft?secret=…&slug=…`.
 *
 * Sin sesión y sin secreto válido: 401. `slug` se valida como ruta
 * relativa (empieza con "/") antes de redirigir para evitar un
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
  const secretMatches = Boolean(expectedSecret) && secret === expectedSecret;

  let hasAdminSession = false;
  if (!secretMatches) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      hasAdminSession = Boolean(user);
    } catch {
      // Supabase sin configurar: se cae al chequeo de secreto de abajo.
      hasAdminSession = false;
    }
  }

  if (!secretMatches && !hasAdminSession) {
    return new Response(
      "Preview no autorizado: iniciá sesión en /admin/login o usá ?secret=<DRAFT_MODE_SECRET>.",
      { status: 401 }
    );
  }

  // Sólo rutas relativas propias del sitio — nunca un slug que apunte a otro host.
  const safeSlug = rawSlug.startsWith("/") ? rawSlug : "/";

  const draft = await draftMode();
  draft.enable();

  redirect(safeSlug);
}
