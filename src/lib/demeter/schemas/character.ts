import { z } from "zod";

/** Character = ficha de "Acerca de mí" (Character Sheet). Dominio Deméter. */
export const CharacterSchema = z.object({
  name: z.string(),
  characterClass: z.string(),
  /** Tagline corto y épico — vive sólo en el Hero, no duplica la bio completa. */
  tagline: z.string(),
  /** 2-3 párrafos cortos de bio, en orden de lectura — sólo en el Character Sheet. */
  bio: z.array(z.string()).min(1),
  /**
   * Retrato principal del Hero (Iteración 19, DEMÉTER/ÉTER). Idealmente un
   * PNG sin fondo subido desde `/admin/character` al bucket `quest-images`
   * (carpeta `hero/`). Opcional: sin imagen, el Hero pinta un sigilo.
   */
  heroImageUrl: z.string().url().optional(),
});

export type Character = z.infer<typeof CharacterSchema>;
