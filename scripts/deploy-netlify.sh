#!/usr/bin/env bash
# Despliega a Netlify compilando en una copia del proyecto fuera del workspace.
# Motivo: en Windows, VS Code (servidor de TypeScript) abre .next/types y el plugin
# de Next.js de Netlify no puede renombrar .next ("Failed publishing static content").
# Uso: pnpm deploy:netlify
set -euo pipefail

ORIGEN="$(pwd)"
# Mismo disco que el proyecto (no C:), fuera del workspace de VS Code.
DESTINO="$(dirname "$ORIGEN")/cuida-tu-salud-deploy"

echo "Copiando el proyecto a $DESTINO"
mkdir -p "$DESTINO"
# Limpia todo menos node_modules (reutiliza la instalación entre despliegues).
find "$DESTINO" -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} +
tar --exclude=./node_modules --exclude=./.next --exclude=./.git --exclude=./.env \
  --exclude=./.netlify/functions-internal --exclude=./.netlify/static --exclude=./.netlify/plugins \
  -cf - . | tar -xf - -C "$DESTINO"

cd "$DESTINO"
pnpm install --frozen-lockfile
npx -y netlify-cli@latest deploy --prod
cd "$ORIGEN"
