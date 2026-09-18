"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { type SocialLink } from "@/lib/demeter/schemas";
import { useAchievementsStore } from "@/lib/minerva/achievements-store";
import { cn } from "@/lib/utils";

interface FooterContactActionsProps {
  socialLinks: SocialLink[];
}

const COPIED_RESET_MS = 2000;

/**
 * FooterContactActions — Minerva/Hefesto (Iteración 13). Reemplaza el
 * `.map` estático de enlaces sociales que vivía inline en `Footer.tsx`
 * (Server Component) — es el único trozo del Footer que necesita
 * `"use client"`, por el logro "Contacto Establecido": se dispara al
 * copiar el correo (botón nuevo, `navigator.clipboard`) O al hacer click
 * en el link de LinkedIn — lo que pase primero, `unlock` es idempotente.
 *
 * El botón de copiar es funcional por derecho propio, no sólo un trigger
 * de logro disfrazado: da feedback visual real (`Copy` → `Check` por 2s) y
 * cae en silencio a `document.execCommand` si `navigator.clipboard` no
 * está disponible (contexto no seguro / navegador viejo) — nunca revienta
 * la página por un logro.
 */
export function FooterContactActions({ socialLinks }: FooterContactActionsProps) {
  const unlock = useAchievementsStore((state) => state.unlock);
  const [copied, setCopied] = useState(false);

  async function handleCopyEmail(rawEmail: string) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(rawEmail);
      } else {
        // Fallback para contextos sin Clipboard API (http no seguro, navegadores viejos).
        const textarea = document.createElement("textarea");
        textarea.value = rawEmail;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      unlock("contact-established");
      setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      // Copiar falló (permiso denegado, etc.) — el link mailto de al lado sigue funcionando igual.
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      {socialLinks.map((link) => {
        if (link.kind === "email") {
          const rawEmail = link.href.replace(/^mailto:/, "");
          return (
            <span key={link.href} className="inline-flex items-center gap-1.5">
              <a
                href={link.href}
                className="text-sm text-parchment-muted transition-colors duration-150 hover:text-parchment"
              >
                {link.label}
              </a>
              <button
                type="button"
                onClick={() => handleCopyEmail(rawEmail)}
                aria-label={copied ? "Correo copiado" : "Copiar correo"}
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded transition-colors duration-150",
                  copied ? "text-emerald-glow" : "text-parchment-muted/60 hover:text-parchment"
                )}
              >
                {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
              </button>
            </span>
          );
        }

        return (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            onClick={link.kind === "linkedin" ? () => unlock("contact-established") : undefined}
            className="text-sm text-parchment-muted transition-colors duration-150 hover:text-parchment"
          >
            {link.label}
          </a>
        );
      })}
    </div>
  );
}
