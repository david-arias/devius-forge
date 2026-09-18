"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Flame, Loader2, Send, X } from "lucide-react";
import { type BaseSyntheticEvent, useActionState, useEffect, useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { initialActionState } from "@/lib/minerva/actions/action-state";
import { sendContactMessageAction } from "@/lib/minerva/actions/contact-actions";
import { useAchievementsStore } from "@/lib/minerva/achievements-store";
import { ContactFormSchema, type ContactFormValues } from "@/lib/minerva/forms/contact-form-schema";
import { trackForgeEvent } from "@/lib/minerva/telemetry";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

const TOAST_MS = 5000;
const subscribeNoop = () => () => {};
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

/** Etiqueta + control + error, con `aria-describedby` cableado por el padre. */
function Field({ id, label, error, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-parchment-muted">
        {label}
      </label>
      {children}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-danger"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * ContactForm — Hefesto (UI) + Minerva (lógica), Iteración 21.
 * `react-hook-form` + `zodResolver` validan en cliente; el envío va a
 * `sendContactMessageAction` (Server Action) que revalida e inserta en
 * `public.messages`. `<form action>` + `method="post"` = funciona aun si
 * el JS no hidrata (mismo patrón que los formularios del CMS).
 *
 * Toast "épico": montado vía portal (fixed, abajo a la izquierda — la derecha es de los Logros), con
 * `role="status"` para que el lector de pantalla lo anuncie.
 */
export function ContactForm({ className }: { className?: string }) {
  const baseId = useId();
  const reduce = useReducedMotion();
  const unlock = useAchievementsStore((state) => state.unlock);
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string; key: number } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: { name: "", email: "", content: "", website: "" },
  });

  const [state, formAction, pending] = useActionState(sendContactMessageAction, initialActionState);

  useEffect(() => {
    if (state.status === "idle" || !state.message) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el toast es un reflejo directo del resultado del Server Action.
    setToast({ kind: state.status, message: state.message, key: Date.now() });
    if (state.status === "success") {
      trackForgeEvent("contact_message_sent", { source: "footer_form" });
      reset();
      unlock("contact-established");
    }
  }, [state, reset, unlock]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  function onValid(_values: ContactFormValues, event?: BaseSyntheticEvent) {
    const form = event?.target as HTMLFormElement | undefined;
    if (form) formAction(new FormData(form));
  }

  const ids = {
    name: `${baseId}-name`,
    email: `${baseId}-email`,
    content: `${baseId}-content`,
  };

  return (
    <>
      <form
        action={formAction}
        method="post"
        onSubmit={handleSubmit(onValid)}
        noValidate
        aria-label="Formulario de contacto"
        className={cn("grid grid-cols-1 gap-5 sm:grid-cols-2", className)}
      >
        <Field id={ids.name} label="Nombre" error={errors.name?.message}>
          <input
            id={ids.name}
            autoComplete="name"
            placeholder="Tu nombre"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? `${ids.name}-error` : undefined}
            className="forge-input"
            {...register("name")}
          />
        </Field>

        <Field id={ids.email} label="Correo" error={errors.email?.message}>
          <input
            id={ids.email}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="tu@correo.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? `${ids.email}-error` : undefined}
            className="forge-input"
            {...register("email")}
          />
        </Field>

        <Field id={ids.content} label="Mensaje" error={errors.content?.message} className="sm:col-span-2">
          <textarea
            id={ids.content}
            rows={5}
            placeholder="Contame sobre tu próxima Quest…"
            aria-invalid={!!errors.content}
            aria-describedby={errors.content ? `${ids.content}-error` : undefined}
            className="forge-input resize-y"
            {...register("content")}
          />
        </Field>

        {/* Honeypot — fuera de pantalla, fuera del orden de tabulación y oculto a lectores. */}
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor={`${baseId}-website`}>No completar</label>
          <input id={`${baseId}-website`} tabIndex={-1} autoComplete="off" {...register("website")} />
        </div>

        <div className="flex flex-col-reverse items-start gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-parchment-muted/80">Respondo en menos de 48 h. Sin spam, nunca.</p>
          <Button type="submit" variant="cta" disabled={pending} className="gap-2 px-6 py-3">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
            {pending ? "Forjando…" : "Enviar mensaje"}
          </Button>
        </div>
      </form>

      {/* Toast de la Forja — portal a <body>: la carta del Footer usa `backdrop-filter`,
          que convierte a cualquier `position: fixed` descendiente en relativo a ella. */}
      {mounted && createPortal(
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex justify-start sm:inset-x-auto sm:left-6">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.key}
              role="status"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
              className={cn(
                "pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border bg-obsidian-soft/95 p-4 pr-10 shadow-2xl backdrop-blur-xl",
                toast.kind === "success" ? "border-gold-glow/40" : "border-danger/40"
              )}
            >
              {toast.kind === "success" && (
                <span aria-hidden className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-gold-glow/20 blur-2xl" />
              )}
              <span
                className={cn(
                  "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                  toast.kind === "success"
                    ? "border-gold-glow/40 bg-gold-glow/10 text-gold-glow"
                    : "border-danger/40 bg-danger/10 text-danger"
                )}
              >
                {toast.kind === "success" ? (
                  <Flame className="h-4 w-4" aria-hidden />
                ) : (
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                )}
              </span>
              <div className="relative">
                <p className="font-display text-sm text-parchment">
                  {toast.kind === "success" ? "¡Mensaje forjado!" : "La forja se enfrió"}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-parchment-muted">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="Cerrar notificación"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-parchment-muted transition-colors hover:text-parchment"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
              {/* Barra de tiempo restante */}
              <motion.span
                aria-hidden
                className={cn(
                  "absolute inset-x-0 bottom-0 h-0.5 origin-left",
                  toast.kind === "success" ? "bg-gold-glow" : "bg-danger"
                )}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: TOAST_MS / 1000, ease: "linear" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </div>,
        document.body
      )}
    </>
  );
}
