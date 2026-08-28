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

- **header di sicurezza** — la configurazione attesa è nella sezione qui sotto;
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

## Header di sicurezza attesi

Gli header di sicurezza sono righe che il proxy allega alla risposta e che il **browser**
usa per autolimitarsi. Non sono codice applicativo: non stanno in Nuxt, stanno qui. Sono
documentati in questo file proprio perché il repo, da solo, non permette di verificare se
sul proxy ci siano o no.

Configurazione di riferimento (nginx; su un altro proxy cambia solo la sintassi):

```nginx
add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https: wss:" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header X-Robots-Tag "noindex, nofollow" always;
```

Cosa fa ognuno, e perché serve **a questa** app:

| Header                                   | Dice al browser                                           | Impedisce                                                                                                                                                                                                                                  |
| ---------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Content-Security-Policy`                | da dove può caricare script e verso chi può connettersi   | l'esecuzione di JavaScript iniettato (XSS) — vedi la nota sul token qui sotto                                                                                                                                                              |
| `frame-ancestors 'none'` (dentro la CSP) | nessun sito può incorporare la dashboard in un iframe     | clickjacking: un sito terzo che sovrappone la dashboard invisibile e fa cliccare azioni admin                                                                                                                                              |
| `X-Content-Type-Options: nosniff`        | fidati del `Content-Type` dichiarato, non indovinarlo     | un upload servito come immagine ma eseguito come script                                                                                                                                                                                    |
| `Referrer-Policy`                        | non rivelare l'URL di partenza uscendo verso altri domini | fuga di URL interni (`/admin/tournaments/42`) verso siti terzi                                                                                                                                                                             |
| `Strict-Transport-Security`              | da adesso parlami solo in https                           | il downgrade a http su una rete non fidata                                                                                                                                                                                                 |
| `Permissions-Policy`                     | niente camera, microfono, geolocalizzazione               | uso di API sensibili che l'app non chiede mai                                                                                                                                                                                              |
| `X-Robots-Tag`                           | non indicizzare nulla di questo sito                      | i nomi degli atleti (anche minori) nei risultati di ricerca — vedi `docs/security-issues` #7. Ridondante con `public/robots.txt` e col `noindex` in `nuxt.config.ts`, ma è il solo presidio che non dipende da un file servito o dall'HTML |

**Perché la CSP è la più importante.** Il token Bearer sta in un cookie leggibile da
JavaScript, e non è evitabile: in `mode: 'token'` il client deve leggerlo per comporre
l'header `Authorization` (`app/utils/authToken.ts`). Quindi qualunque JS ostile che
finisca nella pagina — un XSS, una dipendenza npm compromessa — esfiltra il token con una
riga. `script-src 'self'` è la sola misura che impedisce a quello script di partire.
Dettagli in `docs/security-issues/README.md` (punto 1 e punto 3).

Due scelte deliberate nello snippet sopra:

- **`connect-src 'self' https: wss:` è volutamente permissivo.** L'app permette di
  ripuntare il base URL a runtime (override `matches.api-override`, requisito operativo:
  ambienti di test, tunnel, IP in LAN). Elencare gli host noti — `connect-src 'self'
https://api.matches.it wss://reverb.matches.it` — romperebbe quella funzione. Il prezzo
  è che la CSP non blocca l'esfiltrazione verso un server arbitrario; resta intatta la
  parte che conta di più, cioè impedire allo script ostile di esistere. Se un giorno
  l'override libero non servisse più, stringere questa direttiva è il primo upgrade.
- **`style-src 'unsafe-inline'` è debito, non un default.** Oggi serve a Nuxt UI /
  Tailwind. Va rimosso appena possibile, non copiato altrove.

Per verificare che il proxy li stia davvero mandando:

```bash
curl -sI https://dashboard.matches.it/ | grep -iE 'content-security|x-content-type|referrer|strict-transport|permissions'
```

Su **Amplify** questi header non li mette nessun proxy: vanno replicati a mano nella
console (Custom headers), insieme al rewrite SPA su `/index.html`.

## In CI/CD

La pipeline vive in **`.forgejo/workflows/docker-publish.yml`**: a ogni push su `main`
(o via `workflow_dispatch`) builda questa immagine e la pubblica su Docker Hub come
`<DOCKERHUB_USERNAME>/matches-dashboard:latest` + `:<short-sha>`. Gira sul runner con
label `docker-29-cli`.

Da configurare nel pannello Forgejo:

| Nome                                | Tipo     |
| ----------------------------------- | -------- |
| `DOCKERHUB_USERNAME`                | Variable |
| `DOCKERHUB_TOKEN`                   | Secret   |
| `NUXT_BASE_URL`                     | Variable |
| `NUXT_PUBLIC_REVERB_HOST`           | Variable |
| `NUXT_PUBLIC_REVERB_PORT`           | Variable |
| `NUXT_PUBLIC_REVERB_SCHEME`         | Variable |
| `NUXT_PUBLIC_REVERB_APP_KEY`        | Secret   |
| `NUXT_PUBLIC_ENV_SWITCHER_PASSWORD` | Secret   |

Un `NUXT_*` non definito degrada sul default dell'`ARG` nel Dockerfile, non rompe il
build. Il login usa comunque `--password-stdin`, così il token non finisce in una riga
di comando nei log.

Il build ha bisogno di **BuildKit** (per la cache mount di pnpm) e di un context alla
root del repo. Ogni ambiente è un'immagine diversa, quindi i `--build-arg` vanno
passati dai secret/variable della pipeline, non dal repo. A mano:

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
