# docker/production

Immagine di produzione della dashboard: **SPA Nuxt servita da un processo Node
supervisionato da PM2**.

| File                      | Ruolo                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------- |
| `Dockerfile`              | Build multi-stage: `node:22-alpine` (pnpm + `nuxt build`) → `node:22-alpine` + PM2. |
| `Dockerfile.dockerignore` | Esclusioni del build context (BuildKit lo associa automaticamente a `Dockerfile`).  |

La configurazione PM2 vive in **`ecosystem.config.cjs` alla root del repo**, così è
usabile anche fuori da Docker.

## Uso

```bash
# Il context è la ROOT del repo, non questa cartella.
docker build -f docker/production/Dockerfile -t matches-dashboard:prod \
  --build-arg NUXT_BASE_URL=https://api.matches.it \
  --build-arg NUXT_PUBLIC_REVERB_HOST=reverb.matches.it \
  --build-arg NUXT_PUBLIC_REVERB_SCHEME=https \
  --build-arg NUXT_PUBLIC_REVERB_PORT=443 \
  --build-arg NUXT_PUBLIC_REVERB_APP_KEY=... .

# In produzione, con l'hardening completo:
docker run -d -p 3000:3000 \
  --read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  --security-opt no-new-privileges:true \
  --cap-drop ALL \
  --restart unless-stopped \
  matches-dashboard:prod
```

Il container gira come utente `node` (uid 1000) sulla porta 3000. La tmpfs su `/tmp`
è obbligatoria: ci vive `PM2_HOME` (daemon, pid, log).

## Il reverse proxy non è opzionale

L'immagine serve **solo** l'applicazione. Tutto quello che prima faceva l'nginx
interno va ora configurato sul proxy che termina il TLS davanti al container:

- **header di sicurezza** (`X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, eventuale CSP/HSTS);
- **`Cache-Control`**: `public, max-age=31536000, immutable` su `/_nuxt/`,
  `no-cache, must-revalidate` sull'HTML — nell'HTML c'è il payload di
  `runtimeConfig`, quindi metterlo in cache significa SPA vecchia **e** config
  vecchia dopo un deploy;
- **compressione** (gzip/brotli).

Non serve invece alcun rewrite SPA: con il preset Nitro `node-server` il fallback su
`index.html` per le rotte dinamiche (`/admin/tournaments/42`) è nativo. Resta
necessario su Amplify, che serve i file statici.

Il dominio del proxy deve stare nella CORS allowlist dell'API Laravel e negli origin
consentiti da Reverb.

## In CI/CD

Il build ha bisogno di **BuildKit** (per la cache mount di pnpm) e di un context alla
root del repo. Ogni ambiente è un'immagine diversa, quindi i `--build-arg` vanno
passati dai secret/variable della pipeline, non dal repo.

```bash
DOCKER_BUILDKIT=1 docker build \
  -f docker/production/Dockerfile \
  -t "$REGISTRY/matches-dashboard:$GIT_SHA" \
  -t "$REGISTRY/matches-dashboard:latest" \
  --build-arg NUXT_BASE_URL="$API_BASE_URL" \
  --build-arg NUXT_PUBLIC_REVERB_HOST="$REVERB_HOST" \
  --build-arg NUXT_PUBLIC_REVERB_PORT="$REVERB_PORT" \
  --build-arg NUXT_PUBLIC_REVERB_SCHEME=https \
  --build-arg NUXT_PUBLIC_REVERB_APP_KEY="$REVERB_APP_KEY" \
  .
```

Due avvertenze per la pipeline:

- **`NUXT_PUBLIC_ENV_SWITCHER_PASSWORD` non è un segreto.** Finisce in chiaro nel
  bundle: trattalo come tale e non riusare una password che vale altrove.
- **`--frozen-lockfile` fa fallire il build se `pnpm-lock.yaml` è disallineato da
  `package.json`.** È voluto: correggi il lockfile, non il flag.
- La cache mount di pnpm vive nel BuildKit builder. Su runner effimeri non
  sopravvive tra un job e l'altro: se il tempo di build conta, usa una cache
  esterna (`--cache-from`/`--cache-to type=registry` o `type=gha`).

## Tre cose da sapere

**1. La configurazione è compilata nel bundle.** `NUXT_BASE_URL` e i `NUXT_PUBLIC_*`
finiscono nel payload di `index.html` in fase di build: **un'immagine = un ambiente**,
cambiarli richiede un nuovo build. L'unico repoint a runtime resta l'override
`localStorage` (`matches.api-override`) già presente nell'app. La variabile dell'API è
**`NUXT_BASE_URL`** (`nuxt.config.ts:93`), non `NUXT_PUBLIC_SANCTUM_BASE_URL`.

**2. `.output` è autosufficiente.** Nitro ci bundla dentro le dipendenze: lo stage di
runtime non installa `node_modules` né pnpm, copia solo `.output` e
`ecosystem.config.cjs`.

**3. `pm2-runtime`, non `pm2 start`.** `pm2-runtime` resta in foreground come PID 1 e
inoltra i segnali, quindi `docker stop` chiude subito; `pm2 start` esce e farebbe
morire il container. Per ispezionare: `docker exec <id> pm2 list`, `pm2 logs`.
