import { Sparkles, X } from "lucide-react";

interface PreviewBannerProps {
  /**
   * `true` cuando el Draft Mode de Next.js está activo — calculado UNA
   * sola vez en `RootLayout` (`draftMode().isEnabled`, ver `layout.tsx`)
   * y pasado hacia abajo por `SiteChrome`, que es quien decide renderizar
   * este banner (sólo en rutas públicas, nunca en `/admin/*` — el editor
   * ya sabe que está en el CMS, no hace falta recordárselo ahí también).
   *
   * A propósito NO es este componente el que llama a `draftMode()`: eso
   * requeriría `next/headers`, y este archivo SÍ vive en `ui/index.ts`
   * (el barrel que consumen los formularios "use client" del CMS) — ver
   * el comentario largo en `quests.ts`/`handoff.md` ("Fix — Iteración
   * 15") sobre por qué `next/headers` colándose en ese barrel rompió el
   * build de cliente una vez. Mantener este componente 100% presentacional
   * (sólo boolean in, JSX out) es lo que lo hace seguro de exportar acá.
   */
  active: boolean;
}

/**
 * PreviewBanner — HEFESTO, Iteración 18 ("El Puente Bifröst"). Banner fijo
 * "🔮 Modo Visión Activo" en la parte superior del sitio PÚBLICO, visible
 * sólo mientras el Draft Mode está activo (`active === true`) — en
 * cualquier visita normal `SiteChrome` ni siquiera lo monta.
 *
 * El botón "Salir del Preview" es un `<a>` plano (no un `<Link>` de
 * Next.js) apuntando a `/api/draft-disable` — un Route Handler `GET` que
 * borra la cookie `__prerender_bypass` y redirige a `/`. Se evita
 * `<Link>` a propósito: Next.js lo prefetchea por defecto, lo que
 * dispararía la desactivación del Draft Mode con sólo pasar el cursor
 * cerca, sin que el editor hiciera click (mismo motivo documentado en
 * `app/api/draft/route.ts` para el `<form>` de "Ver Preview" —
 * `PreviewLink.tsx`).
 */
export function PreviewBanner({ active }: PreviewBannerProps) {
  if (!active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[60] flex h-9 items-center justify-center gap-3 border-b border-gold-glow/30 bg-gradient-to-r from-emerald-glow/20 via-obsidian to-gold-glow/20 px-4 text-xs text-parchment backdrop-blur-md sm:text-sm"
    >
      <span className="inline-flex items-center gap-1.5 font-medium">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-gold-glow" aria-hidden />
        Modo Visión Activo (Viendo Borradores)
      </span>
      <a
        href="/api/draft-disable"
        className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-0.5 text-parchment-muted transition-colors duration-150 hover:border-gold-glow/50 hover:text-parchment"
      >
        <X className="h-3 w-3 shrink-0" aria-hidden />
        Salir del Preview
      </a>
    </div>
  );
}
