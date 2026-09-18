"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { type ElementType } from "react";
import { cn } from "@/lib/utils";

type RevealTag = "h1" | "h2" | "h3" | "p" | "span" | "div";

interface RevealTextProps {
  /** Texto a revelar. Con `split="lines"`, cada `\n` es una línea. */
  text: string;
  as?: RevealTag;
  /** Unidad de la cascada: palabras (default), letras o líneas. */
  split?: "words" | "chars" | "lines";
  /** `mount` = al cargar (Hero); `inView` = al entrar en viewport (secciones). */
  trigger?: "mount" | "inView";
  delay?: number;
  stagger?: number;
  duration?: number;
  className?: string;
  /** Clases extra para cada unidad (p.ej. gradientes por palabra). */
  unitClassName?: string;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * RevealText — Hefesto, Iteración 19 ("El Efecto WOW", referencia: video).
 * Cada unidad vive en una "máscara" `overflow-hidden` y su contenido sube
 * de `y: 110%` a `0` en cascada — el texto no "aparece", emerge desde una
 * línea base invisible.
 *
 * Accesibilidad: el texto completo va en un `sr-only` y las unidades
 * animadas son `aria-hidden`, así un lector de pantalla lee "Hybrid
 * Forgemaster" y no "H y b r i d…". Con `prefers-reduced-motion` se
 * renderiza estático (`initial={false}`).
 *
 * `pb-[0.12em]` en la máscara evita que el `overflow-hidden` recorte los
 * descendentes (g, p, y) de la tipografía display.
 */
export function RevealText({
  text,
  as = "span",
  split = "words",
  trigger = "mount",
  delay = 0,
  stagger,
  duration = 0.9,
  className,
  unitClassName,
}: RevealTextProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as] as ElementType;

  const lines = split === "lines" ? text.split("\n") : [text];
  const defaultStagger = split === "chars" ? 0.035 : split === "lines" ? 0.12 : 0.08;

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger ?? defaultStagger, delayChildren: delay } },
  };
  const unit: Variants = {
    hidden: { y: "110%", rotate: 2 },
    visible: { y: "0%", rotate: 0, transition: { duration, ease: EASE_OUT_EXPO } },
  };

  const triggerProps =
    trigger === "mount"
      ? { initial: reduce ? false : "hidden", animate: "visible" }
      : {
          initial: reduce ? false : "hidden",
          whileInView: "visible",
          viewport: { once: true, amount: 0.4 },
        };

  const renderUnits = (line: string, lineIndex: number) => {
    if (split === "lines") {
      return (
        <span key={lineIndex} className="block overflow-hidden pb-[0.12em]">
          <motion.span variants={unit} className={cn("block will-change-transform", unitClassName)}>
            {line}
          </motion.span>
        </span>
      );
    }
    const words = line.split(" ");
    return words.map((word, wordIndex) => (
      <span key={`${lineIndex}-${wordIndex}`} className="inline-block whitespace-nowrap">
        {split === "chars" ? (
          Array.from(word).map((char, charIndex) => (
            <span key={charIndex} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
              <motion.span variants={unit} className={cn("inline-block will-change-transform", unitClassName)}>
                {char}
              </motion.span>
            </span>
          ))
        ) : (
          <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <motion.span variants={unit} className={cn("inline-block will-change-transform", unitClassName)}>
              {word}
            </motion.span>
          </span>
        )}
        {wordIndex < words.length - 1 && " "}
      </span>
    ));
  };

  return (
    <Tag variants={container} className={className} {...triggerProps}>
      <span className="sr-only">{text.replace(/\n/g, " ")}</span>
      <span aria-hidden className="contents">
        {lines.map(renderUnits)}
      </span>
    </Tag>
  );
}
