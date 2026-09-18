"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { usePathname } from "next/navigation";
import { type ReactNode, useContext, useState } from "react";

/**
 * FrozenRouter — congela el contexto del router del árbol que está
 * SALIENDO. Sin esto, en el App Router el `children` viejo se re-renderiza
 * con el segmento nuevo apenas cambia la URL, y el fade-out mostraría la
 * página nueva desvaneciéndose (el famoso "flash" de AnimatePresence en
 * Next.js). Guardamos el contexto del primer render en estado y lo
 * re-proveemos tal cual mientras dure el exit.
 *
 * Nota: `LayoutRouterContext` es un import interno de Next.js (no API
 * pública). Verificado en next@16.3.5 — si una actualización lo mueve, el
 * build lo delata inmediatamente en este archivo.
 */
function FrozenRouter({ children }: { children: ReactNode }) {
  const context = useContext(LayoutRouterContext);
  // `useState` con inicializador: se captura una sola vez (primer render) y nunca cambia.
  const [frozen] = useState(() => context);
  return <LayoutRouterContext.Provider value={frozen}>{children}</LayoutRouterContext.Provider>;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * PageTransition — Minerva, Iteración 19 ("El Efecto WOW").
 * `AnimatePresence mode="wait"` keyed por `pathname`: la página actual
 * hace fade-out (+ leve blur y desplazamiento hacia arriba, como en la
 * referencia) y recién entonces entra la nueva. Los cambios de hash
 * (`/#quests`) no cambian `pathname`, así que no disparan transición.
 *
 * Accesibilidad: con `prefers-reduced-motion`, sólo cross-fade corto, sin
 * blur ni desplazamiento.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  const variants = reduce
    ? {
        initial: { opacity: 0 },
        enter: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.15 } },
      }
    : {
        initial: { opacity: 0, y: 24, filter: "blur(8px)" },
        enter: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.7, ease: EASE_OUT_EXPO },
          // Un `filter`/`transform` residual en el wrapper convertiría a este div en
          // containing block de todo `position: fixed` interno (lightbox de
          // ChapterMediaFrame, diálogos). Al terminar, se limpia del todo.
          transitionEnd: { filter: "none", transform: "none" },
        },
        exit: {
          opacity: 0,
          y: -16,
          filter: "blur(6px)",
          transition: { duration: 0.35, ease: [0.7, 0, 0.84, 0] as const },
        },
      };

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
      onExitComplete={() => {
        // La página nueva monta DESPUÉS del exit: el scroll-to-top nativo de
        // Next.js ya ocurrió sobre la vieja. Lo repetimos, salvo con #hash
        // (ScrollToHash se encarga de esos).
        if (!window.location.hash) window.scrollTo({ top: 0, behavior: "instant" });
      }}
    >
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="enter"
        exit="exit"
        // `flex-1 flex flex-col`: preserva el layout de `<main className="flex-1">` dentro de `body.flex-col`.
        className="flex flex-1 flex-col"
      >
        <FrozenRouter>{children}</FrozenRouter>
      </motion.div>
    </AnimatePresence>
  );
}
