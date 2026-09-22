import {
  ArrowLeft,
  ExternalLink,
  Lightbulb,
  Map,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  Badge,
  Button,
  Card,
  ChapterMediaFrame,
  QuestDwellTracker,
  QuestHero,
  RevealText,
  StaggerReveal,
} from "@/components/hefesto/ui";
import { cn } from "@/lib/utils";
import { getQuestsForView } from "@/lib/minerva";
import { getQuests } from "@/lib/demeter/queries/quests";
import { SITE_URL } from "@/lib/site";

interface QuestPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Ruta dinámica del Caso de Estudio — Iteración 8 (Minerva), layout
 * renovado en Iteración 12 (Hefesto, "Revolución de la página de Quest")
 * y hero/lightbox de la Iteración 14 (Hefesto, "La Forja Oculta").
 *
 * Decisión de arquitectura (sin cambios desde la Iteración 8): rutas
 * dinámicas de Next.js (`[slug]`) en vez de modales `layoutId` de Framer
 * Motion, por URLs compartibles/indexables, historial de navegador
 * correcto y contenido pre-renderizado estáticamente vía
 * `generateStaticParams`.
 */
export async function generateStaticParams() {
  // Nota (APOLO, Iteración 18): acá se usa `getQuests()` (Deméter) directo,
  // NUNCA `getQuestsForView()` (Minerva) — `generateStaticParams` corre en
  // build time, sin request HTTP, y `draftMode()` (que `getQuestsForView`
  // llama para decidir si incluir borradores) sólo funciona dentro de un
  // request real; llamarla acá tira el error documentado de Next.js
  // ("used draftMode() inside generateStaticParams"). Además no tendría
  // sentido pre-generar rutas estáticas para Quests sin publicar.
  const quests = await getQuests();
  return quests.map((quest) => ({ slug: quest.id }));
}

/**
 * `dynamicParams = true` (Iteración 34, Apolo — fix del "slug 404")
 * EXPLÍCITO — es el default de Next.js, pero dejarlo implícito significa
 * confiar en que nadie lo pise sin darse cuenta en algún `next.config`/
 * segment config futuro. Sin esto en `true`, cualquier slug que no
 * estuviera en la lista de `generateStaticParams()` de ARRIBA (es decir,
 * cualquier Quest publicada DESPUÉS del último build) devolvería un 404
 * inmediato en vez de renderizarse on-demand la primera vez que alguien
 * la visita — que es exactamente el síntoma reportado ("creo una Quest
 * nueva con su slug y la página pública da 404").
 */
export const dynamicParams = true;

export async function generateMetadata({ params }: QuestPageProps): Promise<Metadata> {
  // Mismo motivo que en `QuestPage` más abajo — el `<title>`/`description`
  // también salen de `quest.title`/`quest.summary`, que dependen del idioma.
  // Iteración 36: `noStore()` cambiado por `connection()` — ver el
  // docblock largo en `QuestPage` de abajo.
  await connection();
  const { slug } = await params;
  const quests = await getQuestsForView();
  const quest = quests.find((q) => q.id === slug);

  if (!quest) {
    return { title: "Quest no encontrada — Devius" };
  }

  return {
    title: `${quest.title} — Devius`,
    description: quest.summary,
    // Iteración 31 (Apolo, i18n) — mismo criterio que `layout.tsx`: sin
    // rutas segmentadas por idioma, las dos versiones de este caso de
    // estudio viven en la misma URL (`/quests/${slug}`).
    alternates: {
      languages: {
        "es-CO": `${SITE_URL}/quests/${slug}`,
        "en-US": `${SITE_URL}/quests/${slug}`,
        "x-default": `${SITE_URL}/quests/${slug}`,
      },
    },
  };
}

const chapters = [
  {
    key: "problem" as const,
    icon: Map,
    eyebrow: "Capítulo I",
    title: "El Problema",
  },
  {
    key: "uxProcess" as const,
    icon: Lightbulb,
    eyebrow: "Capítulo II",
    title: "El Proceso UX",
  },
  {
    key: "uiSolution" as const,
    icon: Sparkles,
    eyebrow: "Capítulo III",
    title: "La Solución UI",
  },
  {
    key: "impact" as const,
    icon: Trophy,
    eyebrow: "Capítulo IV",
    title: "El Impacto",
  },
];

export default async function QuestPage({ params }: QuestPageProps) {
  // `await connection()` (Iteración 36, Minerva — fix DEFINITIVO del
  // "i18n estancado", reemplaza el `noStore()` de la Iteración 34): la
  // Iteración 34 asumía que `unstable_noStore()` forzaba esta ruta a
  // renderizar por request — cierto hasta Next 14, pero FALSO en Next 16
  // (modelo "Dynamic I/O"): `unstable_noStore()` es un noop durante la
  // fase de prerender (confirmado leyendo
  // `node_modules/next/dist/server/web/spec-extension/unstable-no-store.js`
  // — el `switch` sobre `workUnitStore.type` tiene un `case 'prerender':
  // ... return;` explícito con el comentario "unstable_noStore() is a
  // noop in Dynamic I/O"). Esta ruta además tiene `generateStaticParams`
  // arriba, así que en build Next SÍ la prerenderiza — y como
  // `noStore()` no hacía nada en esa fase, quedaba congelada con el
  // idioma default ("es") para siempre, sin importar la cookie
  // `devius-locale` del visitante.
  //
  // `connection()` (`next/server`) es el reemplazo oficial de
  // `unstable_noStore` y SÍ corta el prerender ("prerendering stops
  // here" — docs de Next): todo lo que sigue, incluido `getQuestsForView()`
  // (que resuelve `getLocale()` vía `cookies()`), corre en cada request
  // real, nunca en build. `generateStaticParams` sigue generando las
  // rutas conocidas al build (para el listado de slugs/SEO), pero el HTML
  // real de cada visita se recalcula siempre — el objetivo original de
  // la Iteración 34, ahora con la API que de verdad lo cumple.
  await connection();

  const { slug } = await params;
  const quests = await getQuestsForView();
  const quest = quests.find((q) => q.id === slug);

  if (!quest) {
    notFound();
  }

  return (
    <main className="relative flex-1">
      {/* Logro "Erudito de la UI" (Iteración 13) — ver QuestDwellTracker.tsx */}
      <QuestDwellTracker />
      {/*
        Cabecera — Iteración 14 (Hefesto, "La Forja Oculta"): pasó de
        `min-h-[22rem]` a `min-h-[70vh]` (casi pantalla completa) para dar
        más peso visual al proyecto apenas se entra a su caso de estudio.
        `QuestHero` (Client Component, ver su propio docblock) pinta la
        imagen/video con un parallax sutil sólo cuando `quest.media`
        existe; si no, esta misma sección sigue cayendo al
        `imagePlaceholder` de gradiente de siempre (estático, sin JS).
      */}
      <section
        className="relative flex min-h-[70vh] flex-col justify-end overflow-hidden px-4 pb-12 pt-32 sm:px-8 sm:pb-16"
        style={
          quest.media
            ? undefined
            : {
                backgroundImage: `linear-gradient(135deg, ${quest.imagePlaceholder.from}, ${quest.imagePlaceholder.to})`,
              }
        }
      >
        {quest.media && <QuestHero media={quest.media} />}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.14),transparent_55%)]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />

        <div className="relative mx-auto w-full max-w-4xl">
          <Link
            href="/#quests"
            className="mb-6 inline-flex items-center gap-1.5 rounded-md text-sm text-parchment-muted transition-colors duration-150 hover:text-parchment"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver a Quests
          </Link>

          <p
            className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: quest.accentColor }}
          >
            {quest.role}
          </p>
          {/* Iteración 19: título con revelado en cascada por palabra */}
          <RevealText
            as="h1"
            text={quest.title}
            delay={0.25}
            className="text-balance break-words font-display text-3xl leading-tight text-parchment sm:text-4xl lg:text-5xl"
          />
          <p className="mt-4 max-w-2xl leading-relaxed text-parchment/60">{quest.summary}</p>

          <div className="mt-6 flex flex-wrap gap-1.5">
            {quest.tech.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Los 4 capítulos del caso de estudio — "zig-zag": imagen + texto alternando de lado, Iteración 12. `ChapterMediaFrame` (Iteración 14) agrega zoom/lightbox cuando hay imagen real. */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-8 sm:py-20">
        <StaggerReveal className="space-y-8 sm:space-y-10">
          {chapters.map(({ key, icon: Icon, eyebrow, title }, index) => {
            const reversed = index % 2 === 1;

            return (
              <div
                key={key}
                className={cn(
                  "flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6",
                  reversed && "lg:flex-row-reverse"
                )}
              >
                <ChapterMediaFrame quest={quest} chapterKey={key} className="lg:w-5/12" />

                <Card accentColor={quest.accentColor} className="flex flex-col gap-3 lg:w-7/12">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
                      style={{
                        borderColor: "color-mix(in srgb, var(--accent) 45%, transparent)",
                        color: "var(--accent)",
                        background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p
                        className="text-[0.65rem] font-semibold uppercase tracking-[0.18em]"
                        style={{ color: "var(--accent)" }}
                      >
                        {eyebrow}
                      </p>
                      <h2 className="font-display text-lg text-parchment">{title}</h2>
                    </div>
                  </div>
                  <p className="leading-relaxed text-parchment/70">{quest.caseStudy[key]}</p>
                </Card>
              </div>
            );
          })}
        </StaggerReveal>

        {quest.href && (
          <div className="mt-10 flex justify-center">
            <a href={quest.href} target="_blank" rel="noreferrer">
              <Button variant="cta" className="gap-2 px-6 py-2.5">
                Ver proyecto en vivo
                <ExternalLink className="h-4 w-4" aria-hidden />
              </Button>
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
