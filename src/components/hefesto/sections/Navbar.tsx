import Link from "next/link";
import { Backpack, ExternalLink, Network, ScrollText, Swords, type LucideIcon } from "lucide-react";
import { type Navigation } from "@/lib/demeter/schemas";
import { cn } from "@/lib/utils";
import {
  AchievementCtaLink,
  AchievementsDrawerTrigger,
  Button,
  CommandPaletteTrigger,
  Magnetic,
  MobileMenu,
} from "@/components/hefesto/ui";

/**
 * Ícono sutil por ancla (Iteración 12, "Iconografía Consistente") — mapeado
 * por `href` porque `NavLink` (Deméter) no trae un campo de ícono propio
 * todavía; si en algún momento la navegación se vuelve dinámica de verdad
 * (CMS), esto se movería al schema en vez de vivir hardcodeado acá.
 */
const NAV_ICONS: Record<string, LucideIcon> = {
  "/#quests": ScrollText,
  "/#skill-tree": Network,
  "/#inventario": Backpack,
};

interface NavbarProps {
  navigation: Navigation;
  /**
   * Iteración 18 (APOLO/HEFESTO — "El Puente Bifröst"): `true` cuando el
   * Draft Mode está activo — `RootLayout` lo calcula una sola vez
   * (`draftMode().isEnabled`) y lo pasa hacia abajo vía `SiteChrome`.
   * Corre el Navbar `h-9` hacia abajo para no quedar tapado por
   * `PreviewBanner` (`ui/PreviewBanner.tsx`), que ocupa esa franja fija
   * en la parte superior sólo en ese estado.
   */
  previewActive?: boolean;
}

/**
 * Navbar — Apolo: componente estructural nuevo, fijo en todo el layout
 * (ver `src/app/layout.tsx`). Sin estado de cliente: las anclas son `<a href="#...">`
 * planas, no hace falta JS para eso. Glassmorphism (`backdrop-blur-md bg-black/20`
 * + borde inferior sutil) para que el contenido pase por detrás con elegancia.
 * El CTA "Iniciar Quest" queda siempre visible incluso en mobile (es la acción
 * que más importa); los links de sección y los íconos sociales se ocultan
 * bajo `sm:` para no saturar la barra en pantallas chicas.
 *
 * Mobile (fix HEFESTO, auditoría 2026-09-15): por debajo de `sm` los
 * `navLinks` ya no desaparecen sin reemplazo — `<MobileMenu>` (client
 * component aparte, ver `ui/MobileMenu.tsx`) los muestra en un drawer con
 * foco atrapado. El `<Navbar>` en sí sigue siendo un Server Component:
 * `AchievementCtaLink`, `AchievementsDrawerTrigger` y `MobileMenu` son sus
 * únicos hijos con `"use client"` (Iteración 12).
 */
export function Navbar({ navigation, previewActive = false }: NavbarProps) {
  const emailLink = navigation.socialLinks.find((link) => link.kind === "email");
  const externalLinks = navigation.socialLinks.filter((link) => link.kind !== "email");

  return (
    <header
      className={cn(
        "fixed inset-x-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-md transition-[top] duration-200 print:hidden",
        previewActive ? "top-9" : "top-0"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Link href="/#home" className="font-display text-lg tracking-wide text-parchment">
          Devius<span className="text-gold-glow">.</span>
        </Link>

        <nav aria-label="Secciones" className="hidden items-center gap-6 sm:flex">
          {navigation.navLinks.map((link) => {
            const Icon = NAV_ICONS[link.href];
            return (
              <a
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 text-sm text-parchment-muted transition-colors duration-150 hover:text-parchment"
              >
                {Icon && <Icon className="h-3.5 w-3.5 opacity-70" aria-hidden />}
                {link.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 sm:flex">
            {externalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
                className="text-parchment-muted transition-colors duration-150 hover:text-parchment"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            ))}
          </div>

          <CommandPaletteTrigger className="hidden sm:flex" />
          <AchievementsDrawerTrigger className="hidden sm:flex" />

          {emailLink && (
            <Magnetic strength={0.3}>
              <AchievementCtaLink href={emailLink.href} achievementId="call-to-adventure">
                <Button variant="cta" className="gap-1.5 px-4 py-1.5 text-xs">
                  <Swords className="h-3.5 w-3.5" aria-hidden />
                  Iniciar Quest
                </Button>
              </AchievementCtaLink>
            </Magnetic>
          )}

          <MobileMenu navigation={navigation} />
        </div>
      </div>
    </header>
  );
}
