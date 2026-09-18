"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type BaseSyntheticEvent, useActionState, useEffect } from "react";
import Image from "next/image";
import { ImageIcon, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { ImageUploader } from "@/components/eter/ImageUploader";
import { Button, Card, PreviewLink } from "@/components/hefesto/ui";
import { saveCharacterAction } from "@/lib/minerva/actions/character-actions";
import { initialActionState } from "@/lib/minerva/actions/action-state";
import { useAdminToastStore } from "@/lib/minerva/admin-toast-store";
import { type Character } from "@/lib/demeter/schemas";
import { CharacterFormSchema, type CharacterFormValues } from "./character-form-schema";

interface CharacterFormProps {
  /** Valores iniciales — hoy viene de `getCharacter()` (Deméter). */
  initialValues?: Character;
}

/**
 * CharacterForm — Minerva, Iteración 15 ("Refinamiento de la Forja
 * Oculta"). Persiste de verdad (`saveCharacterAction`) contra
 * `public.character_sheet` (fila única `id = "default"`). Sin
 * `EntityActionsMenu`: a diferencia de Quests/Skills/Inventory, el
 * Character Sheet no es una colección — no hay nada que duplicar ni
 * eliminar, sólo editar la ficha existente.
 */
export function CharacterForm({ initialValues }: CharacterFormProps) {
  const pushToast = useAdminToastStore((state) => state.push);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CharacterFormValues>({
    resolver: zodResolver(CharacterFormSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      characterClass: initialValues?.characterClass ?? "",
      tagline: initialValues?.tagline ?? "",
      bio: initialValues?.bio.join("\n") ?? "",
      heroImageUrl: initialValues?.heroImageUrl ?? "",
    },
  });

  // Iteración 19 (ÉTER): preview en vivo del retrato del Hero.
  const heroImageUrl = watch("heroImageUrl");
  const setHeroImage = (url: string) =>
    setValue("heroImageUrl", url, { shouldDirty: true, shouldValidate: true });

  const [saveState, saveFormAction, savePending] = useActionState(saveCharacterAction, initialActionState);

  useEffect(() => {
    if (saveState.status === "idle" || !saveState.message) return;
    pushToast(saveState.status, saveState.message);
  }, [saveState, pushToast]);

  function onValidSubmit(_values: CharacterFormValues, event?: BaseSyntheticEvent) {
    const formEl = event?.target as HTMLFormElement | undefined;
    if (!formEl) return;
    saveFormAction(new FormData(formEl));
  }

  return (
    <Card className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-parchment">Character Sheet</h2>
        {/* El Character Sheet vive en la home, sin ancla propia — previsualiza "/" (Hefesto, Iteración 18). */}
        <PreviewLink slug="/" />
      </div>
      <form
        action={saveFormAction}
        method="post"
        onSubmit={handleSubmit(onValidSubmit)}
        className="flex flex-col gap-5"
        noValidate
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-parchment">
            Nombre
          </label>
          <input
            id="name"
            {...register("name")}
            className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
          />
          {errors.name && (
            <p role="alert" className="text-xs text-danger">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="characterClass" className="text-sm font-medium text-parchment">
            Clase (p.ej. &quot;Hybrid Forgemaster&quot;)
          </label>
          <input
            id="characterClass"
            {...register("characterClass")}
            className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
          />
          {errors.characterClass && (
            <p role="alert" className="text-xs text-danger">
              {errors.characterClass.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tagline" className="text-sm font-medium text-parchment">
            Tagline (exclusivo del Hero)
          </label>
          <input
            id="tagline"
            {...register("tagline")}
            className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
          />
          {errors.tagline && (
            <p role="alert" className="text-xs text-danger">
              {errors.tagline.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bio" className="text-sm font-medium text-parchment">
            Bio (un párrafo por línea — exclusivo del Character Sheet)
          </label>
          <textarea
            id="bio"
            rows={6}
            {...register("bio")}
            className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
          />
          {errors.bio && (
            <p role="alert" className="text-xs text-danger">
              {errors.bio.message}
            </p>
          )}
        </div>

        <fieldset className="flex flex-col gap-3 rounded-lg border border-white/10 bg-obsidian/40 p-4">
          <legend className="px-1 text-sm font-medium text-parchment">Retrato del Hero</legend>
          <p className="text-xs leading-relaxed text-parchment-muted">
            Idealmente un PNG sin fondo, vertical (≈ 4:5) y de al menos 1400px de alto. Se ubica
            entre el texto gigante del fondo y los títulos del frente.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {/* Preview sobre un fondo tipo "damero oscuro" para ver la transparencia del PNG */}
            <div className="relative flex aspect-[4/5] w-32 shrink-0 items-end justify-center overflow-hidden rounded-md border border-white/10 bg-[conic-gradient(#1a1a24_25%,#12121a_0_50%,#1a1a24_0_75%,#12121a_0)] bg-[length:16px_16px]">
              {heroImageUrl ? (
                <Image
                  src={heroImageUrl}
                  alt="Vista previa del retrato del Hero"
                  fill
                  sizes="128px"
                  className="object-contain object-bottom"
                />
              ) : (
                <ImageIcon className="mb-auto mt-auto h-6 w-6 text-parchment-muted/50" aria-hidden />
              )}
            </div>

            <div className="flex flex-1 flex-col gap-3">
              <ImageUploader folder="hero" onUploadComplete={setHeroImage} />

              <label htmlFor="heroImageUrl" className="text-xs text-parchment-muted">
                …o pegá una URL pública
              </label>
              <input
                id="heroImageUrl"
                type="url"
                placeholder="https://…supabase.co/storage/v1/object/public/quest-images/hero/…"
                {...register("heroImageUrl")}
                className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
              />
              {errors.heroImageUrl && (
                <p role="alert" className="text-xs text-danger">
                  {errors.heroImageUrl.message}
                </p>
              )}

              {heroImageUrl && (
                <button
                  type="button"
                  onClick={() => setHeroImage("")}
                  className="inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-xs text-parchment-muted transition-colors hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Quitar imagen
                </button>
              )}
            </div>
          </div>
        </fieldset>

        <Button type="submit" variant="cta" className="w-fit" disabled={savePending}>
          {savePending ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </Card>
  );
}
