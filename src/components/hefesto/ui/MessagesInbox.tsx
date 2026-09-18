"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Copy, Check, Inbox, Mail, Reply, Search, Trash2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import { type Message } from "@/lib/demeter/schemas";
import { initialActionState } from "@/lib/minerva/actions/action-state";
import { deleteMessageAction } from "@/lib/minerva/actions/message-actions";
import { useAdminToastStore } from "@/lib/minerva/admin-toast-store";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyState } from "./EmptyState";

interface MessagesInboxProps {
  messages: Message[];
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const fullDate = new Intl.DateTimeFormat("es", { dateStyle: "full", timeStyle: "short" });
const shortDate = new Intl.DateTimeFormat("es", { day: "numeric", month: "short" });
const timeOnly = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" });

/** "14:32" si es de hoy, "12 sept" si no. */
function relativeStamp(iso: string, now: Date) {
  const date = new Date(iso);
  return date.toDateString() === now.toDateString() ? timeOnly.format(date) : shortDate.format(date);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/**
 * MessagesInbox — Hefesto, Iteración 22 ("El Buzón de la Forja").
 * Lista tipo bandeja: avatar con iniciales, remitente, correo, vista
 * previa de una línea y fecha. Cada fila es un botón con
 * `aria-expanded` que despliega el mensaje completo (altura animada) con
 * acciones: Responder (mailto con asunto), Copiar correo y Eliminar
 * (con `ConfirmDialog`). Buscador en cliente por nombre/correo/texto.
 *
 * El borrado es optimista: la fila desaparece al confirmar; si el
 * Server Action falla, vuelve y se muestra el Toast de error.
 */
export function MessagesInbox({ messages }: MessagesInboxProps) {
  const reduce = useReducedMotion();
  const pushToast = useAdminToastStore((state) => state.push);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Message | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [now] = useState(() => new Date());

  const [state, deleteAction, deleting] = useActionState(deleteMessageAction, initialActionState);

  useEffect(() => {
    if (state.status === "idle" || !state.message) return;
    pushToast(state.status, state.message);
    if (state.status === "error") {
      // Revertir el borrado optimista.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reflejo directo del resultado del Server Action.
      setHiddenIds(new Set());
    }
  }, [state, pushToast]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages
      .filter((message) => !hiddenIds.has(message.id))
      .filter(
        (message) =>
          !q ||
          message.name.toLowerCase().includes(q) ||
          message.email.toLowerCase().includes(q) ||
          message.content.toLowerCase().includes(q)
      );
  }, [messages, hiddenIds, query]);

  function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    const formData = new FormData();
    formData.set("id", id);
    setHiddenIds((prev) => new Set(prev).add(id));
    if (openId === id) setOpenId(null);
    setPendingDelete(null);
    startTransition(() => deleteAction(formData));
  }

  async function copyEmail(message: Message) {
    try {
      await navigator.clipboard.writeText(message.email);
      setCopiedId(message.id);
      setTimeout(() => setCopiedId((current) => (current === message.id ? null : current)), 1800);
    } catch {
      pushToast("error", "No se pudo copiar el correo.");
    }
  }

  const total = messages.length - hiddenIds.size;

  if (total === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="El buzón está vacío"
        description="Cuando alguien te escriba desde el formulario del sitio, el pergamino aparecerá acá."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-parchment-muted" aria-live="polite">
          {total} mensaje{total === 1 ? "" : "s"}
          {query && ` · ${visible.length} coincidencia${visible.length === 1 ? "" : "s"}`}
        </p>
        <label className="relative sm:w-72">
          <span className="sr-only">Buscar mensajes</span>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-parchment-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, correo o texto…"
            className="w-full rounded-md border border-white/10 bg-obsidian/60 py-2 pl-9 pr-3 text-sm text-parchment placeholder:text-parchment-muted/50 focus-visible:border-gold-glow/50"
          />
        </label>
      </div>

      <ul className="overflow-hidden rounded-xl border border-white/10 bg-obsidian-soft/50">
        <AnimatePresence initial={false}>
          {visible.map((message) => {
            const open = openId === message.id;
            const panelId = `message-panel-${message.id}`;
            return (
              <motion.li
                key={message.id}
                layout={!reduce}
                initial={false}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                className={cn(
                  "border-b border-white/5 last:border-b-0",
                  open && "bg-white/[0.03] shadow-[inset_2px_0_0_0_var(--color-gold-glow)]"
                )}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenId(open ? null : message.id)}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-white/[0.03] sm:px-5"
                >
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-glow/30 bg-gold-glow/10 font-display text-sm text-gold-glow"
                  >
                    {initials(message.name) || "?"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="truncate font-medium text-parchment">{message.name}</span>
                      <span className="hidden truncate text-xs text-parchment-muted sm:inline">{message.email}</span>
                    </span>
                    <span className={cn("mt-0.5 block truncate text-sm text-parchment-muted", open && "invisible")}>
                      {message.content}
                    </span>
                  </span>
                  <time
                    dateTime={message.createdAt}
                    title={fullDate.format(new Date(message.createdAt))}
                    className="shrink-0 text-xs tabular-nums text-parchment-muted"
                  >
                    {relativeStamp(message.createdAt, now)}
                  </time>
                  <ChevronDown
                    aria-hidden
                    className={cn("h-4 w-4 shrink-0 text-parchment-muted transition-transform duration-300", open && "rotate-180")}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-label={`Mensaje de ${message.name}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduce ? 0 : 0.35, ease: EASE_OUT_EXPO }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-5 sm:pl-[4.75rem] sm:pr-5">
                        <dl className="mb-4 grid gap-x-6 gap-y-1 text-xs text-parchment-muted sm:grid-cols-[auto_1fr]">
                          <dt className="font-medium uppercase tracking-[0.18em]">De</dt>
                          <dd className="text-parchment">
                            {message.name} &lt;{message.email}&gt;
                          </dd>
                          <dt className="font-medium uppercase tracking-[0.18em]">Recibido</dt>
                          <dd className="text-parchment">{fullDate.format(new Date(message.createdAt))}</dd>
                        </dl>
                        <p className="whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-obsidian/60 p-4 text-sm leading-relaxed text-parchment/90">
                          {message.content}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <a
                            href={`mailto:${message.email}?subject=${encodeURIComponent("Re: tu mensaje en Devius")}`}
                            className="inline-flex items-center gap-2 rounded-md border border-emerald-glow/30 bg-emerald-glow/10 px-3 py-2 text-xs font-medium text-emerald-glow transition-colors hover:bg-emerald-glow/20"
                          >
                            <Reply className="h-3.5 w-3.5" aria-hidden />
                            Responder
                          </a>
                          <button
                            type="button"
                            onClick={() => copyEmail(message)}
                            className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs text-parchment-muted transition-colors hover:text-parchment"
                          >
                            {copiedId === message.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-glow" aria-hidden />
                            ) : (
                              <Copy className="h-3.5 w-3.5" aria-hidden />
                            )}
                            {copiedId === message.id ? "Copiado" : "Copiar correo"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(message)}
                            disabled={deleting}
                            className="ml-auto inline-flex items-center gap-2 rounded-md border border-danger/30 px-3 py-2 text-xs font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </AnimatePresence>
        {visible.length === 0 && (
          <li className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-parchment-muted">
            <Mail className="h-4 w-4" aria-hidden />
            Ningún mensaje coincide con “{query}”.
          </li>
        )}
      </ul>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="¿Eliminar este mensaje?"
        description={
          pendingDelete
            ? `El mensaje de ${pendingDelete.name} se borrará para siempre. Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar mensaje"
        pending={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
