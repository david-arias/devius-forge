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

/**
 * `""` (string vacío, valor por defecto de un input de formulario sin
 * completar) → `null` (columna sin traducir, cae al fallback en español
 * en la lectura) — Iteración 31 (i18n). Evita que guardar el formulario
 * sin tocar la pestaña "EN" borre una traducción existente con un valor
 * vacío real: como el form siempre manda el estado completo, "" significa
 * literalmente "no hay traducción acá".
 */
function emptyToNull(value: string | undefined): string | null {
  return value && value.trim().length > 0 ? value : null;
}

function toRow(input: QuestUpsertInput) {
  const caseStudyEn = input.caseStudyEn;
  const hasCaseStudyEn =
    caseStudyEn &&
    [caseStudyEn.problem, caseStudyEn.uxProcess, caseStudyEn.uiSolution, caseStudyEn.impact].some(
      (value) => value && value.trim().length > 0
    );

  const chapterMedia = input.caseStudy.chapterMedia;

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
    // Iteración 34 (Hefesto/Éter, "Expansión de Media") — portada real,
    // antes excluida del `QuestUpsertInput` (ver docblock de `quests.ts`).
    // `?? null`: la columna `media` es NOT NULL-nullable pero siempre
    // presente en la fila (`SupabaseQuestRowSchema.media` es
    // `.nullable()` sin `.optional()`), así que un `undefined` de una
    // Quest sin portada real tiene que mandarse explícito como `null`,
    // nunca omitirse.
    media: input.media ?? null,
    // Iteración 39 — video del Scroll-Bound Hero (`010_hero_video.sql`).
    // `""`/`undefined` → `null`: así el botón "Quitar video" del CMS borra
    // de verdad la referencia en la base.
    hero_video_url: emptyToNull(input.heroVideoUrl),
    case_study: {
      problem: input.caseStudy.problem,
      ux_process: input.caseStudy.uxProcess,
      ui_solution: input.caseStudy.uiSolution,
      impact: input.caseStudy.impact,
      // Mismo criterio: cada capítulo es opcional (Quest sin foto en ESE
      // capítulo puntual, ver `QuestSchema`), pero si ninguno tiene
      // imagen se manda `null` entero en vez de un objeto con las 4
      // claves en `undefined` — más limpio para leer directo en Supabase.
      chapter_media:
        chapterMedia && Object.values(chapterMedia).some(Boolean)
          ? {
              problem: chapterMedia.problem,
              ux_process: chapterMedia.uxProcess,
              ui_solution: chapterMedia.uiSolution,
              impact: chapterMedia.impact,
            }
          : null,
    },
    // Iteración 31 (Deméter, i18n) — columnas hermanas en inglés, ver `009_i18n.sql`.
    title_en: emptyToNull(input.titleEn),
    summary_en: emptyToNull(input.summaryEn),
    role_en: emptyToNull(input.roleEn),
    case_study_en: hasCaseStudyEn
      ? {
          problem: emptyToNull(caseStudyEn?.problem) ?? undefined,
          ux_process: emptyToNull(caseStudyEn?.uxProcess) ?? undefined,
          ui_solution: emptyToNull(caseStudyEn?.uiSolution) ?? undefined,
          impact: emptyToNull(caseStudyEn?.impact) ?? undefined,
        }
      : null,
  };
}

/**
 * Crea o actualiza una Quest (`upsert` por `id`/slug). Usa el cliente de
 * sesión (`createServerSupabaseClient`), cuyas escrituras pasan por RLS
 * como el usuario autenticado del panel (ver `001_init.sql`: sólo
 * `authenticated` puede escribir).
 *
 * `previousId` (Iteración 34, Apolo/Minerva — fix del "slug 404"): el
 * `id` de la Quest ES su slug público, y el formulario lo deja editable
 * (`QuestForm.tsx`). Como el `upsert` es `onConflict: "id"`, renombrar el
 * slug de una Quest existente (id viejo ≠ id nuevo) NO la renombra: crea
 * una fila NUEVA con el id nuevo y deja la fila VIEJA huérfana en la
 * base — la URL vieja sigue sirviendo contenido stale (desde caché) y
 * después 404 solo a medias, y la Quest queda duplicada. `previousId` es
 * el `id` que tenía el registro ANTES de este guardado (lo manda
 * `saveQuestAction` en un input oculto, `originalId`); si vino y es
 * distinto del nuevo, se borra la fila vieja después de que el upsert de
 * la nueva confirme — nunca antes (si el insert nuevo fallara, no
 * queremos perder el registro viejo).
 */
export async function upsertQuest(input: QuestUpsertInput, previousId?: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("quests").upsert(toRow(input), { onConflict: "id" });
  if (error) throw new Error(`No se pudo guardar la quest: ${error.message}`);

  if (previousId && previousId !== input.id) {
    const { error: deleteError } = await supabase.from("quests").delete().eq("id", previousId);
    // No se relanza: la Quest con el id NUEVO ya se guardó bien (lo que
    // más le importa al editor); un huérfano que no se pudo limpiar es
    // recuperable a mano y no debería tumbar el guardado que sí funcionó.
    if (deleteError) {
      console.error(
        `[Deméter] upsertQuest: no se pudo borrar el registro viejo (id "${previousId}") tras renombrar el slug a "${input.id}".`,
        deleteError
      );
    }
  }
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

  // `locale: "es"` explícito — duplicar siempre parte del contenido base
  // en español (las columnas `_en` crudas se copian tal cual más abajo
  // vía `...rest`, no se pierden, sólo no entran en `parsed`).
  const parsed = mapSupabaseQuestRow(SupabaseQuestRowSchema.parse(existing), "es");
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
  // Iteración 42 (fix "null value in column … violates not-null
  // constraint"): antes era un `upsert` con sólo `{ id, sort_order }`.
  // Postgres arma primero la fila de INSERT y valida los NOT NULL
  // (`label`, `title`, …) ANTES de detectar el conflicto por `id`, así que
  // el reordenamiento fallaba aunque la fila ya existiera. Un `update`
  // por fila sólo toca `sort_order` y nunca intenta insertar.
  const results = await Promise.all(
    order.map(({ id, order: sortOrder }) =>
      supabase.from("quests").update({ sort_order: sortOrder }).eq("id", id)
    )
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(`No se pudo actualizar el orden de las quests: ${failed.error.message}`);
}
