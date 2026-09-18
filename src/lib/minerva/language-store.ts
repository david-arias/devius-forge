"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/lib/i18n/constants";

interface LanguageState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

/**
 * Preferencia de idioma — Minerva, Iteración 31 ("Expansión Global").
 * Mismo patrón que `print-mode-store.ts`/`audio-preference-store.ts`:
 * persistida en `localStorage` (clave `devius-locale`) para sobrevivir a
 * un reload, sin importar `next/headers` (seguro para el barrel de
 * cliente, ver el docblock largo de `queries/quests.ts`).
 *
 * Este store por sí solo NO alcanza para que el contenido en Server
 * Components (Quests, Character, Skill Tree) salga en el idioma
 * correcto — `localStorage` no existe en el servidor. El puente real es
 * la cookie `devius-locale` (`lib/i18n/constants.ts`), que
 * `LanguageSync.tsx` mantiene sincronizada con ESTE store y que
 * `getLocale()` (`lib/i18n/get-locale.ts`) lee en cada request. Este
 * store sigue siendo la fuente de verdad para la UI puramente cliente
 * (el label "ES"/"EN" del toggle, la acción de la Command Palette).
 */
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      locale: "es",
      setLocale: (locale) => set({ locale }),
      toggleLocale: () => set((state) => ({ locale: state.locale === "es" ? "en" : "es" })),
    }),
    { name: "devius-locale" }
  )
);
