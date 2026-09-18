import { getSkillTree as fetchSkillTree } from "@/lib/demeter/queries/skill-tree";

/** Servicio de Minerva: expone el Skill Tree ya listo para Hefesto. No es un React Hook. */
export async function getSkillTreeForView() {
  return fetchSkillTree();
}
