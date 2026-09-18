"use client";

import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { type SkillNode } from "@/lib/demeter/schemas";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

interface SkillTreeTimelineProps {
  nodes: SkillNode[];
}

/** X del eje dentro del SVG (px). Debe coincidir con `RAIL_W / 2` en el layout. */
const RAIL_X = 20;
const RAIL_W = 40;
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * Trazado del árbol: un eje vertical con una leve ondulación entre nodos
 * (curvas cúbicas que "respiran" ±6px) — se lee como una rama, no como un
 * borde. Pasa exactamente por el centro de cada nodo (`ys`).
 */
function buildPath(ys: number[], height: number) {
  if (ys.length === 0) return `M ${RAIL_X} 0 L ${RAIL_X} ${height}`;
  let d = `M ${RAIL_X} 0 L ${RAIL_X} ${ys[0]}`;
  for (let i = 0; i < ys.length - 1; i++) {
    const a = ys[i];
    const b = ys[i + 1];
    const mid = (b - a) / 3;
    const sway = i % 2 === 0 ? 6 : -6;
    d += ` C ${RAIL_X + sway} ${a + mid}, ${RAIL_X - sway} ${b - mid}, ${RAIL_X} ${b}`;
  }
  d += ` L ${RAIL_X} ${height}`;
  return d;
}

/**
 * SkillTreeTimeline — Hefesto, Iteración 21 ("Skill Tree Premium").
 * El eje es un `<path>` SVG cuyo `pathLength` sigue el scroll
 * (`useScroll` sobre la lista → `useSpring`): la rama se va DIBUJANDO e
 * iluminando mientras el visitante baja. Capas:
 *   1. trazo base tenue (el camino completo, apagado);
 *   2. trazo luminoso con degradado esmeralda→dorado (pathLength);
 *   3. el mismo trazo desenfocado detrás = glow;
 *   4. una "chispa" en la punta que baja con el progreso.
 * Cada nodo se "desbloquea" (anillo encendido + conector + carta a
 * opacidad plena) cuando la punta de la rama lo alcanza.
 *
 * reduced-motion: rama completa dibujada y todos los nodos encendidos.
 */
export function SkillTreeTimeline({ nodes }: SkillTreeTimelineProps) {
  const reduce = useReducedMotion();
  const { t } = useTranslation();
  const listRef = useRef<HTMLOListElement>(null);
  const [geom, setGeom] = useState<{ height: number; ys: number[] }>({ height: 0, ys: [] });
  const [litCount, setLitCount] = useState(0);

  // Medición: alto total + centro vertical de cada nodo (el punto del eje).
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const update = () => {
      const dots = Array.from(list.querySelectorAll<HTMLElement>("[data-skill-dot]"));
      setGeom({
        height: list.offsetHeight,
        ys: dots.map((dot) => {
          const li = dot.closest("li") as HTMLElement;
          return li.offsetTop + dot.offsetTop + dot.offsetHeight / 2;
        }),
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(list);
    return () => ro.disconnect();
  }, [nodes.length]);

  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 75%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.3 });
  const sparkY = useTransform(progress, (p) => p * geom.height);
  const sparkOpacity = useTransform(progress, [0, 0.02, 0.98, 1], [0, 1, 1, 0]);

  useMotionValueEvent(progress, "change", (p) => {
    if (geom.height === 0) return;
    const tip = p * geom.height;
    const count = geom.ys.filter((y) => y <= tip + 4).length;
    setLitCount((prev) => (prev === count ? prev : count));
  });

  const d = buildPath(geom.ys, geom.height);
  const lit = (index: number) => reduce || index < litCount;
  const gradientId = "skill-tree-gradient";
  const glowId = "skill-tree-glow";

  return (
    <div className="relative">
      {geom.height > 0 && (
        <svg
          aria-hidden
          width={RAIL_W}
          height={geom.height}
          viewBox={`0 0 ${RAIL_W} ${geom.height}`}
          className="pointer-events-none absolute left-0 top-0 overflow-visible print:hidden"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2={geom.height} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="60%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#e8c468" />
            </linearGradient>
            <filter id={glowId} x="-200%" y="-5%" width="500%" height="110%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>

          {/* 1. camino apagado */}
          <path d={d} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2} strokeDasharray="2 6" strokeLinecap="round" />

          {/* 3. glow */}
          <motion.path
            d={d}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={6}
            strokeLinecap="round"
            filter={`url(#${glowId})`}
            opacity={0.6}
            style={{ pathLength: reduce ? 1 : progress }}
          />
          {/* 2. trazo luminoso */}
          <motion.path
            d={d}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={2}
            strokeLinecap="round"
            style={{ pathLength: reduce ? 1 : progress }}
          />

          {/* 4. chispa en la punta (la X exacta varía ±6px por la ondulación; se queda en el eje) */}
          {!reduce && (
            <motion.g style={{ y: sparkY, opacity: sparkOpacity }}>
              <circle cx={RAIL_X} cy={0} r={9} fill="#e8c468" opacity={0.25} filter={`url(#${glowId})`} />
              <circle cx={RAIL_X} cy={0} r={2.5} fill="#fff7e0" />
            </motion.g>
          )}
        </svg>
      )}

      <ol ref={listRef} className="relative space-y-10 sm:space-y-14">
        {nodes.map((node, index) => {
          const on = lit(index);
          return (
            <li key={node.id} className="relative grid grid-cols-[40px_1fr] gap-4 sm:gap-6">
              {/* Nodo del árbol */}
              <div className="relative flex justify-center pt-6">
                <span
                  data-skill-dot
                  className={cn(
                    "relative z-10 flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-700",
                    on
                      ? "border-emerald-glow bg-obsidian shadow-[0_0_0_4px_rgba(52,211,153,0.12),0_0_18px_4px_rgba(52,211,153,0.45)]"
                      : "border-white/15 bg-obsidian"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-colors duration-700",
                      on ? "bg-emerald-glow" : "bg-white/15"
                    )}
                  />
                </span>
                {/* Conector nodo → carta */}
                <motion.span
                  aria-hidden
                  className="absolute left-[calc(50%+10px)] top-[calc(1.5rem+9px)] h-px w-[calc(50%+0.5rem)] origin-left bg-gradient-to-r from-emerald-glow/70 to-transparent sm:w-[calc(50%+1rem)]"
                  initial={false}
                  animate={{ scaleX: on ? 1 : 0 }}
                  transition={{ duration: reduce ? 0 : 0.6, ease: EASE_OUT_EXPO }}
                />
              </div>

              {/* Carta del nodo */}
              <motion.article
                initial={false}
                animate={
                  reduce
                    ? { opacity: 1 }
                    : { opacity: on ? 1 : 0.35, x: on ? 0 : 12, filter: on ? "blur(0px)" : "blur(1.5px)" }
                }
                transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
                className={cn(
                  "relative overflow-hidden rounded-2xl border bg-obsidian-soft/60 p-5 backdrop-blur-md transition-colors duration-700 sm:p-6",
                  on ? "border-emerald-glow/25" : "border-white/10"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-emerald-glow/10 blur-3xl transition-opacity duration-700",
                    on ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="relative flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-glow/90">
                    {t.skillTree.nodePrefix(String(index + 1).padStart(2, "0"))}
                    {node.unlocked === false && t.skillTree.lockedSuffix}
                  </p>
                  {node.period && <span className="text-xs tabular-nums text-parchment-muted">{node.period}</span>}
                </div>
                <h3 className="relative mt-2 font-display text-xl text-parchment sm:text-2xl">{node.label}</h3>
                <p className="relative mt-2 leading-relaxed text-parchment/65">{node.description}</p>

                {node.achievements && node.achievements.length > 0 && (
                  <ul className="relative mt-5 space-y-2 border-t border-white/10 pt-4">
                    {node.achievements.map((achievement, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed text-parchment/65">
                        <span
                          aria-hidden
                          className="mt-0.5 self-start shrink-0 rounded border border-emerald-glow/30 bg-emerald-glow/10 px-1.5 text-[0.6rem] font-semibold leading-5 text-emerald-glow"
                        >
                          {t.skillTree.xpBadge}
                        </span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
