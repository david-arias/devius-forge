import { z } from "zod";

/**
 * Schema del formulario de contacto (Minerva, Iteración 21). Se usa en el
 * cliente (`zodResolver`) y otra vez en el Server Action — los mismos
 * límites que los CHECK de `006_messages.sql`.
 */
export const ContactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tu nombre necesita al menos 2 letras.")
    .max(80, "El nombre es demasiado largo (máx. 80)."),
  email: z.string().trim().max(254, "El correo es demasiado largo.").email("Ese correo no parece válido."),
  content: z
    .string()
    .trim()
    .min(10, "Contame un poco más (mínimo 10 caracteres).")
    .max(2000, "El mensaje es demasiado largo (máx. 2000)."),
  /** Honeypot anti-bots: invisible para humanos, debe llegar vacío. */
  website: z.string().max(0).optional(),
});

export type ContactFormValues = z.input<typeof ContactFormSchema>;
