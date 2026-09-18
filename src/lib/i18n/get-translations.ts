import { getLocale } from "./get-locale";
import { es, type Dictionary } from "./locales/es";
import { en } from "./locales/en";
import type { Locale } from "./constants";

const dictionaries: Record<Locale, Dictionary> = { es, en };

/**
 * `getTranslations()` — Apolo/Minerva, Iteración 32 ("i18n Absoluto").
 * Equivalente SERVER de `useTranslation()` (`use-translation.ts`): en vez
 * de leer `useLanguageStore` (client-only), resuelve el idioma vía
 * `getLocale()` (cookie `devius-locale`, `next/headers`) — para usar
 * desde Server Components que ya reciben datos en el idioma correcto
 * (Hero, CharacterSheet, SkillTree, Inventory, QuestShowcase) y también
 * necesitan traducir su copy estática, sin poder usar un hook de React.
 */
export async function getTranslations(): Promise<Dictionary> {
  const locale = await getLocale();
  return dictionaries[locale];
}
