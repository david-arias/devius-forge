import { getSkillTree as fetchSkillTree } from "@/lib/demeter/queries/skill-tree";
import { getLocale } from "@/lib/i18n/get-locale";

/**
 * Servicio de Minerva: expone el Skill Tree ya listo para Hefesto. No es un React Hook.
 * Iteración 31 (i18n): resuelve el idioma vía `getLocale()` (cookie `devius-locale`) antes de pedirle a Deméter el contenido.
 */
export async function getSkillTreeForView() {
  const locale = await getLocale();
  return fetchSkillTree({ locale });
}
