"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Image as ImageIcon, X } from "lucide-react";
import NextImage from "next/image";
import { useId, useState } from "react";
import { type Quest } from "@/lib/demeter/schemas";
import { useDialogPanel } from "@/lib/hefesto/use-dialog-panel";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

interface ChapterMediaFrameProps {
  quest: Quest;
  chapterKey: "problem" | "uxProcess" | "uiSolution" | "impact";
  className?: string;
}

/**
 * ChapterMediaFrame — el cuadro de imagen de cada capítulo del caso de
 * estudio. Nacido en la Iteración 12 (server, sin interacción); se movió
 * a un Client Component propio en la Iteración 14 ("La Forja Oculta")
 * para agregarle zoom/lightbox — sigue siendo el único lugar que decide
 * imagen real vs. placeholder de gradiente + ícono, así que
 * `/quests/[slug]/page.tsx` (Server Component) no necesitó tocarse más
 * que en el import.
 *
 * El lightbox reutiliza `useDialogPanel` (mismo hook que `MobileMenu`/
 * `AchievementsDrawer`) para el focus trap, cierre con Escape + foco
 * restaurado, y scroll-lock del body — cero código de accesibilidad
 * duplicado. Sólo se puede abrir cuando hay una imagen real (`media.type
 * === "image"`) — el placeholder no es clickeable, y un video no abre
 * lightbox (ya se reproduce inline en loop).
 *
 * Accesibilidad: el trigger es un `<button>` real (no un `<div onClick>`)
 * con `aria-label` descriptivo; el panel lleva `role="dialog"
 * aria-modal="true"`; clickear el backdrop cierra igual que Escape.
 * `useReducedMotion()` cambia la transición de "scale + fade" a sólo
 * "fade" — mismo criterio que el resto del motion sensorial del sitio.
 */
export function ChapterMediaFrame({ quest, chapterKey, className }: ChapterMediaFrameProps) {
  const { t } = useTranslation();
  const media = quest.caseStudy.chapterMedia?.[chapterKey];
  // Iteración 36 (Hefesto — fix del "espacio negro" en capítulos de Quest):
  // antes de este fix, cuando `media` SÍ existía (la Quest tiene una URL
  // guardada para este capítulo) pero la imagen fallaba al cargar en el
  // navegador — dominio no declarado en `images.remotePatterns`
  // (`next.config.ts`), archivo borrado del bucket, URL vieja de un
  // storage distinto, CORS, lo que sea — `next/image` deja el <img> roto
  // y SIN el gradiente de placeholder, porque ese gradiente sólo se
  // aplicaba cuando `media` era `undefined` (ver el `style` de `frame`
  // más abajo). El contenedor quedaba con `background` sin definir → se
  // veía negro/vacío heredando el fondo oscuro del sitio (`bg-obsidian`),
  // exactamente el síntoma reportado, mientras el texto del capítulo (que
  // no depende de que la imagen cargue) rendereaba perfecto al lado.
  //
  // Fix: `failedSrc` (guarda el `src` que falló, ver más abajo) +
  // `onError` en el `<Image>` — apenas el navegador dispara el evento de
  // error de carga, se trata exactamente igual que "no hay imagen":
  // mismo gradiente + ícono de placeholder que ya existía para capítulos
  // sin subir. Nunca queda un contenedor sin `background`.
  // Sin `useEffect`: en vez de un booleano + efecto que lo resetee a mano
  // cuando cambia `media.src` (dispara "setState síncrono en un efecto",
  // cascading renders — regla `react-hooks/set-state-in-effect`), se
  // guarda directamente CUÁL src falló. Comparar contra `media.src` en
  // cada render ya da el reset "gratis": si `chapterKey`/`quest` cambia
  // (otro src), la comparación deja de matchear sola, sin efecto.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showPlaceholder = !media || (media.type === "image" && media.src === failedSrc);
  const isZoomableImage = media?.type === "image" && media.src !== failedSrc;
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const panelRef = useDialogPanel<HTMLDivElement>(open, () => setOpen(false));
  const prefersReducedMotion = useReducedMotion();

  // Iteración 38 (Hefesto — fix DEFINITIVO del "contenedor de 0px",
  // confirmado inspeccionando el DOM en vivo con Claude en Chrome):
  // `frame` ya NO recibe el `className` externo (el `lg:w-5/12`/`lg:w-7/12`
  // que `quests/[slug]/page.tsx` le pasa para el layout zig-zag). Antes lo
  // recibía acá, PERO en el caso "zoomable" (imagen real) el valor que
  // este componente devuelve es `<button>{frame}</button>` — el `<button>`
  // envuelve a `frame`, así que el `<button>`, no `frame`, es el
  // verdadero hijo flex dentro de `quests/[slug]/page.tsx`. El `<button>`
  // no tenía NINGUNA clase de ancho/`shrink-0` propia — como flex item con
  // `flex-basis: auto` y sin contenido en el flujo normal (el único hijo
  // de `frame` es el `<Image fill>`, `position: absolute`, fuera del
  // flujo), su ancho intrínseco colapsaba a ~0 (sólo el borde de 1px de
  // `frame` se veía: 2px medidos en vivo). `frame` calculaba
  // `width: 41.6667%` correctamente, pero un 41.6667% DE UN CONTENEDOR DE
  // ~0px sigue siendo ~0px — de ahí el colapso total reportado ("altura
  // 0", aunque en los hechos era el ANCHO el que colapsaba; la altura
  // funcionaba por `items-stretch` en el flex padre, que si actúa sobre
  // el hijo flex directo — el `<button>` — estirándolo en el eje
  // transversal).
  //
  // Fix: `className` (el ancho responsivo) se aplica ahora al elemento
  // que REALMENTE es el hijo flex en cada rama — el `<div>` del caso no
  // zoomable, o el `<button>` del caso zoomable — nunca a `frame`, que
  // pasa a ser sólo un `w-full h-*` interno que llena a su contenedor
  // inmediato.
  const frame = (
    <div
      className={cn(
        "relative h-56 w-full shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:h-72 lg:h-full lg:min-h-[18rem]"
      )}
      style={
        showPlaceholder
          ? {
              backgroundImage: `linear-gradient(150deg, color-mix(in srgb, ${quest.accentColor} 16%, #0a0a0f), #0a0a0f 72%)`,
            }
          : undefined
      }
    >
      {!showPlaceholder && media ? (
        media.type === "video" ? (
          <video
            className="h-full w-full object-cover"
            src={media.src}
            poster={media.poster}
            autoPlay
            muted
            loop
            playsInline
            aria-label={media.alt}
          />
        ) : (
          <NextImage
            src={media.src}
            alt={media.alt}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
            onError={() => setFailedSrc(media.src)}
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ImageIcon
            className="h-10 w-10 text-parchment-muted/25"
            aria-hidden
            strokeWidth={1.25}
          />
          <span className="sr-only">{t.questDetail.pendingMockup}</span>
        </div>
      )}
    </div>
  );

  if (!isZoomableImage) {
    return (
      <div className={cn("shrink-0 lg:h-full", className)}>
        {frame}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={t.questDetail.expandImageAria(media.alt)}
        className={cn("block shrink-0 cursor-zoom-in rounded-2xl text-left focus-visible:outline-offset-4 lg:h-full", className)}
      >
        {frame}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            aria-hidden
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md sm:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              id={panelId}
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={media.alt}
              onClick={(event) => event.stopPropagation()}
              className="relative max-h-full max-w-5xl"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.questDetail.closeImageAria}
                className="absolute -top-11 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-parchment transition-colors duration-150 hover:bg-white/20"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
              <NextImage
                src={media.src}
                alt={media.alt}
                width={1600}
                height={1000}
                sizes="90vw"
                className="max-h-[85vh] w-auto rounded-xl object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
