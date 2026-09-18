"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import {
  AchievementsDrawer,
  AchievementToast,
  CommandPalette,
  type CommandPaletteQuest,
  CustomCursor,
  KonamiSecret,
  PreviewBanner,
  PrintModeSync,
} from "@/components/hefesto/ui";
import { type Navigation } from "@/lib/demeter/schemas";
import { PageTransition } from "@/components/minerva/PageTransition";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

interface SiteChromeProps {
  navigation: Navigation;
  children: ReactNode;
  /** Iteración 18 — ver el docblock de `previewActive` en `Navbar.tsx`. */
  previewActive?: boolean;
  /** Iteración 29 — Quests publicadas para la Paleta de Comandos (`CommandPalette.tsx`), resueltas en `layout.tsx`. */
  quests: CommandPaletteQuest[];
}

/**
 * SiteChrome — Apolo, Iteración 15 ("Refinamiento de la Forja Oculta").
 * Arregla el Hallazgo de Alto Impacto de la auditoría 2026-09-15: "el
 * header público se sigue renderizando dentro del admin, apuntando a
 * anchors que no existen ahí — dos elementos llamados 'Skill Tree' /
 * 'Inventario' en la misma pantalla, cada uno haciendo algo distinto".
 *
 * La causa raíz: `src/app/layout.tsx` es el ÚNICO root layout de la app
 * (App Router compone layouts anidados, no los reemplaza) — envolvía
 * `children` con `Navbar`/`Footer` incondicionalmente, así que `/admin/*`
 * heredaba ese chrome público ADEMÁS del `AdminSidebar` propio de
 * `src/app/admin/(protected)/layout.tsx`. Next.js no soporta "opt-out"
 * de un layout padre desde un layout hijo — la solución estándar es un
 * Client Component en el medio que decida, vía `usePathname()`, qué
 * chrome mostrar. `RootLayout` sigue siendo Server Component (sigue
 * pudiendo `await getNavigationForView()` sin cambios) y le pasa la
 * navegación ya resuelta a este componente.
 *
 * En rutas `/admin/*` no se renderiza NADA de esto: ni `Navbar`/`Footer`
 * públicos, ni `CustomCursor`, ni el sistema de Logros (Toast/Drawer) —
 * son conceptos del sitio público, no del CMS. `AdminSidebar` (Hefesto,
 * Iteración 14) y `AdminToastHost` (Iteración 15) son la única
 * navegación/feedback dentro de `(protected)/layout.tsx`.
 */
export function SiteChrome({ navigation, children, previewActive = false, quests }: SiteChromeProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Sólo en rutas públicas (Iteración 18) — ver el docblock de `active` en `PreviewBanner.tsx`. */}
      <PreviewBanner active={previewActive} />
      <CustomCursor />
      <Navbar navigation={navigation} previewActive={previewActive} />
      {/* Iteración 19 (MINERVA): transiciones de página fluidas — Navbar/Footer quedan fijos. */}
      <PageTransition>{children}</PageTransition>
      <Footer navigation={navigation} />
      <AchievementToast />
      <AchievementsDrawer />
      {/* Iteración 29: la Paleta de Comandos (Cmd+K), sólo en el sitio público — mismo criterio que el resto de este chrome. */}
      <CommandPalette quests={quests} />
      {/* Iteración 26: el Código Konami sólo vive en el sitio público. */}
      <KonamiSecret />
      {/* Iteración 30: sincroniza `print-mode-store.ts` → `data-print-mode` en `<html>` (ver `globals.css` → `@media print`). */}
      <PrintModeSync />
    </>
  );
}
