import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MessageSchema, type Message } from "../schemas";

/**
 * Lectura de la bandeja de mensajes (Deméter, Iteración 22). SERVER-ONLY:
 * usa el cliente con cookies (la sesión del admin) porque RLS sólo deja
 * leer `public.messages` a usuarios autenticados. A propósito SIN
 * `unstable_cache`: son datos privados y dependen de la sesión — cachearlos
 * globalmente podría servirlos a otra request.
 */
export async function getMessages(options?: { limit?: number }): Promise<Message[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, name, email, content, created_at")
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 200);

  if (error) throw new Error(`No se pudo leer la bandeja de mensajes: ${error.message}`);

  return (data ?? []).map((row) =>
    MessageSchema.parse({
      id: row.id,
      name: row.name,
      email: row.email,
      content: row.content,
      createdAt: row.created_at,
    })
  );
}
