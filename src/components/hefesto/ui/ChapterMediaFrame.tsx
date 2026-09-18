"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Image as ImageIcon, X } from "lucide-react";
import NextImage from "next/image";
import { useId, useState } from "react";
import { type Quest } from "@/lib/demeter/schemas";
import { useDialogPanel } from "@/lib/hefesto/use-dialog-panel";
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
  const media = quest.caseStudy.chapterMedia?.[chapterKey];
  const isZoomableImage = media?.type === "image";
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const panelRef = useDialogPanel<HTMLDivElement>(open, () => setOpen(false));
  const prefersReducedMotion = useReducedMotion();

  const frame = (
    <div
      className={cn(
        "relative h-56 shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:h-72 lg:h-full lg:min-h-[18rem]",
        className
      )}
      style={
        media
          ? undefined
          : {
              backgroundImage: `linear-gradient(150deg, color-mix(in srgb, ${quest.accentColor} 16%, #0a0a0f), #0a0a0f 72%)`,
            }
      }
    >
      {media ? (
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
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ImageIcon
            className="h-10 w-10 text-parchment-muted/25"
            aria-hidden
            strokeWidth={1.25}
          />
          <span className="sr-only">Mockup pendiente de subir para este capítulo</span>
        </div>
      )}
    </div>
  );

  if (!isZoomableImage) {
    return frame;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Ampliar imagen: ${media.alt}`}
        className="cursor-zoom-in rounded-2xl focus-visible:outline-offset-4"
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
                aria-label="Cerrar imagen ampliada"
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
