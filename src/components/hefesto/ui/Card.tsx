"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  type HTMLMotionProps,
} from "framer-motion";
import { type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { cardHover, fadeInUp } from "@/lib/hefesto/motion";

interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: ReactNode;
  /**
   * Color de acento (hex) de esta carta — tiñe el spotlight que sigue el
   * cursor y la sombra de elevación en hover. Cada Quest trae el suyo;
   * el resto de cartas usa el dorado de marca por defecto.
   */
  accentColor?: string;
}

/**
 * Card — "carta de inventario/quest" (Hefesto). Ver MASTER.md.
 *
 * Tres capas de profundidad sobre el glassmorphism base:
 *  1. Borde en gradiente (luz incidiendo desde arriba) — pseudo-capa con
 *     `padding: 1px` + `mask-composite: exclude`, siempre visible.
 *  2. Spotlight que seguía el cursor (`useMotionValue`/`useMotionTemplate`,
 *     sin re-render de React en cada movimiento) — sólo visible en hover,
 *     tintado con `accentColor` vía `color-mix()`.
 *  3. Tilt/elevación (`whileHover`: y -6px + scale 1.01) con sombra que
 *     también se tiñe del `accentColor` de la carta.
 *
 * Componente puro: recibe children, no conoce datos ni rutas. Anima su
 * propia entrada (fadeInUp) — hereda el disparo de stagger del
 * `StaggerReveal` ancestro más cercano.
 */
export function Card({
  className,
  children,
  accentColor = "#e8c468",
  style,
  ...props
}: CardProps) {
  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(50);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    mouseX.set(((event.clientX - bounds.left) / bounds.width) * 100);
    mouseY.set(((event.clientY - bounds.top) / bounds.height) * 100);
  }

  const spotlight = useMotionTemplate`radial-gradient(380px circle at ${mouseX}% ${mouseY}%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 62%)`;

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={cardHover}
      onPointerMove={handlePointerMove}
      style={{ ...style, "--accent": accentColor } as CSSProperties}
      className={cn(
        "group relative isolate overflow-hidden rounded-xl",
        "bg-white/[0.03] p-6 backdrop-blur-xl sm:p-7",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]",
        "transition-shadow duration-300 ease-out",
        "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_24px_56px_-20px_color-mix(in_srgb,var(--accent)_50%,transparent)]",
        className
      )}
      {...props}
    >
      {/* Borde en gradiente — simula luz incidiendo desde arriba. Siempre visible, no sólo en hover. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          padding: 1,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.08) 100%)",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* Spotlight que sigue el cursor — sólo visible en hover, tintado con accentColor */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: spotlight }}
      />

      <div className="relative">{children}</div>
    </motion.div>
  );
}
