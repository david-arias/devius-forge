import { draftMode } from "next/headers";
import { getAdjacentQuests, getQuests as fetchQuests } from "@/lib/demeter/queries/quests";
import { getLocale } from "@/lib/i18n/get-locale";

/**
 * Servicio de Minerva: expone Quests ya listas para Hefesto.
 * No es un React Hook (es una función async para Server Components) —
 * se evita el prefijo `use` para no colisionar con las reglas de eslint-plugin-react-hooks.
 *
 * Iteración 18 (APOLO — "El Puente Bifröst"): si el Draft Mode nativo de
 * Next.js está activo (`draftMode().isEnabled`, cookie `__prerender_bypass`
 * seteada por `app/api/draft/route.ts`), se piden también los borradores
 * (`includeDrafts: true`) — así un editor autenticado en `/admin` puede
 * abrir "Ver Preview" y ver una Quest sin publicar en el sitio público,
 * sin que ningún visitante normal (sin la cookie) la vea nunca. Sin
 * Draft Mode activo, el comportamiento es exactamente el de antes:
 * `fetchQuests()` sin opciones filtra por `isPublished === true`.
 */
export async function getQuestsForView() {
  const { isEnabled } = await draftMode();
  // Iteración 31 (i18n): `getLocale()` lee la cookie `devius-locale` — el
  // mismo request que resuelve Draft Mode ahora también resuelve el
  // idioma, así que el contenido llega ya traducido en el primer render
  // (SSR real, sin parpadeo de contenido en español).
  const locale = await getLocale();
  return fetchQuests({ ...(isEnabled ? { includeDrafts: true } : {}), locale });
}

/**
 * Iteración 42 — Quests vecinas (anterior/siguiente) ya en el idioma del
 * visitante. A diferencia de `getQuestsForView()`, IGNORA el Draft Mode a
 * propósito: la navegación pública nunca debe enlazar a un borrador.
 */
export async function getAdjacentQuestsForView(currentSlug: string) {
  const locale = await getLocale();
  return getAdjacentQuests(currentSlug, { locale });
}
