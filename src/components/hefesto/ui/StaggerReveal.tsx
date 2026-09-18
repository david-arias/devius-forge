"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { staggerContainer } from "@/lib/hefesto/motion";

interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  /** Elemento semántico del contenedor. Por defecto `div`; usar `ul`/`ol` cuando envuelve una lista. */
  as?: "div" | "ul" | "ol";
}

const componentByTag = {
  div: motion.div,
  ul: motion.ul,
  ol: motion.ol,
} as const;

/**
 * StaggerReveal — orquesta el fade-in escalonado de sus hijos directos
 * (deben ser `motion` components con variants `fadeInUp`, o `Card`, que ya
 * lo implementa). Se dispara una vez al entrar en viewport. Hefesto / MASTER.md.
 */
export function StaggerReveal({ children, className, as = "div" }: StaggerRevealProps) {
  const MotionTag = componentByTag[as];
  return (
    <MotionTag
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
