"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, Briefcase, GitBranch } from "lucide-react";
import { type BaseSyntheticEvent, type ReactNode, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button, Card, PreviewLink } from "@/components/hefesto/ui";
import { initialActionState } from "@/lib/minerva/actions/action-state";
import { saveSettingsAction } from "@/lib/minerva/actions/settings-actions";
import { useAdminToastStore } from "@/lib/minerva/admin-toast-store";
import { type GlobalSettings } from "@/lib/demeter/schemas";
import { SettingsFormSchema, type SettingsFormValues } from "./settings-form-schema";

interface SettingsFormProps {
  initialValues: GlobalSettings;
}

const inputClass =
  "w-full rounded-md border border-white/10 bg-obsidian/60 py-2 pl-10 pr-3 text-sm text-parchment placeholder:text-parchment-muted/50 focus-visible:border-gold-glow/50";

function IconField({
  id,
  label,
  hint,
  icon,
  error,
  children,
}: {
  id: string;
  label: string;
  hint: string;
  icon: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-parchment">
        {label}
      </label>
      <div className="relative">
        <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-parchment-muted">
          {icon}
        </span>
        {children}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className="text-xs text-parchment-muted/70">
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * SettingsForm — Hefesto (UI) + Minerva (lógica), Iteración 22.
 * Edita la fila única de `public.global_settings`: los 3 enlaces que el
 * sitio público muestra en Navbar, Footer, Hero y JSON-LD. Mismo patrón
 * que `CharacterForm` (`zodResolver` + `useActionState` + Toast del CMS).
 */
export function SettingsForm({ initialValues }: SettingsFormProps) {
  const pushToast = useAdminToastStore((state) => state.push);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(SettingsFormSchema),
    defaultValues: {
      email: initialValues.email ?? "",
      githubUrl: initialValues.githubUrl ?? "",
      linkedinUrl: initialValues.linkedinUrl ?? "",
    },
  });

  const [state, formAction, pending] = useActionState(saveSettingsAction, initialActionState);

  useEffect(() => {
    if (state.status === "idle" || !state.message) return;
    pushToast(state.status, state.message);
  }, [state, pushToast]);

  function onValid(values: SettingsFormValues, event?: BaseSyntheticEvent) {
    const form = event?.target as HTMLFormElement | undefined;
    if (!form) return;
    formAction(new FormData(form));
    // Los valores enviados pasan a ser la nueva "línea base" (isDirty = false).
    reset(values, { keepValues: true });
  }

  const describedBy = (field: keyof SettingsFormValues) =>
    errors[field] ? `${field}-error` : `${field}-hint`;

  return (
    <Card className="max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-parchment">Enlaces de contacto</h2>
          <p className="mt-1 text-sm text-parchment-muted">
            Dejá un campo vacío para ocultar ese enlace en todo el sitio.
          </p>
        </div>
        <PreviewLink slug="/" />
      </div>

      <form
        action={formAction}
        method="post"
        onSubmit={handleSubmit(onValid)}
        noValidate
        className="flex flex-col gap-5"
      >
        <IconField
          id="email"
          label="Correo"
          hint="Se usa en el CTA “Iniciar Quest”, el Footer y el menú mobile."
          icon={<AtSign className="h-4 w-4" />}
          error={errors.email?.message}
        >
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="hola@devius.dev"
            aria-invalid={!!errors.email}
            aria-describedby={describedBy("email")}
            className={inputClass}
            {...register("email")}
          />
        </IconField>

        <IconField
          id="githubUrl"
          label="GitHub"
          hint="URL completa del perfil, p. ej. https://github.com/tu-usuario"
          icon={<GitBranch className="h-4 w-4" />}
          error={errors.githubUrl?.message}
        >
          <input
            id="githubUrl"
            type="url"
            inputMode="url"
            placeholder="https://github.com/…"
            aria-invalid={!!errors.githubUrl}
            aria-describedby={describedBy("githubUrl")}
            className={inputClass}
            {...register("githubUrl")}
          />
        </IconField>

        <IconField
          id="linkedinUrl"
          label="LinkedIn"
          hint="URL completa del perfil, p. ej. https://www.linkedin.com/in/tu-usuario"
          icon={<Briefcase className="h-4 w-4" />}
          error={errors.linkedinUrl?.message}
        >
          <input
            id="linkedinUrl"
            type="url"
            inputMode="url"
            placeholder="https://www.linkedin.com/in/…"
            aria-invalid={!!errors.linkedinUrl}
            aria-describedby={describedBy("linkedinUrl")}
            className={inputClass}
            {...register("linkedinUrl")}
          />
        </IconField>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button type="submit" variant="cta" className="w-fit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar ajustes"}
          </Button>
          {isDirty && !pending && <span className="text-xs text-gold-glow">Cambios sin guardar</span>}
          {initialValues.updatedAt && (
            <span className="ml-auto text-xs text-parchment-muted/70">
              Última edición:{" "}
              {new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(
                new Date(initialValues.updatedAt)
              )}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
