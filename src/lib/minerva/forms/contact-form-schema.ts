import { z } from "zod";
import { es, type Dictionary } from "@/lib/i18n/locales/es";

/**
 * Schema del formulario de contacto (Minerva, Iteración 21; localizado en
 * la 33 — "El Alma de la Forja"). Antes era un objeto Zod estático con
 * mensajes fijos en español; ahora `createContactFormSchema(t)` arma el
 * schema a partir del diccionario activo (`t.contactForm.errors`) para que
 * la validación hable el mismo idioma que el resto del formulario — tanto
 * en el cliente (`zodResolver`, ver `ContactForm.tsx`, que reconstruye el
 * schema con `useTranslation()`) como en el Server Action
 * (`contact-actions.ts`, vía `getTranslations()`). Los límites siguen
 * siendo los mismos CHECK de `006_messages.sql`.
 */
export function createContactFormSchema(t: Pick<Dictionary, "contactForm">) {
  const { errors } = t.contactForm;
  return z.object({
    name: z.string().trim().min(2, errors.nameMin).max(80, errors.nameMax),
    email: z.string().trim().max(254, errors.emailMax).email(errors.emailInvalid),
    content: z.string().trim().min(10, errors.contentMin).max(2000, errors.contentMax),
    /** Honeypot anti-bots: invisible para humanos, debe llegar vacío. */
    website: z.string().max(0).optional(),
  });
}

/**
 * Schema por defecto (ES) — sólo para derivar el tipo `ContactFormValues`.
 * Ningún consumidor real debería `safeParse` contra este directamente:
 * tanto `ContactForm.tsx` como `contact-actions.ts` llaman a
 * `createContactFormSchema(t)` con el diccionario del idioma activo.
 */
export const ContactFormSchema = createContactFormSchema(es);

export type ContactFormValues = z.input<typeof ContactFormSchema>;
