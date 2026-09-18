"use client";

import { motion, useReducedMotion } from "framer-motion";

interface Blip {
  /** Ángulo en grados (0 = arriba, sentido horario). */
  angle: number;
  /** Distancia al centro, 0–1. */
  distance: number;
  label: string;
}

interface TelemetryRadarProps {
  blips: Blip[];
  className?: string;
}

const SIZE = 280;
const C = SIZE / 2;

/**
 * TelemetryRadar — Hefesto, Iteración 24. Radar SVG decorativo del Centro
 * de Telemetría: anillos, retícula, un barrido cónico que gira y "blips"
 * que se encienden a su paso (uno por señal que el sitio emite).
 * `aria-hidden`: la información real está en las tarjetas de al lado.
 * Reduced-motion: barrido estático y blips fijos.
 */
export function TelemetryRadar({ blips, className }: TelemetryRadarProps) {
  const reduce = useReducedMotion();
  const sweepSeconds = 6;

  return (
    <div aria-hidden className={className}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full overflow-visible">
        <defs>
          <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(52,211,153,0.16)" />
            <stop offset="70%" stopColor="rgba(52,211,153,0.04)" />
            <stop offset="100%" stopColor="rgba(52,211,153,0)" />
          </radialGradient>
          <linearGradient id="radar-sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(52,211,153,0)" />
            <stop offset="100%" stopColor="rgba(52,211,153,0.45)" />
          </linearGradient>
          <filter id="radar-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        <circle cx={C} cy={C} r={C - 2} fill="url(#radar-bg)" stroke="rgba(52,211,153,0.35)" />
        {[0.25, 0.5, 0.75].map((f) => (
          <circle key={f} cx={C} cy={C} r={(C - 2) * f} fill="none" stroke="rgba(233,230,223,0.08)" />
        ))}
        <line x1={C} y1={4} x2={C} y2={SIZE - 4} stroke="rgba(233,230,223,0.08)" />
        <line x1={4} y1={C} x2={SIZE - 4} y2={C} stroke="rgba(233,230,223,0.08)" />
        {Array.from({ length: 36 }, (_, i) => {
          const a = (i * 10 * Math.PI) / 180;
          const inner = i % 3 === 0 ? C - 14 : C - 8;
          return (
            <line
              key={i}
              x1={C + Math.sin(a) * inner}
              y1={C - Math.cos(a) * inner}
              x2={C + Math.sin(a) * (C - 2)}
              y2={C - Math.cos(a) * (C - 2)}
              stroke="rgba(52,211,153,0.35)"
            />
          );
        })}

        {/* Barrido: cuña de 60° que gira alrededor del centro */}
        <motion.g
          style={{ originX: `${C}px`, originY: `${C}px` }}
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: sweepSeconds, repeat: Infinity, ease: "linear" }}
        >
          <path
            d={`M ${C} ${C} L ${C} 2 A ${C - 2} ${C - 2} 0 0 1 ${C + Math.sin(Math.PI / 3) * (C - 2)} ${C - Math.cos(Math.PI / 3) * (C - 2)} Z`}
            fill="url(#radar-sweep)"
            opacity={0.55}
            transform={`rotate(-60 ${C} ${C})`}
          />
          <line x1={C} y1={C} x2={C} y2={2} stroke="#34d399" strokeWidth={1.5} />
        </motion.g>

        {blips.map((blip) => {
          const a = (blip.angle * Math.PI) / 180;
          const r = (C - 20) * blip.distance;
          const x = C + Math.sin(a) * r;
          const y = C - Math.cos(a) * r;
          const delay = (blip.angle / 360) * sweepSeconds;
          return (
            <g key={blip.label}>
              <motion.circle
                cx={x}
                cy={y}
                r={7}
                fill="#e8c468"
                filter="url(#radar-glow)"
                initial={false}
                animate={reduce ? { opacity: 0.5 } : { opacity: [0, 0.9, 0.15, 0] }}
                transition={{ duration: sweepSeconds, times: [0, 0.03, 0.6, 1], repeat: Infinity, delay, ease: "easeOut" }}
              />
              <circle cx={x} cy={y} r={2.5} fill="#fff7e0" />
            </g>
          );
        })}

        <circle cx={C} cy={C} r={4} fill="#34d399" />
      </svg>
    </div>
  );
}
