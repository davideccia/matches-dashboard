# matches-dashboard — Developer Documentation

Welcome. This documentation explains the **matches-dashboard** codebase to a developer who is comfortable programming but may be **new to Nuxt/Vue** and **new to the amateur-boxing tournament domain**. Language-specific terms get an inline gloss `(≈ plain-language analogy)` the first time they appear, and every glossed term is collected in the [Glossary](11-glossary.md).

## What this project is, in one line

A **web dashboard** (the browser-side user interface) for running amateur boxing tournaments: an admin area for organisers to manage athletes, tournaments and live match scoring, plus public pages for athletes to register and for spectators to follow a live scoreboard.

It is a **thin client** (≈ a front-of-house that holds no data of its own): all real data and rules live in a separate **Laravel** (a PHP web framework) backend. This repository is *only* the user interface.

> [!IMPORTANT]
> The root `README.md` describes a Spring Boot backend with STOMP/JWT. That description is **out of date**. The code in this repository targets a **Laravel** backend, authenticates with **Laravel Sanctum** tokens, and receives realtime updates over **Laravel Reverb** (an Echo/Pusher-protocol WebSocket server). This documentation reflects the *code as it actually is*. See [Chapter 05](05-authentication.md) and [Chapter 08](08-realtime-scoreboard.md).

## How to read this

Start here, then read in order. Each chapter is self-contained but builds on earlier ones.

| # | Chapter | What you'll learn |
|---|---------|-------------------|
| 01 | [Overview](01-overview.md) | What the app does, who uses it, the client/backend split, the domain in plain words |
| 02 | [Tech Stack & Concepts](02-tech-stack-concepts.md) | Nuxt, Vue, SPA and the key libraries — each glossed for newcomers |
| 03 | [Project Structure](03-project-structure.md) | A guided tour of the `app/` directory and how file-based routing works |
| 04 | [Build, Run & Configure](04-build-run-configure.md) | Commands, environment variables, build-time config, Docker/nginx |
| 05 | [Authentication](05-authentication.md) | Sanctum token login, admin vs public routes, how access is gated |
| 06 | [Admin CRUD Pattern](06-admin-crud-pattern.md) | The DataTable + form-panel + select-menu recipe every admin page follows |
| 07 | [Data Flow & API Layer](07-data-flow-api.md) | How data moves: `useApi`, paginated responses, Zod-validated forms |
| 08 | [Realtime Scoreboard](08-realtime-scoreboard.md) | The live match board: Echo + Reverb, the notify-then-refetch pattern |
| 09 | [Domain Model](09-domain-model.md) | Tournaments, athletes, registrations, match records and the enums that tie them together |
| 10 | [i18n & Theming](10-i18n-theming.md) | Italian/English locales, runtime colour theme, light/dark mode |
| 11 | [Glossary](11-glossary.md) | Every glossed term, alphabetised |

## Authoritative references already in the repo

This documentation links to, rather than duplicates, files that already live at the repository root:

- [`CLAUDE.md`](../../CLAUDE.md) — concise architecture notes and commands (the most accurate top-level summary).
- [`DB.md`](../../DB.md) — the backend database schema in DBML. The frontend mirrors these shapes; see [Chapter 09](09-domain-model.md).
- [`README.md`](../../README.md) — useful for commands and routes, but its *backend/realtime/auth* sections are stale (see the note above).
