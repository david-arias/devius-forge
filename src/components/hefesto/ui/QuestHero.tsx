"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { type QuestMedia } from "@/lib/demeter/schemas";

interface QuestHeroProps {
  media: QuestMedia;
}

/**
 * QuestHero — Hefesto, Iteración 14 ("La Forja Oculta"). Extraído de la
 * cabecera de `/quests/[slug]/page.tsx` (Server Component) porque el
 * parallax necesita `useScroll`/`useTransform` de Framer Motion, que sólo
 * corre en cliente — mismo criterio ya usado para `AchievementCtaLink.tsx`
 * y `QuestDwellTracker.tsx`: un wrapper mínimo `"use client"`, en vez de
 * convertir toda la página en Client Component.
 *
 * Sólo se monta cuando `quest.media` existe (la página sigue cayendo al
 * `imagePlaceholder` de gradiente cuando no hay evidencia real — ese
 * fallback no necesita parallax, es estático).
 *
 * `useScroll({ target })` mide el progreso de scroll del propio contenedor
 * del hero (no de toda la página); `useTransform` mapea ese progreso a un
 * translateY sutil (0 → 18%) y una escala leve (1 → 1.08) mientras el
 * hero sale de vista — efecto de profundidad clásico sin depender de
 * ninguna librería de parallax externa.
 *
 * Accesibilidad (CRITICAL): `useReducedMotion()` desactiva el parallax por
 * completo (el `motion.div` no anima, sólo se monta como contenedor
 * estático) — igual que `Ember`/`Magnetic` en el Hero de la home, esta es
 * una animación disparada por JS que el `prefers-reduced-motion` global de
 * `globals.css` no cubre por sí sola.
 */
export function QuestHero({ media }: QuestHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={prefersReducedMotion ? undefined : { y, scale }}
      >
        {media.type === "video" ? (
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
          <Image
            src={media.src}
            alt={media.alt}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        )}
      </motion.div>
    </div>
  );
}
