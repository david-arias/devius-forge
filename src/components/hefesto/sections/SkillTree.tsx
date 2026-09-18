import { type SkillNode } from "@/lib/demeter/schemas";
import { GitBranch } from "lucide-react";
import { EmptyState, SectionHeading, SkillTreeTimeline } from "@/components/hefesto/ui";

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
export function SkillTree({ nodes }: SkillTreeProps) {
  return (
    <section id="skill-tree" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-20 sm:px-8 sm:py-28 print:py-6">
      <SectionHeading index="03" eyebrow="Progresión" title="Skill Tree" />
      {nodes.length === 0 && (
        <EmptyState
          icon={GitBranch}
          title="El árbol aún no tiene ramas"
          description="La progresión profesional se está documentando. Volvé pronto para ver cada nodo desbloqueado."
        />
      )}
      {nodes.length > 0 && <SkillTreeTimeline nodes={nodes} />}
    </section>
  );
}
