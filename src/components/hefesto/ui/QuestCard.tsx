"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useState } from "react";
import { type Quest } from "@/lib/demeter/schemas";
import { cn } from "@/lib/utils";

interface QuestCardProps {
  quest: Quest;
  index: number;
  /** La carta centrada del carrusel se revela sola (sin hover) — "imán" visual. */
  active?: boolean;
  /** Pedido de centrado al recibir foco de teclado (lo resuelve el carrusel). */
  onRequestFocus?: () => void;
  className?: string;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Monograma de 1–2 letras a partir del título ("El Bazar Encantado" → "BE"). */
function monogram(title: string) {
  const words = title
    .split(/[\s—–-]+/)
    .filter((w) => w.length > 2 && /^[\p{L}\p{N}]/u.test(w));
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? title).slice(0, 2)).toUpperCase();
}

/**
 * QuestCard — Hefesto, Iteración 20 (referencia: video). Rectángulo
 * vertical en estado "apagado" (monograma + nombre + número). Al
 * revelarse (hover, foco de teclado o por estar centrada en el carrusel):
 *   1. la media se descubre con un wipe de máscara de arriba hacia abajo
 *      (`clip-path`) y escala suave (`.media-zoom`, 0.8s circOut);
 *   2. la carta se expande hacia abajo mostrando rol, loot y los enlaces;
 *   3. una barra de acento crece en la base.
 * Sólo `transform`/`clip-path`/`opacity` en el loop de animación.
 */
export function QuestCard({ quest, index, active = false, onRequestFocus, className }: QuestCardProps) {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const revealed = active || hovered || focused;
  const number = String(index + 1).padStart(2, "0");

  return (
    <article
      data-quest-card
      data-revealed={revealed}
      className={cn("group relative w-[min(78vw,20rem)] shrink-0 lg:w-[clamp(15rem,calc((100svh-25rem)*0.75),21rem)]", className)}
      style={{ "--accent": quest.accentColor } as CSSProperties}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => {
        setFocused(true);
        onRequestFocus?.();
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-obsidian-soft/90 transition-[border-color,box-shadow] duration-500",
          revealed
            ? "border-[color-mix(in_srgb,var(--accent)_45%,transparent)] shadow-[0_30px_80px_-30px_color-mix(in_srgb,var(--accent)_45%,transparent)]"
            : "border-white/10"
        )}
      >
        <Link
          href={`/quests/${quest.id}`}
          draggable={false}
          aria-label={`Ver caso de estudio: ${quest.title}`}
          className="relative block aspect-[3/4] overflow-hidden rounded-2xl focus-visible:outline-offset-[-3px]"
        >
          {/* ── Estado apagado ─────────────────────────────────── */}
          <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.05),transparent_60%)]" />
            <div className="absolute inset-x-6 top-5 flex justify-between text-[0.6rem] uppercase tracking-[0.3em] text-parchment-muted/60">
              <span>Quest</span>
              <span>{quest.status === "in-progress" ? "En curso" : "Completada"}</span>
            </div>
            <span
              className="font-display text-7xl font-bold leading-none tracking-tight opacity-80"
              style={{ color: "color-mix(in srgb, var(--accent) 55%, #a5b4fc)" }}
            >
              {monogram(quest.title)}
            </span>
            <span className="h-1 w-1 rounded-full bg-parchment-muted/40" />
            <p className="line-clamp-2 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-parchment">
              {quest.title}
            </p>
            <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--accent)" }}>
              {number}
            </span>
          </div>

          {/* ── Capa revelada (máscara que baja) ──────────────── */}
          <motion.div
            aria-hidden
            className="absolute inset-0"
            initial={false}
            animate={{
              clipPath: revealed ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)",
            }}
            transition={{ duration: reduce ? 0 : 0.9, ease: EASE_OUT_EXPO }}
          >
            <div
              className="media-zoom absolute inset-0"
              style={
                quest.media
                  ? undefined
                  : {
                      backgroundImage: `linear-gradient(160deg, ${quest.imagePlaceholder.from}, ${quest.imagePlaceholder.to})`,
                    }
              }
            >
              {quest.media ? (
                <Image
                  src={quest.media.type === "video" ? (quest.media.poster ?? quest.media.src) : quest.media.src}
                  alt=""
                  fill
                  draggable={false}
                  sizes="(min-width: 1024px) 21rem, 78vw"
                  className="object-cover"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center font-display text-8xl font-bold text-white/15">
                  {monogram(quest.title)}
                </span>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/10 to-transparent" />
            <motion.div
              className="absolute inset-x-0 bottom-0 p-5"
              initial={false}
              animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: reduce ? 0 : 0.6, delay: revealed && !reduce ? 0.25 : 0, ease: EASE_OUT_EXPO }}
            >
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--accent)" }}>
                {number} — {quest.role}
              </p>
              <p className="mt-1.5 font-display text-xl leading-snug text-parchment">{quest.title}</p>
            </motion.div>
          </motion.div>
        </Link>

        {/* ── Expansión inferior ─────────────────────────────── */}
        <motion.div
          initial={false}
          animate={{ height: revealed ? "auto" : 0, opacity: revealed ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : 0.6, ease: EASE_OUT_EXPO }}
          className="overflow-hidden"
          // Contenido oculto = fuera del orden de tabulación (el link principal ya lleva al caso).
          inert={!revealed}
        >
          <div className="flex flex-col gap-4 p-5 pt-4">
            <p className="line-clamp-3 text-sm leading-relaxed text-parchment/65">{quest.summary}</p>
            <div className="flex flex-wrap gap-1.5">
              {quest.tech.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/10 px-2.5 py-0.5 text-[0.65rem] text-parchment-muted"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs font-medium">
              <Link
                href={`/quests/${quest.id}`}
                draggable={false}
                className="inline-flex items-center gap-1.5 text-parchment transition-colors hover:text-[var(--accent)]"
              >
                Ver caso de estudio
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
              {quest.href && (
                <a
                  href={quest.href}
                  target="_blank"
                  rel="noreferrer"
                  draggable={false}
                  aria-label={`Ver ${quest.title} en vivo (se abre en una pestaña nueva)`}
                  className="inline-flex items-center gap-1.5 text-parchment-muted transition-colors hover:text-parchment"
                >
                  En vivo
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* Barra de acento */}
        <motion.span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-0.5 origin-center"
          style={{ backgroundColor: "var(--accent)" }}
          initial={false}
          animate={{ scaleX: revealed ? 1 : 0.15, opacity: revealed ? 1 : 0.4 }}
          transition={{ duration: reduce ? 0 : 0.7, ease: EASE_OUT_EXPO }}
        />
      </div>
    </article>
  );
}
