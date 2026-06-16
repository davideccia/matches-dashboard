# 04 — Build, Run & Configure

## Prerequisites

- **Node.js 20+** (the Docker build uses Node 22).
- **pnpm** — the package manager. Enable it with `corepack enable pnpm` if you don't have it.
- **A running Laravel backend** reachable from the browser (default `http://localhost:8081`). Without it, pages load but every data request fails.

## First-time setup

Using the provided [`Makefile`](../../Makefile):

```bash
make setup    # copies .env.example → .env (if missing) and runs pnpm install
```

Or manually:

```bash
pnpm install
```

## Everyday commands

These come from [`package.json`](../../package.json) scripts and the [`Makefile`](../../Makefile):

| Command | Makefile alias | What it does |
|---------|----------------|--------------|
| `pnpm dev` | `make dev` (`--host 127.0.0.1`) | Start the dev server at `http://localhost:3000` with hot reload |
| — | `make host` (`--host 0.0.0.0`) | Same, but exposed on the LAN / for Docker |
| `pnpm build` | `make build` | Production build → static files in `.output/public/` |
| `pnpm preview` | `make preview` | Serve the built output locally to sanity-check it |
| `pnpm eslint . --fix` | `make lint-fix` | Lint and auto-fix. **Run after every coding session.** |
| `pnpm nuxi typecheck` | `make typecheck` | Type-check the whole project |
| — | `make clean` | Remove `.nuxt`, `.output`, `dist` |
| — | `make release V=1.2.3 [PUSH=1]` | Bump version in `package.json`, commit, tag |

> [!NOTE]
> There is no unit/integration test suite in this repo — there is no test runner in `package.json`. "Verification" here means **type-check + lint + manual checking in the browser**. The `postman/` directory holds API collections for manually exercising the backend.

## Configuration: environment variables

All configuration is a handful of `NUXT_PUBLIC_*` environment variables, declared with their defaults in [`nuxt.config.ts`](../../nuxt.config.ts) under `runtimeConfig.public`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `NUXT_PUBLIC_API_BASE` | `http://localhost:8081` | Base URL of the Laravel API (also used as Sanctum's `baseUrl`) |
| `NUXT_PUBLIC_WS_BASE` | `''` | Optional explicit WebSocket base |
| `NUXT_PUBLIC_REVERB_APP_KEY` | `''` | Laravel Reverb app key |
| `NUXT_PUBLIC_REVERB_HOST` | `localhost` | Reverb WebSocket host |
| `NUXT_PUBLIC_REVERB_PORT` | `8080` | Reverb WebSocket port |
| `NUXT_PUBLIC_REVERB_SCHEME` | `http` | `http` or `https` (controls TLS for the socket) |

For local development, copy `.env.example` to `.env` (`make setup` does this) and adjust as needed. To point at a backend on a different port for a single run:

```bash
NUXT_PUBLIC_API_BASE=http://localhost:9090 pnpm dev
```

### The build-time-baking gotcha

> [!IMPORTANT]
> Because this is a SPA (`ssr: false`, see [Chapter 02](02-tech-stack-concepts.md)), these variables are **read at build time and compiled into the JavaScript bundle**. They are *not* read at runtime. Setting `NUXT_PUBLIC_API_BASE` after the build has no effect — you must set it **before** `pnpm build` or `docker build`. A bundle built for `localhost:8081` will always talk to `localhost:8081` no matter what the deployment environment says.

## Production build & deployment

`pnpm build` emits a **static site** to `.output/public/` — plain HTML/JS/CSS, no Node server required. The recommended path is the bundled Docker image.

### Docker

The [`Dockerfile`](../../Dockerfile) is multi-stage:

1. **build stage** (`node:22-alpine`): installs deps with a frozen lockfile, copies the source, takes `NUXT_PUBLIC_API_BASE` as a build arg, and runs `pnpm run build`.
2. **runtime stage** (`nginx:alpine`): copies [`nginx.conf`](../../nginx.conf) and the static output into the nginx web root. Exposes port 80 with a healthcheck on `/index.html`.

Build and run, baking in the real API URL:

```bash
docker build \
  --build-arg NUXT_PUBLIC_API_BASE=https://api.example.com \
  -t matches-dashboard .

docker run -p 80:80 matches-dashboard
```

### nginx and SPA routing

A SPA has only one real HTML file (`index.html`); all routes are resolved by JavaScript in the browser. If a user hard-refreshes `/admin/settings`, the web server must still return `index.html` rather than a 404. [`nginx.conf`](../../nginx.conf) handles this with:

```nginx
location / {
    try_files $uri $uri/ /index.html;   # SPA fallback
}
```

It also sets long cache headers on hashed asset files (Nuxt fingerprints filenames, so they can be cached forever) and enables gzip.

> [!IMPORTANT]
> The backend API and the Reverb WebSocket endpoint must both be reachable **from the user's browser**, not just from the container. The browser, not the server, opens these connections.
