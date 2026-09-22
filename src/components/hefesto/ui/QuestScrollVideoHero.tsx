"use client";

import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowLeft, ChevronDown, SkipForward } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "./Badge";
import { RevealText } from "./RevealText";

interface QuestScrollVideoHeroProps {
  /** URL directa (MP4/WebM) — `quest.heroVideoUrl`. */
  videoUrl: string;
  /** Poster mientras el video descarga — normalmente la portada (`quest.media.src`) si es imagen. */
  posterUrl?: string;
  title: string;
  role: string;
  summary: string;
  tech: string[];
  accentColor: string;
  /** Gradiente de respaldo (`quest.imagePlaceholder`) — se ve detrás del video mientras no hay frame. */
  placeholder: { from: string; to: string };
  /** `id` del bloque que sigue al video (los capítulos) — destino de "Saltar intro". */
  nextSectionId: string;
  labels: {
    backToQuests: string;
    scrollHint: string;
    skipIntro: string;
  };
}

/** Tramo del scroll (0–1) en el que los textos de la Fase 1 se desvanecen. */
const TEXT_FADE_END = 0.12;

/**
 * QuestScrollVideoHero — Iteración 39 (Deméter/Éter/Hefesto,
 * "Scroll-Bound Video"). Cabecera tipo "página de producto de Apple":
 * el scroll NO hace avanzar la página sobre el video, hace avanzar EL
 * VIDEO — cada pixel de scroll es un frame.
 *
 * Arquitectura (4 fases):
 *  1. Carga — `<section>` alto (`h-[300vh]` mobile / `h-[400vh]` desktop)
 *     con un hijo `sticky top-0 h-svh`: mientras la sección "pasa", el
 *     viewport queda clavado mostrando el video a pantalla completa con
 *     título/rol/resumen/tech superpuestos (scrim oscuro para contraste
 *     ≥ 4.5:1 sobre cualquier frame).
 *  2. Scroll inicial — de 0 a `TEXT_FADE_END` del progreso, los textos
 *     hacen fade-out + `y: 0 → -50px` y el scrim se aclara.
 *  3. Scrubbing — `useScroll({ target })` da el progreso 0→1 de ESTA
 *     sección; `useSpring` lo suaviza (sin esto la rueda del mouse avanza
 *     "a saltos" de ~100px). Cada cambio del spring agenda UN
 *     `requestAnimationFrame` que escribe `video.currentTime = p × duration`.
 *     Nunca se escribe mientras `video.seeking` (el decoder todavía no
 *     terminó el seek anterior → pedirle otro sólo encola trabajo y da
 *     tirones); el evento `seeked` re-agenda para alcanzar el último
 *     valor pedido.
 *  4. Salida — en el último 15% un velo `obsidian` sube a opacidad 1, así
 *     el final del sticky se funde sin costura con los capítulos en
 *     zig-zag que siguen en el flujo normal de la página.
 *
 * Rendimiento: el video se descarga completo como Blob (`fetch` →
 * `URL.createObjectURL`) antes de asignarse al `<video>`. Con un Blob
 * local el seek es instantáneo; con la URL remota cada seek puede
 * disparar un range-request HTTP nuevo (tirones visibles). Si el `fetch`
 * falla (CORS, red), cae a la URL directa — funciona igual, sólo que
 * menos fluido. Mientras tanto se ve el poster o el gradiente de respaldo.
 *
 * Accesibilidad (CRITICAL):
 *  - `prefers-reduced-motion`: sin scrubbing, sin fade de textos, y la
 *    sección se reduce a una sola pantalla (`motion-reduce:h-svh`) — el
 *    video queda como imagen fija (primer frame / poster).
 *  - El `<video>` es decorativo (`aria-hidden`, fuera del orden de tab):
 *    todo el contenido real está en el texto.
 *  - "Saltar intro" (link visible, con focus ring) lleva directo a los
 *    capítulos — nadie queda obligado a scrollear 3–4 pantallas.
 */
export function QuestScrollVideoHero({
  videoUrl,
  posterUrl,
  title,
  role,
  summary,
  tech,
  accentColor,
  placeholder,
  nextSectionId,
  labels,
}: QuestScrollVideoHeroProps) {
  const trackRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const reduce = useReducedMotion();
  // `null` = todavía descargando → el <video> no tiene src y se ve el poster/gradiente.
  const [blobSrc, setBlobSrc] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 160,
    damping: 32,
    mass: 0.4,
    restDelta: 0.0005,
  });

  // ── Iteración 41 (Hefesto — fix "los textos vuelven a aparecer") ──────
  // Causa real: NO era el `clamp` (en Framer Motion 13 `useTransform`
  // clampea por defecto — `interpolate(..., { clamp = true })` en
  // motion-dom). Era la ACELERACIÓN POR HARDWARE: cuando la entrada es un
  // `useScroll()` y la propiedad es `opacity` (también `transform`,
  // `filter`, `clipPath`, `backgroundColor`), Framer no anima por JS: arma
  // una animación WAAPI nativa ligada a un ScrollTimeline con
  // `times = inputRange` y `keyframes = outputRange` (ver `use-transform.mjs`
  // → `result.accelerate`, y `VisualElement.mjs` → `new NativeAnimation`).
  // Si el rango de entrada NO cubre 0→1 completo (acá era `[0, 0.12]`),
  // el navegador completa el keyframe faltante en el offset 1 con el
  // valor BASE del elemento (opacity: 1) — así que después del 12% la
  // opacidad volvía a subir linealmente hasta 1 al final del scroll.
  //
  // Fix: todo rango cubre SIEMPRE el recorrido completo [0 … 1], con el
  // valor final repetido explícitamente (`[0, 0.12, 1] → [1, 0, 0]`).
  // Es correcto tanto en el camino JS (clamp) como en el acelerado (WAAPI).
  const textOpacity = useTransform(scrollYProgress, [0, TEXT_FADE_END, 1], [1, 0, 0]);
  const textY = useTransform(scrollYProgress, [0, TEXT_FADE_END, 1], [0, -50, -50]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.04, 1], [1, 0, 0]);
  const scrimOpacity = useTransform(scrollYProgress, [0, TEXT_FADE_END + 0.03, 1], [0.7, 0.15, 0.15]);
  // Fase 3 — barra de progreso (aparece cuando los textos ya se fueron)
  const barOpacity = useTransform(
    scrollYProgress,
    [0, TEXT_FADE_END - 0.02, TEXT_FADE_END + 0.04, 1],
    [0, 0, 1, 1]
  );
  // Fase 4 — velo de salida hacia los capítulos (mismo bug en espejo: sin
  // el keyframe en 0, WAAPI arrancaba el velo en opacidad 1).
  const exitOpacity = useTransform(scrollYProgress, [0, 0.85, 1], [0, 0, 1]);

  // Cinturón y tirantes: una vez desvanecidos, los textos quedan `inert`
  // (fuera del foco de teclado y de los clics — el link "Volver" ya no
  // es alcanzable invisible) y con `visibility: hidden`, que ninguna
  // animación de opacidad puede revertir. Sólo cambia de estado al cruzar
  // el umbral, no en cada frame.
  const [textGone, setTextGone] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const gone = progress >= TEXT_FADE_END;
    setTextGone((current) => (current === gone ? current : gone));
  });

  // ── Descarga como Blob (seek instantáneo) ──────────────────────────────
  useEffect(() => {
    if (reduce) return;
    const controller = new AbortController();
    let objectUrl: string | null = null;

    fetch(videoUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setBlobSrc(objectUrl);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.warn("[QuestScrollVideoHero] fetch del video falló, se usa la URL directa.", error);
        setBlobSrc(videoUrl);
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [videoUrl, reduce]);

  // ── Scrubbing: progreso → currentTime ──────────────────────────────────
  const applyFrame = useCallback(() => {
    rafRef.current = null;
    const video = videoRef.current;
    if (!video) return;
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0 || video.readyState < 1) return;
    if (video.seeking) return; // `seeked` vuelve a agendar

    // `- 0.05`: el último frame exacto a veces decodifica en negro en Safari.
    const target = Math.min(Math.max(smoothProgress.get() * duration, 0), duration - 0.05);
    if (Math.abs(video.currentTime - target) > 1 / 90) {
      video.currentTime = target;
    }
  }, [smoothProgress]);

  const scheduleFrame = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(applyFrame);
  }, [applyFrame]);

  useMotionValueEvent(smoothProgress, "change", () => {
    if (!reduce) scheduleFrame();
  });

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function handleLoadedData() {
    const video = videoRef.current;
    if (!video) return;
    // React no refleja `muted` como atributo en SSR — forzarlo evita que
    // Safari iOS bloquee el "priming" de abajo.
    video.muted = true;
    // Safari iOS no pinta frames al hacer seek hasta que el video se
    // reprodujo al menos una vez: play()+pause() inmediato lo "despierta".
    video
      .play()
      .then(() => video.pause())
      .catch(() => {})
      .finally(() => {
        setIsReady(true);
        if (!reduce) scheduleFrame(); // si el visitante recargó a mitad de la sección
      });
  }

  const videoSrc = reduce ? videoUrl : blobSrc ?? undefined;
  const scroll = (value: typeof textOpacity) => (reduce ? undefined : value);

  return (
    <section
      ref={trackRef}
      aria-label={title}
      className="relative h-[300vh] lg:h-[400vh] motion-reduce:h-svh motion-reduce:lg:h-svh"
    >
      <div
        className="sticky top-0 h-svh w-full overflow-hidden"
        style={{ backgroundImage: `linear-gradient(135deg, ${placeholder.from}, ${placeholder.to})` }}
      >
        {/* Poster propio (no el atributo `poster`): se ve también mientras no hay `src`. */}
        {posterUrl && (
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
            style={{ backgroundImage: `url("${posterUrl}")`, opacity: isReady ? 0 : 1 }}
          />
        )}

        <video
          ref={videoRef}
          src={videoSrc}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-hidden
          tabIndex={-1}
          onLoadedData={handleLoadedData}
          onSeeked={scheduleFrame}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
          style={{ opacity: isReady ? 1 : 0 }}
        />

        {/* Scrims de legibilidad (contraste AA sobre cualquier frame) */}
        <motion.div aria-hidden className="absolute inset-0 bg-obsidian" style={{ opacity: reduce ? 0.6 : scrimOpacity }} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/30 to-transparent" />

        {/* Fase 1 → 2: título, rol, resumen */}
        <motion.div
          style={{ opacity: scroll(textOpacity), y: scroll(textY) }}
          inert={!reduce && textGone}
          className={`${!reduce && textGone ? "invisible " : ""}relative z-10 mx-auto flex h-full w-full max-w-5xl flex-col justify-end px-4 pb-24 pt-32 sm:px-8 sm:pb-28`}
        >
          <Link
            href="/#quests"
            className="mb-8 inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-parchment-muted transition-colors duration-150 hover:text-parchment"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {labels.backToQuests}
          </Link>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accentColor }}>
            {role}
          </p>
          <RevealText
            as="h1"
            text={title}
            delay={0.2}
            className="text-balance break-words font-display text-4xl leading-[1.05] text-parchment sm:text-6xl lg:text-7xl"
          />
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-parchment/85 sm:text-lg">{summary}</p>

          {tech.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {tech.map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
            </div>
          )}
        </motion.div>

        {/* Indicador "deslizá" — sólo en la Fase 1.
            Los 4 elementos de abajo se ocultan con `motion-reduce:hidden`
            (CSS) en vez de `{!reduce && …}`: así el HTML del servidor y el
            primer render del cliente coinciden (sin hydration mismatch). */}
        <motion.div
          aria-hidden
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex motion-reduce:hidden flex-col items-center gap-1 text-xs uppercase tracking-[0.18em] text-parchment-muted"
        >
          {labels.scrollHint}
          <motion.span
            animate={reduce ? undefined : { y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </motion.div>

        {/* Saltar intro — accesible por teclado durante todo el sticky */}
        <a
          href={`#${nextSectionId}`}
          className="absolute motion-reduce:hidden bottom-6 right-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-obsidian/60 px-3.5 py-1.5 text-xs font-medium text-parchment-muted backdrop-blur transition-colors duration-150 hover:border-gold-glow/50 hover:text-parchment sm:right-8"
        >
          {labels.skipIntro}
          <SkipForward className="h-3.5 w-3.5" aria-hidden />
        </a>

        {/* Fase 3 — progreso del video */}
        <motion.div
          aria-hidden
          style={{ opacity: barOpacity }}
          className="absolute motion-reduce:hidden inset-x-0 bottom-0 z-10 h-0.5 bg-white/10"
        >
          <motion.div
            className="h-full origin-left"
            style={{ scaleX: smoothProgress, backgroundColor: accentColor }}
          />
        </motion.div>

        {/* Fase 4 — fundido hacia los capítulos */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5] bg-obsidian motion-reduce:hidden"
          style={{ opacity: exitOpacity }}
        />
      </div>
    </section>
  );
}
