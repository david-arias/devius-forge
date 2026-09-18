import { Code2, PenTool, ScrollText } from "lucide-react";
import { type Character } from "@/lib/demeter/schemas";
import { Card, EmptyState, SectionHeading, StaggerReveal } from "@/components/hefesto/ui";
import { getTranslations } from "@/lib/i18n/get-translations";

interface CharacterSheetProps {
  /** `null` = ficha todavía sin cargar en Supabase. */
  character: Character | null;
}

/**
 * Character Sheet = "Acerca de mí". Sección de Hefesto — recibe datos por props (vía Minerva).
 * Rompe la caja: la bio vive en una carta ancha con espacio extra abajo
 * (`pb-16 sm:pb-20`) para que dos cartas de disciplina (UX/UI + Frontend)
 * floten superpuestas sobre su borde inferior (`-mt-10`/`-mt-12`, `z-10`).
 */
export async function CharacterSheet({ character }: CharacterSheetProps) {
  const t = await getTranslations();

  if (!character) {
    return (
      <section id="character-sheet" className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28 print:py-6">
        <SectionHeading index="02" eyebrow={t.characterSheet.eyebrow} title="Character Sheet" />
        <EmptyState
          icon={ScrollText}
          title={t.characterSheet.emptyTitle}
          description={t.characterSheet.emptyDescription}
        />
      </section>
    );
  }

  return (
    <section id="character-sheet" className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28 print:py-6">
      <SectionHeading index="02" eyebrow={t.characterSheet.eyebrow} title="Character Sheet">
        <p className="mt-2 inline-flex items-center gap-2 text-sm text-parchment-muted">
          <span className="text-parchment">{character.name}</span>
          <span aria-hidden className="text-border-subtle">
            ·
          </span>
          <span className="font-display tracking-wide text-gold-glow">
            {character.characterClass}
          </span>
        </p>
      </SectionHeading>

      <StaggerReveal className="relative">
        <Card className="space-y-4 pb-16 sm:pb-20">
          {character.bio.map((paragraph, index) => (
            <p
              key={index}
              className={
                index === 0
                  ? "leading-relaxed text-parchment"
                  : "leading-relaxed text-parchment/60"
              }
            >
              {paragraph}
            </p>
          ))}
        </Card>

        {/* Dualidad UX/UI + Frontend — cartas superpuestas sobre el borde de la bio */}
        <div className="relative z-10 -mt-10 grid grid-cols-1 gap-4 px-4 sm:-mt-12 sm:grid-cols-2 sm:px-8">
          <Card accentColor="#e8c468" className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-gold-glow/10 text-gold-glow">
              <PenTool className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-display text-parchment">{t.characterSheet.uxuiTitle}</h3>
              <p className="mt-1 text-sm leading-relaxed text-parchment/60">{t.characterSheet.uxuiDescription}</p>
            </div>
          </Card>

          <Card accentColor="#34d399" className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-emerald-glow/10 text-emerald-glow">
              <Code2 className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-display text-parchment">{t.characterSheet.frontendTitle}</h3>
              <p className="mt-1 text-sm leading-relaxed text-parchment/60">{t.characterSheet.frontendDescription}</p>
            </div>
          </Card>
        </div>
      </StaggerReveal>
    </section>
  );
}
