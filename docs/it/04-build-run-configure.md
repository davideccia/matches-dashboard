# 04 — Build, avvio e configurazione

## Prerequisiti

- **Node.js 20+** (la build Docker usa Node 22).
- **pnpm** — il gestore di pacchetti. Abilitalo con `corepack enable pnpm` se non lo hai.
- **Un backend Laravel in esecuzione** raggiungibile dal browser (default `http://localhost:8081`). Senza di esso le pagine si caricano ma ogni richiesta di dati fallisce.

## Configurazione iniziale

Usando il [`Makefile`](../../Makefile) fornito:

```bash
make setup    # copia .env.example → .env (se manca) ed esegue pnpm install
```

Oppure manualmente:

```bash
pnpm install
```

## Comandi di tutti i giorni

Provengono dagli script di [`package.json`](../../package.json) e dal [`Makefile`](../../Makefile):

| Comando | Alias Makefile | Cosa fa |
|---------|----------------|---------|
| `pnpm dev` | `make dev` (`--host 127.0.0.1`) | Avvia il server di sviluppo su `http://localhost:3000` con hot reload |
| — | `make host` (`--host 0.0.0.0`) | Idem, ma esposto sulla LAN / per Docker |
| `pnpm build` | `make build` | Build di produzione → file statici in `.output/public/` |
| `pnpm preview` | `make preview` | Serve localmente l'output costruito per verificarlo |
| `pnpm eslint . --fix` | `make lint-fix` | Esegue lint con auto-fix. **Eseguilo dopo ogni sessione di codice.** |
| `pnpm nuxi typecheck` | `make typecheck` | Controlla i tipi dell'intero progetto |
| — | `make clean` | Rimuove `.nuxt`, `.output`, `dist` |
| — | `make release V=1.2.3 [PUSH=1]` | Aggiorna la versione in `package.json`, commit e tag |

> [!NOTE]
> In questo repo non c'è una suite di test unitari/d'integrazione — non c'è un test runner in `package.json`. Qui "verifica" significa **controllo dei tipi + lint + verifica manuale nel browser**. La cartella `postman/` contiene collezioni per esercitare manualmente l'API.

## Configurazione: variabili d'ambiente

Tutta la configurazione è una manciata di variabili d'ambiente `NUXT_PUBLIC_*`, dichiarate con i loro default in [`nuxt.config.ts`](../../nuxt.config.ts) sotto `runtimeConfig.public`:

| Variabile | Default | Scopo |
|-----------|---------|-------|
| `NUXT_PUBLIC_API_BASE` | `http://localhost:8081` | URL base dell'API Laravel (usato anche come `baseUrl` di Sanctum) |
| `NUXT_PUBLIC_WS_BASE` | `''` | Base WebSocket esplicita opzionale |
| `NUXT_PUBLIC_REVERB_APP_KEY` | `''` | Chiave dell'app Laravel Reverb |
| `NUXT_PUBLIC_REVERB_HOST` | `localhost` | Host WebSocket di Reverb |
| `NUXT_PUBLIC_REVERB_PORT` | `8080` | Porta WebSocket di Reverb |
| `NUXT_PUBLIC_REVERB_SCHEME` | `http` | `http` o `https` (controlla il TLS del socket) |

Per lo sviluppo locale, copia `.env.example` in `.env` (lo fa `make setup`) e modifica a piacere. Per puntare a un backend su una porta diversa per una singola esecuzione:

```bash
NUXT_PUBLIC_API_BASE=http://localhost:9090 pnpm dev
```

### Il tranello dell'incorporamento in fase di build

> [!IMPORTANT]
> Poiché questa è una SPA (`ssr: false`, vedi il [Capitolo 02](02-tech-stack-concepts.md)), queste variabili vengono **lette in fase di build e compilate dentro il bundle JavaScript**. *Non* vengono lette a runtime. Impostare `NUXT_PUBLIC_API_BASE` dopo la build non ha alcun effetto — devi impostarla **prima** di `pnpm build` o `docker build`. Un bundle costruito per `localhost:8081` parlerà sempre con `localhost:8081`, qualunque cosa dica l'ambiente di deploy.

## Build di produzione e deploy

`pnpm build` produce un **sito statico** in `.output/public/` — semplice HTML/JS/CSS, nessun server Node necessario. La via consigliata è l'immagine Docker inclusa.

### Docker

Il [`Dockerfile`](../../Dockerfile) è multi-stage:

1. **stage di build** (`node:22-alpine`): installa le dipendenze con lockfile bloccato, copia i sorgenti, prende `NUXT_PUBLIC_API_BASE` come build arg ed esegue `pnpm run build`.
2. **stage di runtime** (`nginx:alpine`): copia [`nginx.conf`](../../nginx.conf) e l'output statico nella root web di nginx. Espone la porta 80 con un healthcheck su `/index.html`.

Costruisci ed esegui, incorporando l'URL reale dell'API:

```bash
docker build \
  --build-arg NUXT_PUBLIC_API_BASE=https://api.example.com \
  -t matches-dashboard .

docker run -p 80:80 matches-dashboard
```

### nginx e routing SPA

Una SPA ha un solo vero file HTML (`index.html`); tutte le rotte sono risolte dal JavaScript nel browser. Se un utente ricarica forzatamente `/admin/settings`, il web server deve comunque restituire `index.html` invece di un 404. [`nginx.conf`](../../nginx.conf) lo gestisce con:

```nginx
location / {
    try_files $uri $uri/ /index.html;   # fallback SPA
}
```

Imposta anche header di cache lunghi sui file asset con hash (Nuxt aggiunge un'impronta ai nomi file, quindi possono essere messi in cache per sempre) e abilita gzip.

> [!IMPORTANT]
> Sia l'API backend sia l'endpoint WebSocket Reverb devono essere raggiungibili **dal browser dell'utente**, non solo dal container. È il browser, non il server, ad aprire queste connessioni.
