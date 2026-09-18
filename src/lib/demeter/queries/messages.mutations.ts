import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface NewMessageInput {
  name: string;
  email: string;
  content: string;
}

/**
 * Inserta un mensaje del formulario de contacto (Deméter, Iteración 21).
 * Tabla `public.messages` (`006_messages.sql`): INSERT público, SELECT sólo
 * autenticados. Por eso el insert NO pide `.select()` de vuelta — un
 * visitante anónimo no puede leer la fila que acaba de crear y el
 * `RETURNING` fallaría por RLS.
 */
export async function insertMessage(input: NewMessageInput): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("messages").insert({
    name: input.name,
    email: input.email,
    content: input.content,
  });
  if (error) throw new Error(`No se pudo guardar el mensaje: ${error.message}`);
}

/** Borra un mensaje (Iteración 22). RLS: sólo `authenticated` tiene DELETE. */
export async function deleteMessage(id: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error, count } = await supabase.from("messages").delete({ count: "exact" }).eq("id", id);
  if (error) throw new Error(`No se pudo eliminar el mensaje: ${error.message}`);
  // RLS no tira error si filtra la fila: devuelve 0 filas afectadas.
  if (count === 0) throw new Error("El mensaje no existe o no tenés permiso para borrarlo.");
}
