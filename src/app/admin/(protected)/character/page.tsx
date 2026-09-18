import { getCharacter } from "@/lib/demeter/queries/character";
import { CharacterForm } from "@/lib/minerva/forms/CharacterForm";

/**
 * `/admin/character` — Minerva, Iteración 14. Server Component: obtiene
 * el `Character` actual vía `getCharacter()` (Deméter, misma fuente que
 * consume la home pública) y lo pasa como `initialValues` al form
 * (Client Component) para pre-completar los campos.
 */
export default async function AdminCharacterPage() {
  const character = await getCharacter();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl text-parchment">Character Sheet</h1>
      <CharacterForm initialValues={character ?? undefined} />
    </div>
  );
}
