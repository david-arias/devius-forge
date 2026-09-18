"use client";

import { Languages } from "lucide-react";
import { useLanguageStore } from "@/lib/minerva/language-store";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  className?: string;
}

/**
 * LanguageToggle — Hefesto, Iteración 31 ("Expansión Global"). Selector
 * de idioma sutil para el Navbar público: un botón chico con el ícono
 * `Languages` + el código del idioma AL QUE SE CAMBIARÍA (patrón de
 * "próxima acción", no "estado actual" — igual que el resto de los
 * toggles del sitio, `PrintModeToggle`/`AchievementsDrawerTrigger`).
 * Cambiar el idioma no navega ni recarga: sólo actualiza
 * `useLanguageStore`, que `LanguageSync` (montado en `SiteChrome`)
 * refleja en la cookie `devius-locale` y dispara `router.refresh()` para
 * traer el contenido de Server Components ya traducido, sin perder el
 * estado de cliente de la página.
 */
export function LanguageToggle({ className }: LanguageToggleProps) {
  const locale = useLanguageStore((state) => state.locale);
  const toggleLocale = useLanguageStore((state) => state.toggleLocale);
  const nextLocale = locale === "es" ? "en" : "es";

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={locale === "es" ? "Switch language to English" : "Cambiar idioma a Español"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1 text-xs font-medium text-parchment-muted transition-colors duration-150 hover:border-emerald-glow/40 hover:text-parchment",
        className
      )}
    >
      <Languages className="h-3.5 w-3.5" aria-hidden />
      <span aria-hidden className="tabular-nums uppercase tracking-wide">
        {nextLocale}
      </span>
    </button>
  );
}
