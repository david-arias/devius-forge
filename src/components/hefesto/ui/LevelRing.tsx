"use client";

import { motion } from "framer-motion";

interface LevelRingProps {
  label: string;
  /** Nivel de dominio, 0-100. */
  level: number;
  /** Color de acento hex del anillo (por categoría). */
  color: string;
  className?: string;
}

const SIZE = 76;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * LevelRing — medidor de nivel circular (Hefesto). Ver MASTER.md.
 * Sustituye a las píldoras de texto en el Inventario: look de menú de
 * estado de videojuego (anillo de progreso + porcentaje + etiqueta).
 * El trazo se anima con `whileInView` (una sola vez), respeta
 * `prefers-reduced-motion` heredado de las reglas globales de `globals.css`.
 */
export function LevelRing({ label, level, color, className }: LevelRingProps) {
  const clamped = Math.min(100, Math.max(0, level));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  return (
    <div className={`flex flex-col items-center gap-2 text-center ${className ?? ""}`}>
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE}
          />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: `drop-shadow(0 0 6px color-mix(in srgb, ${color} 55%, transparent))` }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-sm text-parchment">
          {clamped}
        </span>
      </div>
      <span className="text-xs font-medium text-parchment-muted">{label}</span>
    </div>
  );
}
