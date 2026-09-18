import { type SkillNode } from "@/lib/demeter/schemas";
import { GitBranch } from "lucide-react";
import { EmptyState, SectionHeading, SkillTreeTimeline } from "@/components/hefesto/ui";
import { getTranslations } from "@/lib/i18n/get-translations";

interface SkillTreeProps {
  nodes: SkillNode[];
}

/**
 * Skill Tree = Experiencia laboral. Iteración 21: la línea de tiempo vive en
 * `SkillTreeTimeline` (rama SVG que se dibuja con el scroll vía `pathLength`).
 * Sección de Hefesto — recibe datos por props.
 * Ahora vive como sección propia de ancho completo (Apolo: paso #3 del flujo
 * narrativo) en vez de una columna angosta del bento — la línea de tiempo
 * respira en una columna central más generosa.
 */
export async function SkillTree({ nodes }: SkillTreeProps) {
  const t = await getTranslations();

  return (
    <section id="skill-tree" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-20 sm:px-8 sm:py-28 print:py-6">
      <SectionHeading index="03" eyebrow={t.skillTree.eyebrow} title="Skill Tree" />
      {nodes.length === 0 && (
        <EmptyState
          icon={GitBranch}
          title={t.skillTree.emptyTitle}
          description={t.skillTree.emptyDescription}
        />
      )}
      {nodes.length > 0 && <SkillTreeTimeline nodes={nodes} />}
    </section>
  );
}
