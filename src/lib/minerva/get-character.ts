import { getCharacter as fetchCharacter } from "@/lib/demeter/queries/character";
import { getLocale } from "@/lib/i18n/get-locale";

/**
 * Servicio de Minerva: expone el Character Sheet ya listo para Hefesto. No es un React Hook.
 * Iteración 31 (i18n): resuelve el idioma vía `getLocale()` (cookie `devius-locale`) antes de pedirle a Deméter el contenido.
 */
export async function getCharacterForView() {
  const locale = await getLocale();
  return fetchCharacter({ locale });
}
