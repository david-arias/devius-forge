import { z } from "zod";

const optionalUrl = (host: string, label: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || /^https:\/\//i.test(value), `El enlace de ${label} debe empezar con https://`)
    .refine((value) => {
      if (value === "") return true;
      try {
        const url = new URL(value);
        return url.hostname === host || url.hostname.endsWith(`.${host}`);
      } catch {
        return false;
      }
    }, `Ese no parece un enlace de ${label} (${host}).`);

/**
 * Schema de FORMULARIO de Ajustes Globales (Minerva, Iteración 22).
 * Campos vacíos permitidos (= ocultar ese enlace en el sitio). Se usa en
 * el cliente (`zodResolver`) y otra vez en `saveSettingsAction`.
 */
export const SettingsFormSchema = z.object({
  email: z
    .string()
    .trim()
    .refine((value) => value === "" || z.string().email().safeParse(value).success, "Ese correo no parece válido."),
  githubUrl: optionalUrl("github.com", "GitHub"),
  linkedinUrl: optionalUrl("linkedin.com", "LinkedIn"),
});

export type SettingsFormValues = z.input<typeof SettingsFormSchema>;

/** Forma del formulario → forma de dominio (`""` → `undefined`). */
export function toSettingsInput(values: z.output<typeof SettingsFormSchema>) {
  return {
    email: values.email || undefined,
    githubUrl: values.githubUrl || undefined,
    linkedinUrl: values.linkedinUrl || undefined,
  };
}
