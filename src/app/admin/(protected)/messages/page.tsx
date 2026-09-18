import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState, MessagesInbox } from "@/components/hefesto/ui";
import { getMessages } from "@/lib/demeter/queries/messages";
import { type Message } from "@/lib/demeter/schemas";

export const metadata: Metadata = { title: "Buzón", robots: { index: false } };

/**
 * `/admin/messages` — Iteración 22 ("El Buzón de la Forja").
 * Server Component: lee `public.messages` con la sesión del admin
 * (`getMessages`, sin caché) y se lo pasa a `MessagesInbox` (cliente).
 * Si la tabla no existe todavía (falta `006_messages.sql`) o Supabase
 * falla, muestra un aviso en vez de romper el panel.
 */
export default async function AdminMessagesPage() {
  let messages: Message[] = [];
  let loadError: string | null = null;
  try {
    messages = await getMessages();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Error desconocido.";
  }

  return (
    <div className="mx-auto max-w-4xl">
      <p className="mb-1 text-xs uppercase tracking-[0.3em] text-gold-glow">Bandeja de entrada</p>
      <h1 className="mb-2 font-display text-2xl text-parchment">El Buzón de la Forja</h1>
      <p className="mb-8 text-sm text-parchment-muted">
        Pergaminos enviados desde el formulario de contacto del sitio, del más reciente al más antiguo.
      </p>

      {loadError ? (
        <EmptyState
          icon={AlertTriangle}
          title="No se pudo abrir el buzón"
          description={`${loadError} ¿Ya corriste 006_messages.sql en Supabase?`}
        />
      ) : (
        <MessagesInbox messages={messages} />
      )}
    </div>
  );
}
