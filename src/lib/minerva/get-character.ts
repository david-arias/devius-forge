import { getCharacter as fetchCharacter } from "@/lib/demeter/queries/character";

/** Servicio de Minerva: expone el Character Sheet ya listo para Hefesto. No es un React Hook. */
export async function getCharacterForView() {
  return fetchCharacter();
}
