import { z } from "zod";

/**
 * GlobalSettings — Deméter, Iteración 22. Fila única de
 * `public.global_settings` (`007_settings.sql`). Cada campo es opcional:
 * un enlace vacío simplemente no se muestra en el sitio público.
 */
export const GlobalSettingsSchema = z.object({
  email: z.string().email().optional(),
  githubUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  updatedAt: z.string().optional(),
});

export type GlobalSettings = z.infer<typeof GlobalSettingsSchema>;
