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
 *
 * Iteración 31 (i18n): esta función ya NO mapea a `Character` — devuelve
 * la fila cruda (con sus columnas `_en`, si `009_i18n.sql` corrió) tal
 * cual la entrega Supabase. El idioma se resuelve recién en
 * `getCharacter()`, después de la caché (mismo patrón que `quests.ts`),
 * así que una sola entrada de caché sirve para los dos idiomas.
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

    return data;
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

/** Idioma de lectura — Iteración 31. Repetido acá (en vez de importarlo de `schema.ts`) para no acoplar este repositorio al de Quests. */
type Locale = "es" | "en";

/** `null` = el Character Sheet todavía no se cargó desde el CMS. */
export async function getCharacter(options?: { locale?: Locale }): Promise<Character | null> {
  const raw = await getCachedCharacterRaw();
  if (raw == null) return null;

  const row = raw as Record<string, unknown>;
  const useEn = options?.locale === "en";
  const pick = (base: unknown, translated: unknown) =>
    useEn && typeof translated === "string" && translated.length > 0 ? translated : base;
  const pickArray = (base: unknown, translated: unknown) =>
    useEn && Array.isArray(translated) && translated.length > 0 ? translated : base;

  return CharacterSchema.parse({
    name: row.name,
    characterClass: pick(row.character_class, row.character_class_en),
    tagline: pick(row.tagline, row.tagline_en),
    bio: pickArray(row.bio, row.bio_en),
    // `?? undefined`: la columna es nullable y puede no existir antes de `005_hero_image.sql`.
    heroImageUrl: row.hero_image_url ?? undefined,
  });
}
