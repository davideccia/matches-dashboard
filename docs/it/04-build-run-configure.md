# 04 — Build, avvio e configurazione

> Vedi anche: [01 — Panoramica](01-overview.md), [09 — Tabellone in tempo reale](09-realtime-scoreboard.md)

Questo capitolo spiega come far girare l'app in locale, come si configura e come si impacchetta per la produzione. La sintesi dei comandi è anche in [`CLAUDE.md`](../../CLAUDE.md) e [`README.md`](../../README.md); qui aggiungiamo il *perché*.

## Comandi

```bash
pnpm dev              # server di sviluppo su http://localhost:3000
pnpm build            # build di produzione → .output/public/ (statico, ssr: false)
pnpm preview          # serve la build in locale
pnpm eslint . --fix   # lint + auto-fix (da eseguire a fine di ogni sessione)
pnpm nuxi typecheck   # controllo dei tipi TypeScript
```

> A fine sessione di sviluppo, [`CLAUDE.md`](../../CLAUDE.md) chiede di lanciare sempre `pnpm eslint . --fix` e di segnalare gli errori non auto-correggibili.

## `ssr: false`: cosa significa davvero

In [`nuxt.config.ts`](../../nuxt.config.ts) (riga 5) c'è `ssr: false`. Disattiva il *Server-Side Rendering*: Nuxt **non** genera un server Node che produce HTML a ogni richiesta. La build produce invece un insieme di **file statici** (HTML/JS/CSS) in `.output/public/`, serviti da un qualsiasi web server (qui nginx).

Da qui discende la regola più importante per la configurazione:

> [!IMPORTANT]
> Tutte le variabili `NUXT_PUBLIC_*` vengono **incorporate nel bundle in fase di build**, non lette a runtime. Devono essere impostate *prima* di `pnpm build` o `docker build`. Cambiarle dopo la build non ha effetto: bisogna ricostruire.

Il motivo: senza un server, non c'è nessuno che a runtime legga le variabili d'ambiente del processo; l'unico momento in cui esistono è durante la build.

## Variabili d'ambiente

Definite in [`nuxt.config.ts`](../../nuxt.config.ts) sotto `runtimeConfig.public` (righe 32-41), con i rispettivi default:

| Variabile | Default | Scopo |
|-----------|---------|-------|
| `NUXT_PUBLIC_API_BASE` | `http://localhost:8081` | URL base dell'API Laravel |
| `NUXT_PUBLIC_WS_BASE` | `` (vuoto) | Base WebSocket alternativa (attualmente non usata nel codice) |
| `NUXT_PUBLIC_REVERB_APP_KEY` | `` (vuoto) | Chiave dell'app Reverb |
| `NUXT_PUBLIC_REVERB_HOST` | `localhost` | Host WebSocket di Reverb |
| `NUXT_PUBLIC_REVERB_PORT` | `8080` | Porta WebSocket di Reverb |
| `NUXT_PUBLIC_REVERB_SCHEME` | `http` | `http` oppure `https` |

`NUXT_PUBLIC_API_BASE` viene riusato anche dalla configurazione di Sanctum come `baseUrl` ([`nuxt.config.ts`](../../nuxt.config.ts) riga 71). Le variabili Reverb alimentano il plugin Echo (vedi [Capitolo 09](09-realtime-scoreboard.md)).

Per puntare a un backend su una porta diversa in sviluppo:

```bash
NUXT_PUBLIC_API_BASE=http://localhost:9090 pnpm dev
```

## Build di produzione e Docker

`pnpm build` produce un sito statico in `.output/public/` — nessun server Node necessario a runtime. Il percorso consigliato è l'immagine Docker inclusa:

```bash
docker build \
  --build-arg NUXT_PUBLIC_API_BASE=https://api.example.com \
  -t matches-dashboard .

docker run -p 80:80 matches-dashboard
```

Il [`Dockerfile`](../../Dockerfile) è multi-stage: prima compila l'app con Node, poi serve l'output statico da `nginx:alpine`. L'URL dell'API si passa come *build arg* perché — come spiegato sopra — deve essere noto al momento della build.

### Routing SPA in nginx

Il [`nginx.conf`](../../nginx.conf) gestisce il routing della SPA con `try_files … /index.html`. Senza questa regola, un *hard refresh* su un URL profondo come `/admin/tournaments` darebbe 404: nginx cercherebbe un file `/admin/tournaments` che non esiste. Con `try_files`, qualsiasi percorso non trovato cade su `index.html`, e poi il router di Vue lato client risolve la rotta corretta.

> [!IMPORTANT]
> Sia l'API Laravel sia l'endpoint WebSocket di Reverb devono essere raggiungibili **dal browser** agli indirizzi configurati nelle `NUXT_PUBLIC_*`, altrimenti login e funzioni live non funzionano.
