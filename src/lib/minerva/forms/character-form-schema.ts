import { z } from "zod";

/**
 * Schema de FORMULARIO (no de dominio) para el Character Sheet — Minerva,
 * Iteración 14 ("La Forja Oculta"), extendido en la 32 ("i18n Absoluto").
 * Difiere a propósito de `CharacterSchema`
 * (`src/lib/demeter/schemas/character.ts`): `bio` en el dominio es
 * `string[]` (un párrafo por elemento), pero un `<textarea>` de formulario
 * trabaja mejor con un único string — acá se pide "un párrafo por línea" y
 * se separa recién en `toCharacterInput()`, el único punto de conversión
 * entre la forma del formulario y la forma del dominio.
 *
 * Campos `*En` (Iteración 32, i18n): traducción al inglés — SIEMPRE
 * opcionales, mismo criterio que `QuestFormSchema` (`quest-form-schema.ts`).
 */
export const CharacterFormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  characterClass: z.string().min(1, "La clase es obligatoria."),
  tagline: z.string().min(1, "El tagline es obligatorio (vive sólo en el Hero)."),
  /** Un párrafo de bio por línea — se convierte a `string[]` al enviar. */
  bio: z.string().min(1, "La bio necesita al menos un párrafo."),
  /** Iteración 19 — URL pública del retrato del Hero. Vacío = sin imagen. */
  heroImageUrl: z.union([z.literal(""), z.string().url("La URL de la imagen no es válida.")]),
  characterClassEn: z.string().optional(),
  taglineEn: z.string().optional(),
  bioEn: z.string().optional(),
});

export type CharacterFormValues = z.infer<typeof CharacterFormSchema>;

/** Convierte los valores validados del formulario a la forma de `CharacterUpsertInput` (Deméter). */
export function toCharacterInput(values: CharacterFormValues) {
  return {
    name: values.name,
    characterClass: values.characterClass,
    tagline: values.tagline,
    bio: values.bio
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
    heroImageUrl: values.heroImageUrl ? values.heroImageUrl : undefined,
    characterClassEn: values.characterClassEn,
    taglineEn: values.taglineEn,
    bioEn: values.bioEn
      ? values.bioEn
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      : undefined,
  };
}
