"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { useAchievementsStore } from "@/lib/minerva/achievements-store";
import { useKonamiCode } from "@/lib/minerva/use-konami-code";

const SPARKS = 46;
const DURATION_MS = 4200;
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Semilla determinista: mismas posiciones en servidor y cliente (sin `Math.random` en render). */
function buildSparks(seed: number) {
  let value = seed;
  const next = () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
  return Array.from({ length: SPARKS }, (_, i) => {
    const r = next();
    return {
      id: i,
      left: `${(next() * 100).toFixed(2)}%`,
      size: 2 + Math.round(r * 5),
      delay: next() * 1.6,
      duration: 2.2 + next() * 1.8,
      drift: (next() - 0.5) * 120,
      gold: next() > 0.45,
      spin: (next() - 0.5) * 240,
    };
  });
}

/**
 * KonamiSecret — Hefesto + Minerva, Iteración 26 ("El Secreto de la Forja").
 *
 * Monta el listener del Código Konami (`useKonamiCode`) y, al completarlo:
 *  1. desbloquea el logro oculto `ancient-knowledge` — el store ya dispara
 *     el Toast y registra `achievement_unlocked` en `telemetry_events`
 *     (Iteración 25), así que no hay que trackear nada extra acá;
 *  2. lanza una lluvia de chispas esmeralda/doradas con un destello
 *     inicial, durante ~4s, y se desmonta sola.
 *
 * Accesibilidad: la lluvia es `aria-hidden` + `pointer-events-none` (nunca
 * bloquea clicks); el anuncio real al lector de pantalla lo hace el Toast
 * de logros. Con `prefers-reduced-motion` no hay lluvia ni destello: sólo
 * un halo dorado que aparece y se va suavemente.
 *
 * Se monta una sola vez, en `SiteChrome` (rutas públicas). En `/admin` no
 * existe: el CMS no es lugar para huevos de pascua.
 */
export function KonamiSecret() {
  const reduce = useReducedMotion();
  const unlock = useAchievementsStore((state) => state.unlock);
  const [burst, setBurst] = useState<number | null>(null);

  const handleUnlock = useCallback(() => {
    // `unlock` es idempotente: si ya lo tenía, no re-encola el Toast — pero
    // la lluvia sí se vuelve a lanzar (es la recompensa visual del truco).
    unlock("ancient-knowledge");
    const id = Date.now();
    setBurst(id);
    setTimeout(() => setBurst((current) => (current === id ? null : current)), DURATION_MS);
  }, [unlock]);

  useKonamiCode(handleUnlock);

  const sparks = useMemo(() => buildSparks(20260918), []);

  return (
    <AnimatePresence>
      {burst !== null && (
        <motion.div
          key={burst}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[120] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Destello inicial */}
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(232,196,104,0.35),transparent_60%)]"
            initial={{ opacity: reduce ? 0.25 : 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: reduce ? 1.2 : 1.6, ease: EASE_OUT_EXPO }}
          />
          {/* Runa de borde: el marco de la pantalla se enciende un instante */}
          <motion.div
            className="absolute inset-0 shadow-[inset_0_0_120px_20px_rgba(52,211,153,0.35)]"
            initial={{ opacity: reduce ? 0.2 : 0.9 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 2, ease: EASE_OUT_EXPO }}
          />

          {!reduce &&
            sparks.map((spark) => (
              <motion.span
                key={spark.id}
                className="absolute top-0 rounded-full"
                style={{
                  left: spark.left,
                  width: spark.size,
                  height: spark.size * 3,
                  background: spark.gold
                    ? "linear-gradient(to bottom, rgba(232,196,104,0), #e8c468)"
                    : "linear-gradient(to bottom, rgba(52,211,153,0), #34d399)",
                  boxShadow: spark.gold
                    ? "0 0 12px 2px rgba(232,196,104,0.55)"
                    : "0 0 12px 2px rgba(52,211,153,0.55)",
                }}
                initial={{ y: "-10vh", x: 0, opacity: 0, rotate: 0 }}
                animate={{ y: "110vh", x: spark.drift, opacity: [0, 1, 1, 0], rotate: spark.spin }}
                transition={{ duration: spark.duration, delay: spark.delay, ease: "easeIn" }}
              />
            ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
