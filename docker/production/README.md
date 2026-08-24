# docker/production

Immagine di produzione della dashboard: **SPA statica servita da nginx**, ~15 MB.

| File                      | Ruolo                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `Dockerfile`              | Build multi-stage: `node:22-alpine` (pnpm + `nuxt generate`) → `nginx:1.27-alpine-slim`. |
| `Dockerfile.dockerignore` | Esclusioni del build context (BuildKit lo associa automaticamente a `Dockerfile`).       |
| `nginx.conf`              | Contesto globale: path scrivibili sotto `/tmp`, log su stdout, `gzip_static`.            |
| `default.conf`            | Server virtuale: fallback SPA, policy di cache, health check.                            |
| `security-headers.conf`   | Header di sicurezza, inclusi in ogni `location` (vedi nota sotto).                       |

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
docker run -d -p 3000:8080 \
  --read-only --tmpfs /tmp:rw,noexec,nosuid,size=32m \
  --security-opt no-new-privileges:true \
  --cap-drop ALL --cap-add CHOWN --cap-add SETGID --cap-add SETUID \
  --restart unless-stopped \
  matches-dashboard:prod
```

### In CI/CD

Il build ha bisogno di **BuildKit** (per la cache mount di pnpm e l'heredoc) e di
un context alla root del repo. Ogni ambiente è un'immagine diversa, quindi i
`--build-arg` vanno passati dai secret/variable della pipeline, non dal repo.

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
  --build-arg APP_VERSION="$GIT_SHA" \
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

**1. La configurazione è compilata nel bundle.** `NUXT_BASE_URL` e i
`NUXT_PUBLIC_*` finiscono nel payload di `index.html` in fase di build: **un'immagine
= un ambiente**, cambiarli richiede un nuovo build. L'unico repoint a runtime resta
l'override `localStorage` (`matches.api-override`) già presente nell'app.
La variabile dell'API è **`NUXT_BASE_URL`** (`nuxt.config.ts:93`), non
`NUXT_PUBLIC_SANCTUM_BASE_URL` come riportato per errore in `CLAUDE.md`.

**2. Il fallback SPA è obbligatorio.** `nuxt generate` non emette nulla per le rotte
dinamiche (`/admin/tournaments/42`), che senza `try_files … /index.html` andrebbero in
404 al refresh. È lo stesso rewrite che su Amplify va configurato a mano.

**3. Gli header di sicurezza vanno ri-inclusi in ogni `location`.** In nginx un
`add_header` dentro una `location` annulla tutti quelli ereditati dal server block:
per questo `security-headers.conf` compare in ogni blocco che usa `add_header`.

## Hardening attivo

Utente `nginx` (uid 101) su porta non privilegiata 8080, rootfs in sola lettura
(`read_only: true` + tmpfs su `/tmp`), `no-new-privileges`, tutte le capability
eliminate tranne `CHOWN`/`SETGID`/`SETUID`, `server_tokens off`, nessun file `.env`
nell'immagine.

CSP e HSTS sono presenti ma **commentati** in `security-headers.conf`: la CSP
romperebbe l'env switcher (host API/Reverb variabili), l'HSTS va impostato dove
termina il TLS. Attivali per-ambiente compilando gli host reali.
