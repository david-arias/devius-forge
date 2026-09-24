import { getSkillTree, getSkillTreeEnDrafts } from "@/lib/demeter/queries/skill-tree";
import { SkillsForm } from "@/lib/minerva/forms/SkillsForm";
import { SkillTreeManager } from "@/lib/minerva/forms/SkillTreeManager";

/**
 * `/admin/skills` — Minerva, Iteración 14, extendido en la 17
 * ("Escalabilidad del CMS") con reordenamiento Drag & Drop
 * (`SkillTreeManager`). Iteración 42: los nodos existentes pasan a
 * acordeón (colapsados por defecto) con flechas Arriba/Abajo para
 * reordenar — ver `SkillTreeManager.tsx`. El nodo "Nuevo" queda fuera
 * del manager, siempre expandido al final.
 *
 * Iteración 32 (i18n, "Absoluto"): además de `getSkillTree()` (español),
 * se lee `getSkillTreeEnDrafts()` — mismo `unstable_cache` de fondo, sin
 * fetch extra — para precargar la pestaña "English" de cada nodo.
 */
export default async function AdminSkillsPage() {
  const [skillTree, enDrafts] = await Promise.all([getSkillTree(), getSkillTreeEnDrafts()]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="font-display text-2xl text-parchment">Skill Tree</h1>

      <SkillTreeManager nodes={skillTree} enDrafts={enDrafts} />

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-parchment-muted">
          Nuevo nodo
        </h2>
        <SkillsForm />
      </div>
    </div>
  );
}
