"use client";

import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { type Quest } from "@/lib/demeter/schemas";
import { QuestCard } from "./QuestCard";

interface QuestCarouselProps {
  quests: Quest[];
  /** Encabezado de la sección — se renderiza dentro del área anclada. */
  heading: ReactNode;
}

/* ─── Detección de modo ──────────────────────────────────────────────── */

const PINNED_QUERY = "(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(PINNED_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

/** `true` = desktop con mouse y sin reduced-motion → scroll horizontal anclado. */
function usePinnedMode() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PINNED_QUERY).matches,
    () => false
  );
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/* ─── Geometría compartida ───────────────────────────────────────────── */

interface Geometry {
  /** Padding lateral que deja la primera/última carta centradas. */
  pad: number;
  /** Distancia entre centros de cartas consecutivas (ancho + gap). */
  step: number;
}

function measure(viewport: HTMLElement | null, track: HTMLElement | null): Geometry | null {
  if (!viewport || !track) return null;
  const cards = track.querySelectorAll<HTMLElement>("[data-quest-card]");
  if (cards.length === 0) return null;
  const cardW = cards[0].offsetWidth;
  const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : cardW;
  return { pad: Math.max(16, (viewport.clientWidth - cardW) / 2), step };
}

/* ─── Controles / indicador ──────────────────────────────────────────── */

function CarouselHud({
  active,
  total,
  onPrev,
  onNext,
}: {
  active: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const buttonClass =
    "flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-obsidian/60 text-parchment backdrop-blur-md transition-colors hover:border-gold-glow/60 hover:text-gold-glow disabled:pointer-events-none disabled:opacity-30";
  return (
    <div className="mx-auto mt-8 flex w-full max-w-6xl items-center gap-6 px-4 sm:px-8">
      <p className="shrink-0 font-display text-sm tabular-nums text-parchment" aria-live="polite">
        <span className="sr-only">Quest </span>
        {String(active + 1).padStart(2, "0")}
        <span className="mx-2 text-parchment-muted">/</span>
        <span className="text-parchment-muted">{String(total).padStart(2, "0")}</span>
      </p>
      <div aria-hidden className="relative h-px flex-1 bg-white/10">
        <motion.span
          className="absolute inset-y-0 left-0 w-full origin-left bg-gold-glow"
          animate={{ scaleX: total > 1 ? (active + 1) / total : 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <div className="flex shrink-0 gap-2">
        <button type="button" className={buttonClass} onClick={onPrev} disabled={active === 0} aria-label="Quest anterior">
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={onNext}
          disabled={active >= total - 1}
          aria-label="Quest siguiente"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

/* ─── Modo anclado (desktop) ─────────────────────────────────────────── */

/**
 * El scroll vertical de la página mueve el track en X mientras la sección
 * queda "sticky". La altura del contenedor externo se calcula para que
 * 1px de scroll = 1px de desplazamiento horizontal, así el arrastre con
 * mouse y la rueda se sienten idénticos.
 *
 * Magnetismo: 140ms después de que el scroll se detiene, la página se
 * desliza (smooth) hasta el punto exacto en que la carta más cercana
 * queda centrada. La carta centrada se revela sola (`active`).
 */
function PinnedCarousel({ quests, heading }: QuestCarouselProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geometry | null>(null);
  const [viewportH, setViewportH] = useState(0);
  const [active, setActive] = useState(0);
  const count = quests.length;
  const maxShift = geo ? geo.step * Math.max(count - 1, 0) : 0;

  useIsoLayoutEffect(() => {
    const update = () => {
      setGeo(measure(viewportRef.current, trackRef.current));
      setViewportH(window.innerHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    if (viewportRef.current) ro.observe(viewportRef.current);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [count]);

  const { scrollYProgress } = useScroll({ target: outerRef, offset: ["start start", "end end"] });
  const rawX = useTransform(scrollYProgress, (p) => -p * maxShift);
  const x = useSpring(rawX, { stiffness: 140, damping: 30, mass: 0.35 });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = Math.round(p * Math.max(count - 1, 0));
    setActive((prev) => (prev === next ? prev : next));
  });

  /** scrollY absoluto en el que la carta `i` queda centrada. */
  const scrollYFor = useCallback(
    (i: number) => {
      const outer = outerRef.current;
      if (!outer || count < 2) return null;
      const top = outer.getBoundingClientRect().top + window.scrollY;
      return top + (i / (count - 1)) * maxShift;
    },
    [count, maxShift]
  );

  const goTo = useCallback(
    (i: number, behavior: ScrollBehavior = "smooth") => {
      const clamped = Math.min(Math.max(i, 0), count - 1);
      const y = scrollYFor(clamped);
      if (y != null) window.scrollTo({ top: y, behavior });
    },
    [count, scrollYFor]
  );

  // ── Magnetismo al detener el scroll ──
  const dragging = useRef(false);
  useEffect(() => {
    if (count < 2 || maxShift === 0) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (dragging.current) return;
        const p = scrollYProgress.get();
        if (p <= 0 || p >= 1) return; // fuera del tramo anclado: no secuestrar el scroll
        const nearest = Math.round(p * (count - 1));
        const y = scrollYFor(nearest);
        if (y != null && Math.abs(window.scrollY - y) > 2) window.scrollTo({ top: y, behavior: "smooth" });
      }, 140);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [count, maxShift, scrollYFor, scrollYProgress]);

  // ── Arrastre con mouse (1px de arrastre = 1px de scroll) ──
  const drag = useRef({ startX: 0, startY: 0, startIndex: 0, moved: false });
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    dragging.current = true;
    drag.current = { startX: e.clientX, startY: window.scrollY, startIndex: active, moved: false };
    // La captura se toma recién cuando hay arrastre real: capturar en el
    // pointerdown redirige el `click` al track y rompe los links de las cartas.
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - drag.current.startX;
    if (!drag.current.moved && Math.abs(dx) > 6) {
      drag.current.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (drag.current.moved) window.scrollTo({ top: drag.current.startY - dx * 1.2, behavior: "instant" });
  };
  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (drag.current.moved) {
      // Un "flick" (>60px) siempre avanza al menos una carta en esa dirección; luego imán.
      const dx = e.clientX - drag.current.startX;
      const nearest = Math.round(scrollYProgress.get() * (count - 1));
      const flick = Math.abs(dx) > 60 && nearest === drag.current.startIndex;
      const target = flick ? nearest - Math.sign(dx) : nearest;
      goTo(target);
    }
  };

  return (
    <div ref={outerRef} className="relative" style={{ height: geo ? maxShift + viewportH : "100vh" }}>
      <div className="sticky top-0 flex h-screen flex-col justify-start overflow-hidden pt-20">
        <div className="mx-auto w-full max-w-6xl px-8 [&_h2]:text-4xl [&>div]:mb-6">{heading}</div>

        <div ref={viewportRef} className="relative w-full">
          <motion.div
            ref={trackRef}
            role="list"
            aria-label="Quests"
            style={{ x, paddingInline: geo?.pad ?? 16 }}
            className="flex cursor-grab items-start gap-6 select-none active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClickCapture={(e) => {
              // Un arrastre no debe terminar navegando al caso de estudio.
              if (drag.current.moved) {
                e.preventDefault();
                e.stopPropagation();
                drag.current.moved = false;
              }
            }}
          >
            {quests.map((quest, index) => (
              <div role="listitem" key={quest.id} className="contents">
                <QuestCard
                  quest={quest}
                  index={index}
                  active={index === active}
                  onRequestFocus={() => index !== active && goTo(index, "instant")}
                />
              </div>
            ))}
          </motion.div>
        </div>

        <div className="mt-auto pb-6">
          <CarouselHud active={active} total={count} onPrev={() => goTo(active - 1)} onNext={() => goTo(active + 1)} />
        </div>
      </div>
    </div>
  );
}

/* ─── Modo nativo (touch / mobile / reduced-motion) ─────────────────── */

/**
 * Carrusel con `scroll-snap-type: x mandatory` + `snap-center`: el imán
 * lo resuelve el navegador (inercia nativa en iOS/Android, sin JS en el
 * loop). La carta centrada se revela igual que en desktop.
 */
function NativeCarousel({ quests, heading }: QuestCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [pad, setPad] = useState(16);
  const [active, setActive] = useState(0);
  const count = quests.length;

  useIsoLayoutEffect(() => {
    const update = () => {
      const g = measure(scrollerRef.current, scrollerRef.current);
      if (g) setPad(g.pad);
    };
    update();
    const ro = new ResizeObserver(update);
    if (scrollerRef.current) ro.observe(scrollerRef.current);
    return () => ro.disconnect();
  }, [count]);

  const cardCenter = (i: number) => {
    const el = scrollerRef.current?.querySelectorAll<HTMLElement>("[data-quest-card]")[i];
    const scroller = scrollerRef.current;
    if (!el || !scroller) return 0;
    return el.offsetLeft + el.offsetWidth / 2 - scroller.clientWidth / 2;
  };

  const onScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < count; i++) {
      const d = Math.abs(cardCenter(i) - scroller.scrollLeft);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    setActive((prev) => (prev === best ? prev : best));
  };

  const goTo = (i: number) => {
    const clamped = Math.min(Math.max(i, 0), count - 1);
    scrollerRef.current?.scrollTo({ left: cardCenter(clamped), behavior: "smooth" });
  };

  return (
    <div className="py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">{heading}</div>
      <div
        ref={scrollerRef}
        role="list"
        aria-label="Quests"
        onScroll={onScroll}
        style={{ paddingInline: pad, scrollPaddingInline: pad }}
        className="flex snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-6 [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden"
      >
        {quests.map((quest, index) => (
          <div role="listitem" key={quest.id} className="contents">
            <QuestCard quest={quest} index={index} active={index === active} className="snap-center" />
          </div>
        ))}
      </div>
      <CarouselHud active={active} total={count} onPrev={() => goTo(active - 1)} onNext={() => goTo(active + 1)} />
    </div>
  );
}

/**
 * QuestCarousel — Hefesto, Iteración 20 ("Motion Design de Élite",
 * referencia: video). Elige el modo en cliente:
 *   - Desktop + mouse → scroll horizontal anclado con imán y arrastre.
 *   - Touch / pantallas chicas / `prefers-reduced-motion` → carrusel
 *     nativo con scroll-snap (sin secuestrar el scroll vertical).
 * El SSR siempre pinta el modo nativo (contenido indexable y usable sin JS).
 */
export function QuestCarousel(props: QuestCarouselProps) {
  const pinned = usePinnedMode();
  const reduce = useReducedMotion();
  return pinned && !reduce ? <PinnedCarousel {...props} /> : <NativeCarousel {...props} />;
}
