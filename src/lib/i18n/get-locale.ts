import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE_NAME, type Locale } from "./constants";

/**
 * `getLocale()` — Minerva, Iteración 31 ("Expansión Global"). Server-only
 * (usa `next/headers`, exactamente como `draftMode()` en `get-quests.ts`):
 * lee la cookie `devius-locale` que `LanguageSync`
 * (`components/hefesto/ui/LanguageSync.tsx`) escribe desde el cliente
 * cada vez que el usuario cambia de idioma con `LanguageToggle` o la
 * Command Palette. Sin cookie (primera visita, o JS deshabilitado):
 * `DEFAULT_LOCALE` ("es") — el sitio nace en español, igual que hasta
 * ahora, y el toggle es un "opt-in" a inglés, nunca al revés.
 *
 * Usado por los adaptadores de vista de Minerva (`get-quests.ts`,
 * `get-character.ts`, `get-skill-tree.ts`) para pedirle a Deméter el
 * contenido en el idioma correcto ANTES de que nada se renderice — así
 * el HTML que llega al navegador ya está en el idioma correcto (SSR real,
 * no un parpadeo de contenido en español que después se reemplaza por
 * JS, que sería lo que pasaría con una solución 100% `localStorage`).
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const raw = store.get(LOCALE_COOKIE_NAME)?.value;
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}
