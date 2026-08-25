# syntax=docker/dockerfile:1.7
# ==============================================================================
# matches-dashboard — immagine di produzione (Node + PM2)
#
# L'app è una SPA (nuxt.config.ts → ssr: false) servita da un processo Node:
# `pnpm build` usa il preset Nitro `node-server`, che serve gli asset e fa da
# solo il fallback su index.html per le rotte dinamiche.
#
# Header di sicurezza, Cache-Control e compressione NON sono qui: vanno sul
# reverse proxy che termina il TLS davanti al container (vedi README.md).
#
# IL CONTEXT È LA ROOT DEL REPO, non questa cartella:
#
#   docker build -f docker/production/Dockerfile -t matches-dashboard:prod \
#     --build-arg NUXT_BASE_URL=https://api.matches.it \
#     --build-arg NUXT_PUBLIC_REVERB_HOST=reverb.matches.it \
#     --build-arg NUXT_PUBLIC_REVERB_SCHEME=https \
#     --build-arg NUXT_PUBLIC_REVERB_PORT=443 .
#
# ATTENZIONE: i NUXT_* vengono compilati DENTRO il bundle (finiscono nel payload
# di index.html). Un'immagine = un ambiente. L'unico repoint a runtime resta
# l'override localStorage `matches.api-override`.
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1 — build
# ------------------------------------------------------------------------------
FROM node:22-alpine AS build

# pnpm va pinnato a mano: package.json non ha né `packageManager` né `engines`.
# Serve pnpm 10 perché pnpm-workspace.yaml usa la sintassi `allowBuilds`.
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true \
    NODE_OPTIONS=--max-old-space-size=4096
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

WORKDIR /app

# --- Layer dipendenze (invalidato solo da lockfile/manifest) -------------------
# pnpm-workspace.yaml è obbligatorio: contiene gli `allowBuilds` senza i quali
# esbuild / unrs-resolver / @parcel/watcher non vengono compilati.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# --ignore-scripts è necessario: il postinstall è `nuxt prepare`, che a questo
# punto non ha ancora i sorgenti. I build script approvati girano dopo, con
# `pnpm rebuild`.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# --- Sorgenti -----------------------------------------------------------------
COPY . .
RUN pnpm rebuild

# --- Configurazione compilata nel bundle --------------------------------------
# Dichiarati DOPO l'install: cambiare un valore non invalida la cache dei moduli.
# I default replicano quelli di nuxt.config.ts.
#
# NOTA: la variabile dell'API è NUXT_BASE_URL (nuxt.config.ts:93), non
# NUXT_PUBLIC_SANCTUM_BASE_URL.
ARG NUXT_BASE_URL=https://api.matches.it
ARG NUXT_PUBLIC_ENV_SWITCHER_PASSWORD=
ARG NUXT_PUBLIC_REVERB_APP_KEY=
ARG NUXT_PUBLIC_REVERB_HOST=reverb.matches.it
ARG NUXT_PUBLIC_REVERB_PORT=
ARG NUXT_PUBLIC_REVERB_SCHEME=https

ENV NUXT_BASE_URL=$NUXT_BASE_URL \
    NUXT_PUBLIC_ENV_SWITCHER_PASSWORD=$NUXT_PUBLIC_ENV_SWITCHER_PASSWORD \
    NUXT_PUBLIC_REVERB_APP_KEY=$NUXT_PUBLIC_REVERB_APP_KEY \
    NUXT_PUBLIC_REVERB_HOST=$NUXT_PUBLIC_REVERB_HOST \
    NUXT_PUBLIC_REVERB_PORT=$NUXT_PUBLIC_REVERB_PORT \
    NUXT_PUBLIC_REVERB_SCHEME=$NUXT_PUBLIC_REVERB_SCHEME \
    NODE_ENV=production

# `build`, non `generate`: serve il server Nitro da dare in pasto a PM2.
RUN pnpm build

# ------------------------------------------------------------------------------
# Stage 2 — runtime
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runtime

# Niente label `version`: sarebbe una copia a mano di package.json e deriverebbe al
# primo `make release`. Se serve in CI, taggala sull'immagine (`-t …:$GIT_SHA`).
LABEL org.opencontainers.image.title="matches-dashboard" \
    org.opencontainers.image.description="Matches - Nuxt dashboard (Laravel REST API backend)"

RUN npm install -g pm2@6 && npm cache clean --force

WORKDIR /app

# PM2_HOME sotto /tmp: PM2 vuole una dir scrivibile per daemon, pid e log, e così
# l'immagine resta compatibile con rootfs in sola lettura
# (`--read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m`).
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    PM2_HOME=/tmp/.pm2

# .output è autosufficiente: Nitro ci bundla dentro le dipendenze, quindi qui non
# servono né node_modules né pnpm.
COPY --from=build --chown=node:node /app/.output ./.output
COPY --chown=node:node ecosystem.config.cjs ./

USER node

EXPOSE 3000

# busybox wget è già in alpine: nessun pacchetto extra da installare.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1

# `pm2-runtime`, non `pm2 start`: resta in foreground come PID 1 e inoltra i
# segnali. `pm2 start` esce subito e il container morirebbe.
CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]
