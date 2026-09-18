import { Anvil } from "lucide-react";
import { type Quest } from "@/lib/demeter/schemas";
import { EmptyState, QuestCarousel, SectionHeading } from "@/components/hefesto/ui";

interface QuestShowcaseProps {
  quests: Quest[];
}

/**
 * Quests = Proyectos. Iteración 20 (Hefesto): la grilla vertical se
 * reemplazó por `QuestCarousel` — scroll horizontal anclado con imán en
 * desktop, carrusel nativo con scroll-snap en touch. Este archivo queda
 * como Server Component fino: decide entre estado vacío y carrusel.
 */
export function QuestShowcase({ quests }: QuestShowcaseProps) {
  const heading = <SectionHeading index="04" eyebrow="Bitácora" title="Quests" className="mb-10" />;

  if (quests.length === 0) {
    return (
      <section id="quests" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-8 sm:py-28">
        {heading}
        <EmptyState
          icon={Anvil}
          title="La forja está vacía"
          description="Los próximos casos de estudio se están templando. Cada Quest publicada aparecerá acá."
        />
      </section>
    );
  }

  return (
    <section id="quests" aria-label="Quests" className="relative">
      <QuestCarousel quests={quests} heading={heading} />
    </section>
  );
}
