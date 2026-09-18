"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type HTMLMotionProps,
} from "framer-motion";
import { type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TiltCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  /** Inclinación máxima en grados. */
  maxTilt?: number;
  /** Color del brillo que sigue al cursor. */
  glareColor?: string;
  className?: string;
}

const SPRING = { stiffness: 220, damping: 18, mass: 0.4 };

/**
 * TiltCard — Hefesto, Iteración 21 ("Inventario 3D"). Parallax tilt:
 * la carta rota en X/Y siguiendo el cursor (con resorte) y un brillo
 * radial sigue la posición del puntero, como luz sobre un objeto físico.
 * Los hijos marcados con `data-depth` flotan en Z (`translateZ`) gracias
 * a `transformStyle: preserve-3d`.
 *
 * Sólo reacciona a `pointerType === "mouse"`; con reduced-motion no rota
 * (el brillo sí aparece, es sólo luz).
 */
export function TiltCard({ children, maxTilt = 10, glareColor = "rgba(232,196,104,0.22)", className, ...rest }: TiltCardProps) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 30 });

  const rotateX = useSpring(useTransform(py, [0, 1], [maxTilt, -maxTilt]), SPRING);
  const rotateY = useSpring(useTransform(px, [0, 1], [-maxTilt, maxTilt]), SPRING);
  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, ${glareColor}, transparent 60%)`;

  function handleMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
    glareOpacity.set(1);
  }

  function handleLeave() {
    px.set(0.5);
    py.set(0.5);
    glareOpacity.set(0);
  }

  return (
    <div className="[perspective:900px]">
      <motion.div
        {...rest}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={cn("relative will-change-transform", className)}
      >
        {children}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ background: glare, opacity: glareOpacity }}
        />
      </motion.div>
    </div>
  );
}
