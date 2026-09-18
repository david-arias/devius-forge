"use client";

import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MediaRevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * MediaReveal — Hefesto, Iteración 19 (referencia: video). La media de
 * cada Quest se "abre" al entrar en viewport: un clip-path que va de un
 * recuadro contraído a todo el marco. El zoom de hover vive en CSS
 * (`.media-zoom`, globals.css) para que también responda a
 * `:focus-within` (teclado) sin JS extra.
 */
export function MediaReveal({ children, className }: MediaRevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn("group/media", className)}
      initial={reduce ? false : { clipPath: "inset(10% 8% 10% 8% round 28px)", opacity: 0.4 }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0% round 16px)", opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
