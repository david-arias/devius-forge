"use client";

import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ForgeStatusScreenProps {
  /** Número/código gigante de fondo ("404", "500"). */
  code: string;
  eyebrow: string;
  title: string;
  description: string;
  /** Botones/enlaces de salida. */
  children?: ReactNode;
  /** Pie opcional (p. ej. el digest del error). */
  footnote?: ReactNode;
  /** `extinguished` = forja apagada (error); `lost` = runa perdida (404). */
  variant?: "extinguished" | "lost";
  className?: string;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Llama de la forja: parpadea (error) o flota tranquila (404). SVG puro. */
function ForgeFlame({ variant }: { variant: "extinguished" | "lost" }) {
  const reduce = useReducedMotion();
  const flicker = variant === "extinguished";
  return (
    <div aria-hidden className="relative mx-auto mb-10 h-40 w-40">
      <div
        className={cn(
          "absolute inset-0 rounded-full blur-3xl",
          flicker ? "bg-gold-glow/20" : "bg-emerald-glow/20",
          flicker && !reduce && "animate-forge-flicker"
        )}
      />
      <svg viewBox="0 0 120 120" className="relative h-full w-full">
        <defs>
          <linearGradient id="forge-flame" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={flicker ? "#8a6a1f" : "#0f6b4f"} />
            <stop offset="60%" stopColor={flicker ? "#e8c468" : "#34d399"} />
            <stop offset="100%" stopColor="#fff7e0" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* Yunque */}
        <path
          d="M22 88h76l-6 8H70v8h10v6H40v-6h10v-8H28z M30 80h60c0 4-4 8-10 8H40c-6 0-10-4-10-8z"
          fill="#1a1a24"
          stroke="rgba(233,230,223,0.25)"
          strokeWidth="1"
        />
        {/* Llama */}
        <motion.path
          d="M60 20c6 14 20 22 20 40 0 12-9 20-20 20s-20-8-20-20c0-10 6-14 8-22 2 6 6 8 8 8-2-10 0-18 4-26z"
          fill="url(#forge-flame)"
          style={{ transformOrigin: "60px 80px" }}
          initial={false}
          animate={
            reduce
              ? { opacity: flicker ? 0.45 : 0.9 }
              : flicker
                ? { opacity: [0.9, 0.25, 0.8, 0.1, 0.6, 0.35, 0.9], scaleY: [1, 0.7, 0.95, 0.55, 0.85, 0.65, 1] }
                : { scaleY: [1, 1.06, 0.97, 1], y: [0, -2, 0, 0] }
          }
          transition={{ duration: flicker ? 2.6 : 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Brasas */}
        {[42, 58, 76].map((x, i) => (
          <motion.circle
            key={x}
            cx={x}
            cy={74}
            r={1.6}
            fill="#e8c468"
            initial={false}
            animate={reduce ? { opacity: 0.4 } : { cy: [74, 40, 20], opacity: [0, 1, 0] }}
            transition={{ duration: 2.4 + i * 0.5, repeat: Infinity, delay: i * 0.7, ease: "easeOut" }}
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * ForgeStatusScreen — Hades/Hefesto, Iteración 23. Pantalla compartida por
 * `error.tsx`, `global-error.tsx` y `not-found.tsx`: código gigante en
 * contorno de fondo, llama de la forja (parpadeante si hubo un error),
 * titular, descripción y acciones. `role="alert"` sólo en errores reales.
 */
export function ForgeStatusScreen({
  code,
  eyebrow,
  title,
  description,
  children,
  footnote,
  variant = "extinguished",
  className,
}: ForgeStatusScreenProps) {
  const reduce = useReducedMotion();
  const enter = (delay: number) => ({
    initial: reduce ? false : ({ opacity: 0, y: 16 } as const),
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: EASE_OUT_EXPO },
  });

  return (
    <section
      role={variant === "extinguished" ? "alert" : undefined}
      className={cn(
        "relative isolate flex min-h-[100svh] flex-1 flex-col items-center justify-center overflow-hidden px-4 py-28 text-center sm:px-8",
        className
      )}
    >
      <p
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 select-none font-display text-[38vw] font-black leading-none tracking-[-0.05em] text-transparent [-webkit-text-stroke:1px_rgba(233,230,223,0.07)] sm:text-[30vw]"
      >
        {code}
      </p>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-obsidian/80 blur-3xl"
      />

      <ForgeFlame variant={variant} />

      <motion.p
        {...enter(0.1)}
        className={cn(
          "mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.35em]",
          variant === "extinguished" ? "text-gold-glow" : "text-emerald-glow"
        )}
      >
        <span aria-hidden className="h-px w-8 bg-current opacity-50" />
        {eyebrow}
        <span aria-hidden className="h-px w-8 bg-current opacity-50" />
      </motion.p>
      <motion.h1
        {...enter(0.2)}
        className="max-w-3xl text-balance font-display text-4xl leading-[1.05] text-parchment sm:text-6xl"
      >
        {title}
      </motion.h1>
      <motion.p {...enter(0.3)} className="mt-6 max-w-xl text-balance leading-relaxed text-parchment/65">
        {description}
      </motion.p>
      {children && (
        <motion.div {...enter(0.45)} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {children}
        </motion.div>
      )}
      {footnote && (
        <motion.div {...enter(0.6)} className="mt-10 text-xs text-parchment-muted/70">
          {footnote}
        </motion.div>
      )}
    </section>
  );
}
