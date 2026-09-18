import { createServerSupabaseClient } from "@/lib/supabase/server";
import { type Character } from "../schemas";

/**
 * Mutación del Character Sheet (Deméter, Iteración 15, extendida en la
 * 32 "i18n Absoluto") — separada de `character.ts` y nunca re-exportada
 * desde `queries/index.ts`. Ver el comentario largo en
 * `quests.mutations.ts` para el porqué. Fila única (`id = "default"`,
 * ver `002_admin_tables.sql`) — sin eliminar/duplicar.
 */

/** `Character` (dominio de LECTURA) + las 3 traducciones EN que `CharacterForm` edita — ver `toCharacterInput()` en `character-form-schema.ts`. */
export type CharacterUpsertInput = Character & {
  characterClassEn?: string;
  taglineEn?: string;
  bioEn?: string[];
};

/** `""`/`[]` (valor por defecto de un formulario sin completar) → `null` — mismo criterio que `emptyToNull` en `quests.mutations.ts`: no borra una traducción existente al guardar sin tocar la pestaña "EN". */
function emptyToNull(value: string | undefined): string | null {
  return value && value.trim().length > 0 ? value : null;
}

function arrayEmptyToNull(value: string[] | undefined): string[] | null {
  return value && value.length > 0 ? value : null;
}

export async function upsertCharacter(input: CharacterUpsertInput): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const row = {
    id: "default",
    name: input.name,
    character_class: input.characterClass,
    tagline: input.tagline,
    bio: input.bio,
    // Iteración 19 — requiere `005_hero_image.sql`. `null` borra la imagen.
    hero_image_url: input.heroImageUrl ?? null,
    // Iteración 32 (i18n) — columnas hermanas en inglés, ver `009_i18n.sql`.
    character_class_en: emptyToNull(input.characterClassEn),
    tagline_en: emptyToNull(input.taglineEn),
    bio_en: arrayEmptyToNull(input.bioEn),
  };
  const { error } = await supabase.from("character_sheet").upsert(row, { onConflict: "id" });
  if (error) throw new Error(`No se pudo guardar el Character Sheet: ${error.message}`);
}
