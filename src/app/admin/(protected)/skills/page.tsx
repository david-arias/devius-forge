import { getSkillTree } from "@/lib/demeter/queries/skill-tree";
import { SkillsForm } from "@/lib/minerva/forms/SkillsForm";
import { SkillTreeManager } from "@/lib/minerva/forms/SkillTreeManager";

/**
 * `/admin/skills` — Minerva, Iteración 14, extendido en la 17
 * ("Escalabilidad del CMS") con reordenamiento Drag & Drop
 * (`SkillTreeManager`). Sin acordeón ni buscador a propósito — el pedido
 * de Hefesto para esta iteración sólo nombró Quests e Inventario para
 * esa parte de la UI (ver el comentario en `SkillTreeManager.tsx`). El
 * nodo "Nuevo" queda fuera del manager, siempre visible al final.
 */
export default async function AdminSkillsPage() {
  const skillTree = await getSkillTree();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="font-display text-2xl text-parchment">Skill Tree</h1>

      <SkillTreeManager nodes={skillTree} />

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-parchment-muted">
          Nuevo nodo
        </h2>
        <SkillsForm />
      </div>
    </div>
  );
}
