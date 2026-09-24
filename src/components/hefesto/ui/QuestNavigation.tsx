import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Quest } from "@/lib/demeter/schemas";
import type { AdjacentQuests } from "@/lib/demeter/queries/quests";
import { cn } from "@/lib/utils";

interface QuestNavigationProps extends AdjacentQuests {
  labels: {
    ariaLabel: string;
    previous: string;
    next: string;
  };
}

/**
 * QuestNavigation — Hefesto, Iteración 42 ("Retención al pie del caso de
 * estudio"). Dos tarjetas grandes (Anterior / Siguiente) con la portada
 * de la Quest atenuada de fondo, para que el visitante siga recorriendo
 * el portafolio sin volver a la home.
 *
 * Server Component puro (sin "use client"): sólo `Link` + CSS, cero JS
 * extra en el bundle. Los datos vienen de `getAdjacentQuests()`
 * (Deméter) vía `getAdjacentQuestsForView()` (Minerva).
 *
 * Accesibilidad: `<nav>` con `aria-label`; cada tarjeta es UN solo
 * `<Link>` (un único tab stop) cuyo nombre accesible es "Quest anterior:
 * <título>"; la imagen de fondo es decorativa (`alt=""`); el texto va
 * siempre sobre un degradado obsidiana sólido (contraste ≥ 4.5:1 aunque
 * la portada sea clara); el foco usa el `:focus-visible` global del sitio.
 */
export function QuestNavigation({ previous, next, labels }: QuestNavigationProps) {
  if (!previous && !next) return null;

  return (
    <nav aria-label={labels.ariaLabel} className="mx-auto max-w-5xl px-4 pb-20 sm:px-8 sm:pb-24">
      <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" aria-hidden />
      <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        {previous && (
          <li>
            <QuestNavCard quest={previous} direction="previous" label={labels.previous} />
          </li>
        )}
        {next && (
          // Si sólo hay "siguiente", se queda en la columna derecha (sm:col-start-2)
          // para respetar la convención espacial ← anterior / siguiente →.
          <li className={cn(!previous && "sm:col-start-2")}>
            <QuestNavCard quest={next} direction="next" label={labels.next} />
          </li>
        )}
      </ul>
    </nav>
  );
}

function coverSrc(quest: Quest): string | undefined {
  if (!quest.media) return undefined;
  return quest.media.type === "image" ? quest.media.src : quest.media.poster;
}

interface QuestNavCardProps {
  quest: Quest;
  direction: "previous" | "next";
  label: string;
}

function QuestNavCard({ quest, direction, label }: QuestNavCardProps) {
  const isNext = direction === "next";
  const src = coverSrc(quest);
  const Arrow = isNext ? ArrowRight : ArrowLeft;

  return (
    <Link
      href={`/quests/${quest.id}`}
      aria-label={`${label}: ${quest.title}`}
      className="group relative flex min-h-[11rem] overflow-hidden rounded-2xl border border-white/10 bg-carbon transition-[border-color,box-shadow] duration-300 hover:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] hover:shadow-[0_0_32px_-8px_var(--accent)] focus-visible:outline-offset-4 sm:min-h-[13rem]"
      style={{ ["--accent" as string]: quest.accentColor }}
    >
      {/* Portada atenuada (decorativa) — o el gradiente de respaldo si la Quest no tiene media. */}
      <div aria-hidden className="absolute inset-0">
        {src ? (
          <Image
            src={src}
            alt=""
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover opacity-30 transition-[opacity,transform] duration-500 ease-out group-hover:scale-105 group-hover:opacity-45 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div
            className="h-full w-full opacity-40"
            style={{
              backgroundImage: `linear-gradient(135deg, ${quest.imagePlaceholder.from}, ${quest.imagePlaceholder.to})`,
            }}
          />
        )}
        <div
          className={cn(
            "absolute inset-0 from-obsidian via-obsidian/85 to-obsidian/40",
            isNext ? "bg-gradient-to-l" : "bg-gradient-to-r"
          )}
        />
      </div>

      <div
        className={cn(
          "relative flex w-full flex-col justify-end gap-2 p-5 sm:p-6",
          isNext ? "items-end text-right" : "items-start text-left"
        )}
      >
        <span
          className="inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--accent)" }}
        >
          {!isNext && (
            <Arrow
              className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transition-none"
              aria-hidden
            />
          )}
          {label}
          {isNext && (
            <Arrow
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
              aria-hidden
            />
          )}
        </span>
        <span className="line-clamp-2 text-balance font-display text-xl leading-snug text-parchment sm:text-2xl">
          {quest.title}
        </span>
        <span className="line-clamp-1 text-sm text-parchment/60">{quest.role}</span>
      </div>
    </Link>
  );
}
