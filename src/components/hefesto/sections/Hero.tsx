"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, Download, Swords } from "lucide-react";
import Image from "next/image";
import { type CSSProperties, useRef } from "react";
import { type Character } from "@/lib/demeter/schemas";
import { Button, Magnetic, RevealText } from "@/components/hefesto/ui";
import { useAchievementsStore } from "@/lib/minerva/achievements-store";
import { trackForgeEvent } from "@/lib/minerva/telemetry";
import { useTranslation } from "@/lib/i18n/use-translation";

interface HeroProps {
  /** `null` = el Character Sheet todavía no existe en Supabase (estado vacío). */
  character: Character | null;
  /** Etiquetas flotantes (capa z-20) — hoy, los ítems top del Inventario real. */
  tags?: string[];
  /** Enlace del CTA "Iniciar Quest" (mailto del contacto, vía Minerva). */
  ctaHref?: string;
  /** Enlace del CTA secundario "Descargar CV" (PDF servido desde /public). */
  resumeHref?: string;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Nombre de marca del sitio — sólo se usa para la palabra gigante si la ficha está vacía. */
const BRAND = "Devius";

/**
 * EmberParticles — brasas CSS puras (ver `globals.css` → `.animate-ember-rise`).
 * Heredan el apagado global de `prefers-reduced-motion` sin JS extra.
 */
const PARTICLES = [
  { left: "8%", size: 3, duration: 14, delay: 0 },
  { left: "22%", size: 2, duration: 18, delay: 2.5 },
  { left: "38%", size: 4, duration: 12, delay: 1 },
  { left: "54%", size: 2, duration: 20, delay: 4 },
  { left: "67%", size: 3, duration: 15, delay: 3 },
  { left: "79%", size: 2, duration: 17, delay: 0.8 },
  { left: "91%", size: 3, duration: 13, delay: 5.5 },
];

function EmberParticles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {PARTICLES.map((particle, index) => (
        <span
          key={index}
          className="animate-ember-rise absolute bottom-0 rounded-full bg-gold-glow/50"
          style={{
            left: particle.left,
            width: particle.size,
            height: particle.size,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Posiciones de las etiquetas flotantes alrededor del retrato (desktop). */
const TAG_SLOTS = [
  "left-[9%] top-[24%]",
  "right-[7%] top-[30%]",
  "right-[15%] top-[50%]",
];

/**
 * Hero — Hefesto, Iteración 19 ("El Efecto WOW", referencia: imagen).
 * Composición por capas con z-index explícito:
 *
 *   z-0  → palabra gigante (el nombre) detrás de todo, en contorno + relleno
 *          tenue, entrando letra por letra.
 *   z-10 → retrato (`heroImageUrl`, PNG sin fondo) centrado y anclado abajo,
 *          con máscara que lo funde con la obsidiana. Sin imagen: un sigilo.
 *   z-20 → título masivo (clase del personaje), tagline, etiquetas flotantes
 *          y CTAs — por encima del retrato.
 *
 * Parallax de scroll: cada capa se desplaza a distinta velocidad
 * (`useScroll` + `useTransform`), lo que refuerza la profundidad. Todo lo
 * que es movimiento JS se apaga con `useReducedMotion()`.
 */
export function Hero({ character, tags = [], ctaHref, resumeHref }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const unlock = useAchievementsStore((state) => state.unlock);
  const unlockCallToAdventure = () => unlock("call-to-adventure");
  const { t } = useTranslation();

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const wordY = useTransform(scrollYProgress, [0, 1], ["0%", "45%"]);
  const portraitY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const portraitScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);
  const foregroundY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const foregroundOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const name = character?.name ?? BRAND;
  const wordmark = name.toUpperCase();
  // Tamaño fluido según el largo del nombre: siempre cabe en una línea.
  const wordmarkSize = `clamp(4.5rem, ${Math.min(26, 118 / Math.max(wordmark.length, 1)).toFixed(2)}vw, 24rem)`;
  const foregroundStyle = reduce ? undefined : { y: foregroundY, opacity: foregroundOpacity };
  // Iteración 20: el título nunca se recorta — el tamaño se calcula con la
  // palabra más larga (≈0.76em por letra en Cinzel Black) para el ancho de
  // la columna: ~90vw en mobile, ~56vw (8/12 columnas) en desktop.
  const longestWord = Math.max(
    ...(character?.characterClass ?? t.hero.forgeEmptyTitle.replace(/\n/g, " ")).split(/\s+/).map((w) => w.length),
    4
  );
  const titleSizeVars = {
    "--title-sm": `clamp(2.25rem, ${Math.min(14, 90 / (longestWord * 0.76)).toFixed(2)}vw, 9rem)`,
    "--title-lg": `clamp(3rem, ${Math.min(10, 56 / (longestWord * 0.76)).toFixed(2)}vw, 9rem)`,
  } as CSSProperties;
  const titleLines = character ? character.characterClass.trim().split(/\s+/).join("\n") : t.hero.forgeEmptyTitle;

  return (
    <section
      ref={sectionRef}
      id="home"
      // `--ph` = alto real del retrato (4:5, contenido en su caja). La palabra
      // gigante se ancla a esa medida para caer siempre a la altura de la cabeza.
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden px-4 pb-8 pt-24 [--ph:min(72svh,min(100vw,680px)*1.25,900px)] sm:px-8 sm:pt-28 sm:[--ph:min(82svh,min(100vw,680px)*1.25,900px)] print:hidden"
    >
      {/* Aura de la forja */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[30%] -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-emerald-glow/15 blur-3xl sm:h-[44rem] sm:w-[44rem]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[45%] -z-10 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-gold-glow/15 blur-3xl sm:h-[30rem] sm:w-[30rem]"
      />
      <EmberParticles />

      {/* ── z-0 · Palabra gigante ──────────────────────────────────────── */}
      <motion.div
        aria-hidden
        style={reduce ? undefined : { y: wordY }}
        className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--ph)*0.66)] z-0 select-none text-center"
      >
        <div className="font-display font-black leading-[0.8] tracking-[-0.03em]" style={{ fontSize: wordmarkSize }}>
          {/* Iteración 20: contorno + relleno viven en la MISMA letra (antes eran
              dos capas que podían desalinearse por el pb de la máscara). */}
          <RevealText
            text={wordmark}
            split="chars"
            delay={0.15}
            stagger={0.05}
            duration={1.1}
            className="block"
            unitClassName="bg-gradient-to-b from-parchment/[0.42] via-parchment/[0.16] to-parchment/[0.03] bg-clip-text text-transparent [-webkit-text-stroke:1px_rgba(233,230,223,0.16)]"
          />
        </div>
      </motion.div>

      {/* ── z-10 · Retrato ────────────────────────────────────────────── */}
      <motion.div
        style={reduce ? undefined : { y: portraitY, scale: portraitScale }}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 mx-auto flex h-[var(--ph)] w-full max-w-[680px] justify-center"
      >
        <motion.div
          className="relative h-full w-full"
          initial={reduce ? false : { opacity: 0, y: 80, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.4, delay: 0.35, ease: EASE_OUT_EXPO }}
        >
          {character?.heroImageUrl ? (
            <Image
              src={character.heroImageUrl}
              alt={`Retrato de ${name}`}
              fill
              priority
              sizes="(min-width: 680px) 680px, 100vw"
              className="hero-portrait-mask object-contain object-bottom drop-shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            />
          ) : (
            // Sigilo — ocupa el lugar del retrato hasta que se suba uno desde /admin/character.
            <div aria-hidden className="absolute inset-x-0 bottom-[14%] mx-auto aspect-square w-[min(70%,420px)]">
              <span className="absolute inset-0 rounded-full border border-white/10" />
              <span className="absolute inset-[8%] rounded-full border border-dashed border-gold-glow/25" />
              <span className="absolute inset-[18%] rounded-full bg-gradient-to-b from-emerald-glow/10 to-transparent shadow-[0_0_120px_20px_rgba(52,211,153,0.12)]" />
              <span className="absolute inset-0 flex items-center justify-center font-display text-[min(30vw,11rem)] text-gold-glow/70">
                {name.charAt(0)}
              </span>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* ── z-20 · Etiquetas flotantes ────────────────────────────────── */}
      {tags.slice(0, TAG_SLOTS.length).map((tag, index) => (
        <motion.span
          key={tag}
          aria-hidden
          className={`pointer-events-none absolute z-20 hidden items-center gap-2 rounded-full border border-white/10 bg-obsidian/60 px-3.5 py-1.5 text-xs font-medium text-parchment/85 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md lg:inline-flex ${TAG_SLOTS[index]}`}
          initial={reduce ? false : { opacity: 0, scale: 0.8, y: 20 }}
          animate={
            reduce
              ? { opacity: 1 }
              : { opacity: 1, scale: 1, y: [0, -8, 0] }
          }
          transition={{
            opacity: { duration: 0.6, delay: 1.1 + index * 0.15 },
            scale: { duration: 0.6, delay: 1.1 + index * 0.15, ease: EASE_OUT_EXPO },
            y: { duration: 4 + index, repeat: Infinity, ease: "easeInOut", delay: 1.7 + index * 0.15 },
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-glow shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
          {tag}
        </motion.span>
      ))}

      {/* ── z-20 · Primer plano ───────────────────────────────────────── */}
      {/* Iteración 20: este contenedor NO lleva z-index ni transform a propósito —
          cada hijo es su propia capa z-20. Así el bloque del título puede usar
          `mix-blend-difference` contra el retrato (un stacking context en el
          padre aislaría el blend y no tendría efecto). */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-between gap-10">
        {/* Fila superior */}
        <motion.div
          style={foregroundStyle}
          className="relative z-20 flex flex-col items-start justify-between gap-4 sm:flex-row"
        >
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-obsidian/50 px-3.5 py-1.5 text-xs text-parchment/80 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-glow/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-glow" />
            </span>
            {t.hero.availableBadge}
          </motion.p>

          {character?.tagline && (
            <RevealText
              as="p"
              text={character.tagline}
              delay={0.6}
              stagger={0.03}
              className="max-w-xs text-sm leading-relaxed text-parchment/70 sm:text-right"
            />
          )}
        </motion.div>

        {/* Fila inferior */}
        {/* `mt-auto` en mobile: título + CTAs bajan sobre el torso y dejan la cabeza
            libre para la palabra gigante; en desktop quedan a media altura (ref. Madison). */}
        <div className="mt-auto grid grid-cols-1 items-end gap-8 lg:mt-0 lg:grid-cols-12">
          {/* Título: `mix-blend-difference` = claro sobre la obsidiana, oscuro sobre
              la ropa/piel del retrato — contraste en ambas zonas (ref. Madison). */}
          <motion.div style={foregroundStyle} className="relative z-20 mix-blend-difference lg:col-span-8">
            <p className="mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-emerald-glow">
              <span aria-hidden className="h-px w-10 bg-emerald-glow/50" />
              {character ? t.hero.helloPrefix(name) : name}
            </p>
            <h1
              className="font-display font-black uppercase leading-[0.86] tracking-[-0.02em] text-parchment"
              style={titleSizeVars}
            >
              {character && <span className="sr-only">{name}, </span>}
              <RevealText
                text={titleLines}
                split="lines"
                delay={0.45}
                stagger={0.14}
                duration={1.1}
                className="block text-[length:var(--title-sm)] lg:text-[length:var(--title-lg)]"
              />
            </h1>
          </motion.div>

          <motion.div
            style={foregroundStyle}
            className="relative z-20 flex flex-col gap-6 lg:col-span-4 lg:items-end lg:pb-3"
          >
            {!character && (
              <p className="max-w-xs text-sm leading-relaxed text-parchment-muted lg:text-right">
                {t.hero.emptyNotice}
              </p>
            )}

            {(ctaHref || resumeHref) && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.1, ease: EASE_OUT_EXPO }}
                className="flex flex-wrap items-center gap-3"
              >
                {ctaHref && (
                  <Magnetic>
                    <a href={ctaHref} onClick={unlockCallToAdventure}>
                      <Button variant="cta" className="gap-2 px-6 py-3">
                        <Swords className="h-4 w-4" aria-hidden />
                        {t.hero.startQuestCta}
                      </Button>
                    </a>
                  </Magnetic>
                )}
                {resumeHref && (
                  <Magnetic strength={0.3}>
                    <a
                      href={resumeHref}
                      download
                      onClick={() => {
                        unlockCallToAdventure();
                        trackForgeEvent("cv_downloaded", { source: "hero" });
                      }}
                    >
                      <Button variant="secondary" className="gap-2 bg-obsidian/60 px-6 py-3 backdrop-blur-md">
                        <Download className="h-4 w-4" aria-hidden />
                        {t.hero.downloadCta}
                      </Button>
                    </a>
                  </Magnetic>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Riel inferior — numeración + indicador de scroll (referencia: video) */}
        <motion.div
          style={foregroundStyle}
          className="relative z-20 flex items-center justify-between text-[0.65rem] uppercase tracking-[0.3em] text-parchment-muted"
        >
          <span className="flex items-center gap-3">
            <span className="tabular-nums text-parchment">01</span>
            <span aria-hidden className="h-px w-10 bg-white/20" />
            {t.hero.homeLabel}
          </span>
          <a
            href="#quests"
            className="flex items-center gap-2 rounded-full px-2 py-1 transition-colors hover:text-parchment"
          >
            {t.hero.scrollLabel}
            <motion.span
              aria-hidden
              animate={reduce ? undefined : { y: [0, 4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </motion.span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
