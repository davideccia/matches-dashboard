# syntax=docker/dockerfile:1.7
# ==============================================================================
# matches-dashboard — immagine di produzione (~15 MB)
#
# L'app è una SPA statica (nuxt.config.ts → ssr: false): `pnpm generate` emette
# solo file in .output/public, quindi a runtime non serve alcun processo Node.
# L'immagine finale contiene nginx + gli asset, e nulla di più.
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
# NUXT_PUBLIC_SANCTUM_BASE_URL come riportato per errore in CLAUDE.md.
ARG NUXT_BASE_URL=https://api.matches.it
ARG NUXT_PUBLIC_ENV_SWITCHER_PASSWORD=
ARG NUXT_PUBLIC_REVERB_APP_KEY=
ARG NUXT_PUBLIC_REVERB_HOST=localhost
ARG NUXT_PUBLIC_REVERB_PORT=8080
ARG NUXT_PUBLIC_REVERB_SCHEME=http

ENV NUXT_BASE_URL=$NUXT_BASE_URL \
    NUXT_PUBLIC_ENV_SWITCHER_PASSWORD=$NUXT_PUBLIC_ENV_SWITCHER_PASSWORD \
    NUXT_PUBLIC_REVERB_APP_KEY=$NUXT_PUBLIC_REVERB_APP_KEY \
    NUXT_PUBLIC_REVERB_HOST=$NUXT_PUBLIC_REVERB_HOST \
    NUXT_PUBLIC_REVERB_PORT=$NUXT_PUBLIC_REVERB_PORT \
    NUXT_PUBLIC_REVERB_SCHEME=$NUXT_PUBLIC_REVERB_SCHEME \
    NODE_ENV=production

# `generate`, non `build`: con ssr:false e nessun preset nitro, `nuxt build`
# emetterebbe comunque una .output/server Node che qui non servirebbe a nulla.
RUN pnpm generate

# Pre-compressione per `gzip_static`: nginx serve il .gz già pronto, zero CPU a
# runtime. Niente brotli: non è compilato in nginx stock.
RUN find .output/public -type f \
      \( -name '*.js' -o -name '*.mjs' -o -name '*.css' -o -name '*.html' \
         -o -name '*.svg' -o -name '*.json' -o -name '*.txt' \) \
      -size +1k -exec gzip -9 -k {} \;

# ------------------------------------------------------------------------------
# Stage 2 — runtime
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine-slim AS runtime

ARG APP_VERSION=0.8.0
LABEL org.opencontainers.image.title="matches-dashboard" \
      org.opencontainers.image.description="Static SPA dashboard for the Matches Laravel API" \
      org.opencontainers.image.source="https://codeberg.org/davideccia/matches-dashboard-laravel" \
      org.opencontainers.image.version="$APP_VERSION"

COPY docker/production/nginx.conf            /etc/nginx/nginx.conf
COPY docker/production/security-headers.conf /etc/nginx/security-headers.conf
COPY docker/production/default.conf          /etc/nginx/conf.d/default.conf

# Asset statici generati nello stage precedente.
COPY --from=build --chown=nginx:nginx /app/.output/public /usr/share/nginx/html

# Directory temporanee pre-create e possedute da nginx. Stanno sotto /tmp perché
# è ciò che permette di girare con rootfs in sola lettura: in quel caso monta
# /tmp su tmpfs (`--read-only --tmpfs /tmp:rw,noexec,nosuid,size=32m`).
RUN mkdir -p /tmp/nginx-client-body /tmp/nginx-proxy /tmp/nginx-fastcgi \
             /tmp/nginx-uwsgi /tmp/nginx-scgi \
    && chown -R nginx:nginx /tmp/nginx-* /var/cache/nginx \
    && nginx -t

USER nginx

EXPOSE 8080

# busybox wget è già in alpine: nessun pacchetto extra da installare.
HEALTHCHECK --interval=30s --timeout=3s --start-period=3s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
