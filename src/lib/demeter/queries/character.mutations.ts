import { createServerSupabaseClient } from "@/lib/supabase/server";
import { type Character } from "../schemas";

/**
 * Mutación del Character Sheet (Deméter, Iteración 15) — separada de
 * `character.ts` y nunca re-exportada desde `queries/index.ts`. Ver el
 * comentario largo en `quests.mutations.ts` para el porqué. Fila única
 * (`id = "default"`, ver `002_admin_tables.sql`) — sin eliminar/duplicar.
 */
export async function upsertCharacter(input: Character): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const row = {
    id: "default",
    name: input.name,
    character_class: input.characterClass,
    tagline: input.tagline,
    bio: input.bio,
    // Iteración 19 — requiere `005_hero_image.sql`. `null` borra la imagen.
    hero_image_url: input.heroImageUrl ?? null,
  };
  const { error } = await supabase.from("character_sheet").upsert(row, { onConflict: "id" });
  if (error) throw new Error(`No se pudo guardar el Character Sheet: ${error.message}`);
}
