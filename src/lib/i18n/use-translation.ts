"use client";

import { useMemo } from "react";
import { useLanguageStore } from "@/lib/minerva/language-store";
import { es, type Dictionary } from "./locales/es";
import { en } from "./locales/en";
import type { Locale } from "./constants";

const dictionaries: Record<Locale, Dictionary> = { es, en };

/**
 * `useTranslation()` — Minerva, Iteración 31. Hook de CLIENTE (lee
 * `useLanguageStore`) para consumir `locales/es.ts`/`en.ts` desde
 * cualquier componente `"use client"`. Devuelve:
 *  - `t`: el diccionario completo del idioma activo, tipado
 *    (`Dictionary`) — se usa como `t.footer.heading`, `t.commandPalette.placeholder(...)`, etc.
 *    (sin la firma clásica `t("footer.heading")` a propósito: con objetos
 *    anidados tipados, el autocompletado de TypeScript ya hace de sobra
 *    ese trabajo, y evita parsear rutas de string en runtime).
 *  - `locale`: el idioma activo (`"es" | "en"`), por si un componente
 *    necesita ramificar lógica además de texto (p.ej. `Intl.DateTimeFormat`).
 *
 * Server Components NO usan este hook — ellos ya reciben el contenido en
 * el idioma correcto resuelto por `getLocale()` (`get-locale.ts`) más
 * arriba en el árbol (ver `get-quests.ts`, `get-character.ts`,
 * `get-skill-tree.ts`).
 */
export function useTranslation() {
  const locale = useLanguageStore((state) => state.locale);
  const t = useMemo(() => dictionaries[locale], [locale]);
  return { t, locale };
}
