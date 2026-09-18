"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { type PointerEvent, type ReactNode } from "react";

interface MagneticProps {
  children: ReactNode;
  /** Fuerza del tirón magnético (fracción del offset del cursor que se traslada). Default 0.35. */
  strength?: number;
  className?: string;
}

/**
 * Magnetic — Iteración 8 (Hefesto). Envuelve un CTA y lo hace "seguir" el
 * cursor sutilmente dentro de su propio área, como si el imán de la forja
 * lo atrajera. Vuelve a su posición con un `spring` al salir.
 *
 * Sólo pensado para los 3 CTAs principales "Iniciar Quest" (Navbar, Hero,
 * Footer) — no se aplica a botones secundarios para no saturar la página
 * de movimiento.
 *
 * Accesibilidad (HADES):
 *  - `useReducedMotion()` neutraliza el tirón por completo (el hijo se
 *    renderiza sin transformación ni listeners de movimiento) — igual que
 *    las runas del Hero, este es un `animate` disparado por JS que el
 *    `prefers-reduced-motion` de `globals.css` NO cubre por sí solo, así
 *    que hay que apagarlo explícitamente aquí.
 *  - Es un wrapper puramente visual (`motion.div` sin rol ni tabIndex
 *    propio): el `<a>`/`<button>` real que envuelve conserva su foco,
 *    su `:focus-visible` y su orden de Tab exactamente igual que sin el
 *    wrapper — el imán sólo reacciona a `pointermove`, nunca a teclado.
 */
export function Magnetic({ children, strength = 0.35, className }: MagneticProps) {
  const prefersReducedMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 18, stiffness: 220, mass: 0.6 });
  const springY = useSpring(y, { damping: 18, stiffness: 220, mass: 0.6 });

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - (bounds.left + bounds.width / 2);
    const offsetY = event.clientY - (bounds.top + bounds.height / 2);
    x.set(offsetX * strength);
    y.set(offsetY * strength);
  }

  function handlePointerLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      className={className}
      style={{ x: springX, y: springY, display: "inline-block" }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </motion.div>
  );
}
