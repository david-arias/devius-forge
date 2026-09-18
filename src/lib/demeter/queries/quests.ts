import { unstable_cache } from "next/cache";
import { getSupabaseClient } from "@/lib/supabase/client";
import { mapSupabaseQuestRow, SupabaseQuestRowSchema, type Locale, type SupabaseQuestRow } from "@/lib/supabase/schema";
import { QuestSchema, type Quest } from "../schemas";

/**
 * Repositorio de Quests (Deméter) — SOLO LECTURA. Iteración 15 lo conectó
 * a Supabase; Iteración 16 ("CMS V2") le agrega caché (auditoría
 * 2026-09-16, Hallazgo de Alto Impacto: "cada sección vuelve a pedir sus
 * datos a Supabase desde cero, sin caché ni feedback visual de carga" —
 * 600ms-1.5s medidos por transición). Desde la Iteración 19 ya no hay
 * fallback con datos de prueba: Supabase vacío = lista vacía.
 *
 * IMPORTANTE: las mutaciones (`upsertQuest`/`deleteQuest`/`duplicateQuest`)
 * viven en `quests.mutations.ts`, nunca re-exportado desde
 * `queries/index.ts` — ver el comentario largo ahí (y en
 * `quests.mutations.ts`) sobre por qué: este archivo se re-exporta desde
 * el barrel que también consumen componentes "use client"
 * (`AchievementToast`/`AchievementsDrawer` vía `achievements-store.ts` y
 * `achievements.ts`), así que sólo puede importar código seguro para
 * bundles de cliente — motivo por el que esos 3 archivos ahora importan
 * `achievements.ts` DIRECTO en vez de por el barrel (fix post-Iteración 15).
 * `unstable_cache` (Next.js, sólo válido en Server Components/Route
 * Handlers, igual que `next/headers`) es seguro acá SÓLO porque ese fix
 * ya deja el barrel sin consumidores "use client" — lo único que queda
 * importándolo es `queries/index.ts` → los wrappers de Minerva
 * (`get-quests.ts`, etc.) → páginas `async function` (Server Components).
 * Si en el futuro algo "use client" vuelve a importar el barrel completo,
 * este archivo rompería el build de cliente exactamente como pasó con
 * `next/headers` — por eso conviene seguir importando siempre desde el
 * archivo específico (`@/lib/demeter/queries/quests`, no el barrel) desde
 * cualquier código nuevo que no sea 100% Server Component.
 */
/**
 * Iteración 19 (DEMÉTER — "Data Real"): el array de datos de prueba que
 * vivía acá se eliminó. Si Supabase está vacío o no responde, esta
 * lectura devuelve `[]` y la sección pública muestra su estado vacío
 * (`EmptyState`, Hefesto) en vez de contenido inventado.
 */

async function fetchQuestsFromSourceUncached(): Promise<unknown[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("quests")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Iteración 31 (i18n): se cachean las FILAS CRUDAS (validadas contra
    // `SupabaseQuestRowSchema`, con sus columnas `_en` incluidas), no ya
    // mapeadas a `Quest` — el idioma se resuelve recién en `getQuests()`,
    // después de leer la caché, así que UNA sola entrada de caché sirve
    // para español e inglés (no se duplica el fetch de Supabase por idioma).
    return data.map((row) => SupabaseQuestRowSchema.parse(row));
  } catch (err) {
    console.warn(
      "[Deméter] No se pudo leer public.quests de Supabase — devolviendo lista vacía (estado vacío en la UI).",
      err
    );
    return [];
  }
}

/**
 * `unstable_cache` con tag `"quests"` — Iteración 16. Cachea la respuesta
 * cruda de Supabase (TODAS las filas, publicadas o no) indefinidamente
 * hasta que algo llame a `updateTag("quests")`, lo que hacen
 * `saveQuestAction`/`deleteQuestAction`/`duplicateQuestAction`
 * (`src/lib/minerva/actions/quest-actions.ts`) apenas terminan de
 * escribir. Sin `revalidate` explícito: el tag es la única forma de
 * invalidación — no queremos que esto quede stale por más de un guardado,
 * pero tampoco un TTL arbitrario que lo invalide de más.
 */
const getCachedQuestsRaw = unstable_cache(fetchQuestsFromSourceUncached, ["demeter-quests-source"], {
  tags: ["quests"],
});

export async function getQuests(options?: { includeDrafts?: boolean; locale?: Locale }): Promise<Quest[]> {
  const raw = await getCachedQuestsRaw();
  const rows = SupabaseQuestRowSchema.array().parse(raw);
  const quests = QuestSchema.array().parse(rows.map((row) => mapSupabaseQuestRow(row, options?.locale ?? "es")));
  if (options?.includeDrafts) return quests;
  return quests.filter((quest) => quest.isPublished);
}

/**
 * `getQuestsRaw()` — Deméter, Iteración 32 ("i18n Absoluto"). Devuelve
 * las filas CRUDAS (con sus columnas `_en`), sin resolver ningún idioma
 * — a diferencia de `getQuests()`, pensado para el sitio público.
 *
 * Motivo (fix de la Iteración 31, "el formulario no precarga las
 * traducciones al reabrir una Quest"): `Quest` (el tipo de dominio de
 * LECTURA) sólo puede representar un idioma a la vez — es lo que
 * necesita el sitio público, nunca los dos juntos. El CMS (`QuestForm`)
 * sí necesita los dos a la vez para poder editarlos en el mismo
 * formulario. En vez de forzar esa necesidad adentro de `Quest` (lo que
 * filtraría el detalle de i18n a cada consumidor público del dominio),
 * se resuelve acá: `/admin/quests` usa esta función en vez de
 * `getQuests()`, y arma tanto el `Quest` en español (con
 * `mapSupabaseQuestRow(row, "es")`, igual que antes) como el borrador en
 * inglés (`extractQuestEnDraft(row)`, ver abajo) a partir de la MISMA
 * fila — ambos leen la misma entrada de caché, no hay doble fetch.
 */
export async function getQuestsRaw(options?: { includeDrafts?: boolean }): Promise<SupabaseQuestRow[]> {
  const raw = await getCachedQuestsRaw();
  const rows = SupabaseQuestRowSchema.array().parse(raw);
  if (options?.includeDrafts) return rows;
  return rows.filter((row) => row.is_published);
}

/** Borrador de traducción EN de una Quest, tal como lo edita `QuestForm` — ver `getQuestsRaw()`. */
export interface QuestEnDraft {
  titleEn: string;
  summaryEn: string;
  roleEn: string;
  problemEn: string;
  uxProcessEn: string;
  uiSolutionEn: string;
  impactEn: string;
}

/** Extrae el borrador EN (strings vacíos para lo que todavía no está traducido) de una fila cruda. */
export function extractQuestEnDraft(row: SupabaseQuestRow): QuestEnDraft {
  return {
    titleEn: row.title_en ?? "",
    summaryEn: row.summary_en ?? "",
    roleEn: row.role_en ?? "",
    problemEn: row.case_study_en?.problem ?? "",
    uxProcessEn: row.case_study_en?.ux_process ?? "",
    uiSolutionEn: row.case_study_en?.ui_solution ?? "",
    impactEn: row.case_study_en?.impact ?? "",
  };
}

/**
 * Forma editable por el CMS — deja afuera `media`/`testimonial`/`chapterMedia`, todavía sin formulario (ver TODO en `QuestForm.tsx`).
 * Re-exportado por `quests.mutations.ts` (un `type` no genera código en runtime, así que no rompe el aislamiento cliente/servidor).
 *
 * Los 4 campos `*_en`/`caseStudyEn` (Iteración 31, i18n) son opcionales:
 * el formulario los manda vacíos ("") cuando el editor no completó la
 * traducción todavía, y `toRow()` (`quests.mutations.ts`) los guarda como
 * `null` en ese caso — nunca sobreescribe una traducción existente con
 * texto vacío por accidente porque el form siempre manda el valor
 * completo (controlado), no un patch parcial.
 */
export type QuestUpsertInput = Pick<
  Quest,
  "id" | "title" | "summary" | "role" | "tech" | "href" | "status" | "isPublished" | "accentColor" | "imagePlaceholder"
> & {
  caseStudy: Pick<Quest["caseStudy"], "problem" | "uxProcess" | "uiSolution" | "impact">;
  titleEn?: string;
  summaryEn?: string;
  roleEn?: string;
  caseStudyEn?: {
    problem?: string;
    uxProcess?: string;
    uiSolution?: string;
    impact?: string;
  };
};
