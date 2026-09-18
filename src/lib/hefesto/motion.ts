import { type Variants } from "framer-motion";

/**
 * Presets de micro-interacciones — dominio de Hefesto.
 * Únicas fuentes de verdad para animación de entrada/hover en toda la UI.
 * Ver MASTER.md → "Micro-interacciones".
 */

/** Contenedor que orquesta el stagger de sus hijos directos con variants. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

/** Fade + translateY para tarjetas e ítems individuales — caen en cascada desde abajo. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Fade + translateX — entrada deslizando desde un lado. Se pasa como
 * `variants` explícito a `Card` (sobre-escribe su `fadeInUp` por defecto,
 * las props ganan por orden de spread) donde se quiera ese efecto en vez
 * del "caer desde abajo" estándar — p. ej. el Skill Tree.
 */
export const slideIn: Variants = {
  hidden: { opacity: 0, x: -32 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Tilt/elevación al hacer hover sobre una carta (Quest/Character Sheet/Item). */
export const cardHover = {
  y: -6,
  scale: 1.01,
  transition: { duration: 0.25, ease: "easeOut" as const },
};
