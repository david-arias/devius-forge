import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

/**
 * GET /api/draft-disable — APOLO, Iteración 18 ("El Puente Bifröst").
 *
 * Desactiva el Draft Mode (`draftMode().disable()`, borra la cookie
 * `__prerender_bypass`) y redirige de vuelta al sitio público en modo
 * normal (sólo contenido publicado, caché de Deméter otra vez activo).
 * Disparado por el botón "Salir del Preview" de `PreviewBanner`
 * (Hefesto) — un `<a>` plano, no un `<Link>` de Next.js, por la misma
 * razón que `/api/draft` usa un `<form>`: el prefetch de `<Link>`
 * desactivaría el Draft Mode antes de que el editor hiciera click.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawSlug = searchParams.get("slug") ?? "/";
  const safeSlug = rawSlug.startsWith("/") ? rawSlug : "/";

  const draft = await draftMode();
  draft.disable();

  redirect(safeSlug);
}
