# 03 — Build, Run, Test

> Vedi anche: [08 — Configurazione e Env](08-configuration-env.md), [09 — Dipendenze](09-dependencies.md).

Il progetto usa [pnpm](https://pnpm.io) (un package manager Node veloce ed efficiente in termini di spazio su disco, ≈ npm con uno store content-addressable). `package.json` dichiara gli script standard di Nuxt; un `Makefile` racchiude i workflow più comuni.

## Prerequisiti

- Node.js 20 o successivo
- pnpm
- L'API Spring Boot raggiungibile all'URL indicato da `NUXT_PUBLIC_API_BASE` (default `http://localhost:8081`)

## Comandi di tutti i giorni

```bash
pnpm dev              # dev server con HMR su http://localhost:3000
pnpm build            # build di produzione → .output/public/ (file statici)
pnpm preview          # serve localmente la build prodotta
pnpm eslint . --fix   # lint con auto-fix
pnpm nuxi typecheck   # type-check dell'intero progetto
```

`pnpm dev` esegue Vite sotto il cofano (il bundler usato da Nuxt 4) e abilita l'Hot Module Replacement (≈ live-reload a livello di modulo, preservando dove possibile lo stato dei componenti).

## Convenzioni di progetto

- **Esegui sempre il lint al termine di una sessione di sviluppo** — il repo applica `@antfu/eslint-config` (apici singoli, niente punti e virgola, import ordinati). Vedi `eslint.config.mjs`. Il contratto è documentato in `CLAUDE.md`.
- **i18n italiano-first** — quando aggiungi una qualsiasi stringa visibile all'utente, aggiungi la chiave sia in `i18n/locales/it.json` sia in `i18n/locales/en.json`. Vedi [04](04-ui-navigation.md).
- **Niente test nel repo.** Non c'è alcun test runner configurato. Le modifiche UI si verificano a mano contro un'API in esecuzione.

## Build di produzione

`pnpm build` scrive `.output/public/` (una cartella di `index.html`, `.js` con hash, `.css` e asset statici). Dato che `ssr: false`, è *tutto* ciò che si deploya — nessun processo Node a runtime.

`NUXT_PUBLIC_API_BASE` viene letto **al momento della build** e incorporato nel bundle. Per cambiarlo successivamente serve una nuova build.

## Docker

Il repository contiene un `Dockerfile` multi-stage:

1. **Stage builder** — `node:20-alpine`, installa le dipendenze con pnpm, esegue `pnpm build`.
2. **Stage runtime** — `nginx:alpine`, copia `.output/public/` in `/usr/share/nginx/html/` e usa il `nginx.conf` incluso.

`nginx.conf` fa una cosa importante: `try_files $uri $uri/ /index.html;` — qualunque path sconosciuto ricade su `index.html` così Vue Router può risolvere le rotte lato client dopo un hard refresh.

```bash
docker build --build-arg NUXT_PUBLIC_API_BASE=https://api.example.com -t matches-dashboard .
docker run -p 8080:80 matches-dashboard
```

Il `Makefile` fornisce `make setup`, `make dev`, `make build`, `make docker-build` come scorciatoie.
