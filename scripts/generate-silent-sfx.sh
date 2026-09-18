#!/usr/bin/env bash
# Apolo — Iteración 21. Genera .mp3 de silencio (150ms) en public/sfx/ para
# que el sistema de audio no produzca 404 mientras no existan los sonidos
# reales. Requiere ffmpeg (brew install ffmpeg). Después de correrlo,
# activá los SFX con NEXT_PUBLIC_SFX_ENABLED=true en .env.local / Vercel.
#
#   bash scripts/generate-silent-sfx.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/sfx

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "✖ ffmpeg no está instalado (macOS: brew install ffmpeg)." >&2
  exit 1
fi

for name in hover-whoosh click-anvil achievement-unlock; do
  out="public/sfx/${name}.mp3"
  if [ -f "$out" ]; then
    echo "• $out ya existe — no se pisa."
    continue
  fi
  ffmpeg -loglevel error -f lavfi -i anullsrc=r=44100:cl=mono -t 0.15 -q:a 9 -acodec libmp3lame "$out"
  echo "✔ $out"
done
