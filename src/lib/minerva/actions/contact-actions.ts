"use server";

import { insertMessage } from "@/lib/demeter/queries/messages.mutations";
import { getTranslations } from "@/lib/i18n/get-translations";
import { createContactFormSchema } from "@/lib/minerva/forms/contact-form-schema";
import { type ActionState } from "./action-state";

/**
 * Server Action del formulario de contacto (Minerva, Iteración 21;
 * localizado en la 33 — "El Alma de la Forja"). Público (sin
 * `requireAdminSession`). Revalida con el mismo Zod del cliente — nunca
 * se confía en lo que manda el navegador.
 *
 * i18n: `getTranslations()` resuelve el diccionario activo leyendo la
 * cookie `devius-locale` vía `getLocale()` (`next/headers` — funciona
 * igual dentro de un Server Action que en un Server Component, no hace
 * falta que el cliente mande el `locale` como argumento). El schema se
 * reconstruye con ese diccionario (`createContactFormSchema`) para que
 * los mensajes de validación salgan en el idioma correcto, y las
 * respuestas de éxito/error que ve el Toast (`ContactForm.tsx`) salen
 * de `t.contactForm.serverSuccess` / `serverErrorFallback` — ya no hay
 * strings pisados a mano en español.
 *
 * Honeypot: si el campo oculto `website` viene lleno es casi seguro un
 * bot; se responde "éxito" igual (no le damos pistas) pero no se guarda.
 */
export async function sendContactMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getTranslations();
  const ContactFormSchema = createContactFormSchema(t);

  const parsed = ContactFormSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    content: formData.get("content") ?? "",
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    // Un bot que llenó el honeypot también cae acá: respuesta indistinguible de un envío real.
    if (parsed.error.issues.some((issue) => issue.path[0] === "website")) {
      return { status: "success", message: t.contactForm.serverSuccess };
    }
    return { status: "error", message: parsed.error.issues[0]?.message ?? t.contactForm.errors.generic };
  }

  try {
    const { name, email, content } = parsed.data;
    await insertMessage({ name, email, content });
    return { status: "success", message: t.contactForm.serverSuccess };
  } catch (err) {
    console.error("[Minerva] sendContactMessageAction", err);
    return {
      status: "error",
      message: t.contactForm.serverErrorFallback,
    };
  }
}
