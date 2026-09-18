/**
 * Constantes compartidas de i18n (Minerva, Iteración 31 — "Expansión
 * Global"). Separadas en su propio archivo, sin ningún import de
 * `next/headers` ni de Zustand, para que tanto código de servidor
 * (`get-locale.ts`) como de cliente (`language-store.ts`,
 * `use-translation.ts`) puedan importarlas sin arrastrar nada que no
 * les corresponda — mismo cuidado de aislamiento cliente/servidor que
 * ya sigue `queries/index.ts` (ver su docblock).
 */
export type Locale = "es" | "en";

export const SUPPORTED_LOCALES: readonly Locale[] = ["es", "en"];
export const DEFAULT_LOCALE: Locale = "es";

/** Cookie que sincroniza la preferencia de idioma entre cliente (Zustand/localStorage) y servidor (Server Components). Un año de vida, `path=/` para que la lean todas las rutas. */
export const LOCALE_COOKIE_NAME = "devius-locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return value === "es" || value === "en";
}
