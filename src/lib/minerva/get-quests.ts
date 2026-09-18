import { draftMode } from "next/headers";
import { getQuests as fetchQuests } from "@/lib/demeter/queries/quests";

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
  return fetchQuests(isEnabled ? { includeDrafts: true } : undefined);
}
