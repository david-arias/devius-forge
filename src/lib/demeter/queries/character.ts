import { unstable_cache } from "next/cache";
import { getSupabaseClient } from "@/lib/supabase/client";
import { CharacterSchema, type Character } from "../schemas";

/**
 * Repositorio de Character (Deméter) — SOLO LECTURA. Ver el comentario
 * largo en `quests.ts`: la mutación (`upsertCharacter`) vive en
 * `character.mutations.ts` (nunca re-exportada desde `queries/index.ts`)
 * para que este archivo pueda importarse desde código "use client" sin
 * arrastrar `next/headers`.
 */
/**
 * Iteración 19 (DEMÉTER — "Data Real"): se eliminó el objeto de datos de
 * prueba. Si la fila `default` todavía no existe (o Supabase no responde),
 * la lectura devuelve `null` y cada consumidor muestra su estado vacío.
 */
async function fetchCharacterFromSourceUncached(): Promise<unknown | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("character_sheet")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      name: data.name,
      characterClass: data.character_class,
      tagline: data.tagline,
      bio: data.bio,
      // `?? undefined`: la columna es nullable y puede no existir antes de `005_hero_image.sql`.
      heroImageUrl: data.hero_image_url ?? undefined,
    };
  } catch (err) {
    console.warn(
      "[Deméter] No se pudo leer public.character_sheet de Supabase — devolviendo null (estado vacío en la UI).",
      err
    );
    return null;
  }
}

/** `unstable_cache` con tag `"character"` — invalidado por `saveCharacterAction` (Iteración 16, mismo patrón que `quests.ts`). */
const getCachedCharacterRaw = unstable_cache(fetchCharacterFromSourceUncached, ["demeter-character-source"], {
  tags: ["character"],
});

/** `null` = el Character Sheet todavía no se cargó desde el CMS. */
export async function getCharacter(): Promise<Character | null> {
  const raw = await getCachedCharacterRaw();
  if (raw == null) return null;
  return CharacterSchema.parse(raw);
}
