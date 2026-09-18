import { z } from "zod";

/** Message — mensaje del formulario de contacto (`public.messages`, 006_messages.sql). Dominio Deméter. */
export const MessageSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  content: z.string(),
  createdAt: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;
