"use server";

import { insertMessage } from "@/lib/demeter/queries/messages.mutations";
import { ContactFormSchema } from "@/lib/minerva/forms/contact-form-schema";
import { type ActionState } from "./action-state";

/**
 * Server Action del formulario de contacto (Minerva, Iteración 21).
 * Público (sin `requireAdminSession`). Revalida con el mismo Zod del
 * cliente — nunca se confía en lo que manda el navegador.
 *
 * Honeypot: si el campo oculto `website` viene lleno es casi seguro un
 * bot; se responde "éxito" igual (no le damos pistas) pero no se guarda.
 */
export async function sendContactMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = ContactFormSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    content: formData.get("content") ?? "",
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    // Un bot que llenó el honeypot también cae acá: respuesta indistinguible de un envío real.
    if (parsed.error.issues.some((issue) => issue.path[0] === "website")) {
      return { status: "success", message: "Mensaje enviado a través de la Forja." };
    }
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisá los campos del formulario." };
  }

  try {
    const { name, email, content } = parsed.data;
    await insertMessage({ name, email, content });
    return { status: "success", message: "Mensaje enviado a través de la Forja." };
  } catch (err) {
    console.error("[Minerva] sendContactMessageAction", err);
    return {
      status: "error",
      message: "La forja no pudo enviar tu mensaje. Probá de nuevo o escribime por correo.",
    };
  }
}
