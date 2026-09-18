import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { RevealText } from "./RevealText";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  className?: string;
  children?: ReactNode;
  /** Numeración editorial opcional ("01", "02"…) — referencia: video de la Iteración 19. */
  index?: string;
}

/**
 * SectionHeading — encabezado de sección temático. Hefesto / MASTER.md.
 * Iteración 19: el título entra con `RevealText` (palabras deslizando
 * desde abajo, en cascada, al entrar en viewport). El degradado con
 * `bg-clip-text` se reemplazó por color sólido + glow: los `transform`
 * por palabra rompen el recorte del fondo en el padre.
 */
export function SectionHeading({ eyebrow, title, className, children, index }: SectionHeadingProps) {
  return (
    <div className={cn("mb-10 sm:mb-14", className)}>
      {(eyebrow || index) && (
        <p className="mb-3 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-gold-glow">
          {index && <span className="tabular-nums text-parchment-muted">{index}</span>}
          {index && <span aria-hidden className="h-px w-8 bg-gold-glow/40" />}
          {eyebrow}
        </p>
      )}
      <RevealText
        as="h2"
        trigger="inView"
        text={title}
        className="font-display text-4xl font-semibold leading-[1.05] text-parchment [text-shadow:0_2px_24px_rgba(232,196,104,0.16)] sm:text-5xl lg:text-6xl"
      />
      {children}
    </div>
  );
}
