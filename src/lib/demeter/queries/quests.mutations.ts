import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapSupabaseQuestRow, SupabaseQuestRowSchema } from "@/lib/supabase/schema";
import { type Quest } from "../schemas";
import { type QuestUpsertInput } from "./quests";

/**
 * Mutaciones de Quests (Deméter, Iteración 15) — SEPARADO a propósito de
 * `quests.ts` (que sólo lee) y NUNCA re-exportado desde `queries/index.ts`.
 * Ver el comentario largo al principio de `quests.ts` para el porqué:
 * importar `createServerSupabaseClient` (`next/headers`) acá adentro es
 * seguro porque el único que importa este archivo es
 * `src/lib/minerva/actions/quest-actions.ts` (`"use server"`); nada
 * "use client" lo toca nunca.
 */

function toRow(input: QuestUpsertInput) {
  return {
    id: input.id,
    title: input.title,
    summary: input.summary,
    role: input.role,
    tech: input.tech,
    href: input.href ?? null,
    status: input.status,
    is_published: input.isPublished,
    accent_color: input.accentColor,
    image_placeholder: input.imagePlaceholder,
    case_study: {
      problem: input.caseStudy.problem,
      ux_process: input.caseStudy.uxProcess,
      ui_solution: input.caseStudy.uiSolution,
      impact: input.caseStudy.impact,
    },
  };
}

/**
 * Crea o actualiza una Quest (`upsert` por `id`/slug). Usa el cliente de
 * sesión (`createServerSupabaseClient`), cuyas escrituras pasan por RLS
 * como el usuario autenticado del panel (ver `001_init.sql`: sólo
 * `authenticated` puede escribir).
 */
export async function upsertQuest(input: QuestUpsertInput): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("quests").upsert(toRow(input), { onConflict: "id" });
  if (error) throw new Error(`No se pudo guardar la quest: ${error.message}`);
}

export async function deleteQuest(id: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("quests").delete().eq("id", id);
  if (error) throw new Error(`No se pudo eliminar la quest: ${error.message}`);
}

/**
 * Duplica una Quest existente como plantilla para una nueva (Hallazgo de
 * Alto Impacto de la auditoría 2026-09-15: "no se puede duplicar un
 * quest"). El slug nuevo es `<id>-copia-<timestamp36>` (siempre único),
 * el título gana el sufijo "(copia)", y la copia siempre queda con
 * `isPublished: false` sin importar el status del original (ver
 * `Quest.isPublished`, actualizado en la Iteración 16).
 */
export async function duplicateQuest(id: string): Promise<Quest> {
  const supabase = await createServerSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from("quests")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    throw new Error("No se encontró la quest a duplicar.");
  }

  const parsed = mapSupabaseQuestRow(SupabaseQuestRowSchema.parse(existing));
  const newId = `${parsed.id}-copia-${Date.now().toString(36)}`;
  const newTitle = `${parsed.title} (copia)`;

  const rest: Record<string, unknown> = { ...(existing as Record<string, unknown>) };
  delete rest.created_at;
  delete rest.updated_at;
  // Iteración 16: la copia ya no fuerza `status: "draft"` (ese valor no
  // existe más, ver `quest.ts`) — conserva el `status` original (sigue
  // siendo información válida, "en qué fase está el proyecto") y en vez
  // de eso apaga `is_published`, igual que `duplicateSkillNode` apaga
  // `unlocked` y `duplicateInventoryItem` apaga `is_published`.
  const insertRow = { ...rest, id: newId, title: newTitle, is_published: false };

  const { error: insertError } = await supabase.from("quests").insert(insertRow);
  if (insertError) throw new Error(`No se pudo duplicar la quest: ${insertError.message}`);

  return { ...parsed, id: newId, title: newTitle, isPublished: false };
}

/**
 * Reordenamiento por Drag & Drop (Minerva/Hefesto/Deméter, Iteración 17
 * "Escalabilidad del CMS"). Recibe la lista completa de ids en su nuevo
 * orden (posición en el array = nueva `sort_order`) y hace un único
 * `upsert` masivo en vez de N updates individuales — más rápido y,
 * sobre todo, atómico desde el punto de vista de la app (todas las filas
 * quedan en el mismo round-trip a Supabase).
 *
 * Sólo se envían `id` + `sort_order` en cada fila: PostgREST arma el
 * `ON CONFLICT (id) DO UPDATE SET sort_order = EXCLUDED.sort_order` a
 * partir de las columnas presentes en el payload, así que ninguna otra
 * columna de la fila existente se toca. La rama `INSERT` del upsert
 * nunca se ejecuta en la práctica porque los ids siempre corresponden a
 * quests ya existentes (el admin sólo reordena lo que ya ve en pantalla).
 */
export async function bulkUpdateQuestOrder(order: { id: string; order: number }[]): Promise<void> {
  if (order.length === 0) return;

  const supabase = await createServerSupabaseClient();
  const rows = order.map(({ id, order: sortOrder }) => ({ id, sort_order: sortOrder }));

  const { error } = await supabase.from("quests").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`No se pudo actualizar el orden de las quests: ${error.message}`);
}
