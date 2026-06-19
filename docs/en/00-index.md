# matches-dashboard — Technical Documentation

This documentation explains the **matches-dashboard** codebase to a capable developer who may be **new to Nuxt/Vue** and to the **domain of amateur combat-sports tournaments**. On first use, every language- or framework-specific term gets a short inline gloss in the form `(≈ plain-language analogy)`; all such terms are collected in the [Glossary](12-glossary.md).

## What this project is, in one line

A **web dashboard** (a user interface running in the browser) for organising amateur combat-sports tournaments: an admin area for organisers (athletes, tournaments, registrations, match scores) plus a few public pages for athlete sign-up and for spectators following a live scoreboard.

It is a **thin client**: all data persistence, business rules, and authentication live in a separate **Laravel API** (a PHP web framework). This repository contains *only* the user interface — it draws the screens, validates input, and talks HTTP + WebSocket to the backend.

## How to read this documentation

Start here, then read in order. Each chapter stands on its own but builds on the previous ones.

| #  | Chapter | What you'll learn |
|----|---------|-------------------|
| 00 | [Index](00-index.md) | This file |
| 01 | [Overview](01-overview.md) | What the app does, who uses it, the client/backend split, the domain in plain words |
| 02 | [Tech stack & concepts](02-tech-stack-concepts.md) | Nuxt, Vue, SPA, `ssr: false`, and the key libraries — each explained from scratch |
| 03 | [Project structure](03-project-structure.md) | A guided tour of `app/` and how file-based routing works |
| 04 | [Build, run & configure](04-build-run-configure.md) | Commands, env vars, build-time configuration, Docker/nginx |
| 05 | [Authentication](05-authentication.md) | Sanctum token login, admin vs public routes, the root redirect |
| 06 | [Data flow & the API layer](06-data-flow-api.md) | How data moves: `useApi`, paginated responses, `useLazyAsyncData`, downloads |
| 07 | [The admin CRUD pattern](07-admin-crud-pattern.md) | The `DataTable` + form panel + `ApiSelectMenu` recipe every admin page follows |
| 08 | [Match board & auto-scroll](08-match-board-and-scroll.md) | The match grid and the **auto-scroll (seek)** to the active bout |
| 09 | [Realtime scoreboard](09-realtime-scoreboard.md) | Echo + Reverb and the *notify-then-refetch* pattern |
| 10 | [Domain model](10-domain-model.md) | Tournaments, athletes, registrations, matches, and the enums that bind them |
| 11 | [i18n & theming](11-i18n-theming.md) | Italian/English languages, runtime theme colour, light/dark mode |
| 12 | [Glossary](12-glossary.md) | Every glossed term, alphabetical |

## Notation conventions

- `Code` → identifiers, file names, commands.
- *italics* → domain concepts.
- → / ⇆ → data-flow direction (unidirectional / bidirectional).
- Inline gloss on first use of a term: `term (≈ plain-language analogy)`.
- All paths are **relative to the repository root**.

## References already in the repository

This documentation links to — rather than duplicating — the files already at the repo root:

- [`CLAUDE.md`](../../CLAUDE.md) — architecture notes and a concise command summary.
- [`README.md`](../../README.md) — overview, commands, routes, and deployment. It is aligned with the current Laravel backend.
- [`DB.md`](../../DB.md) — the backend database schema in DBML. The frontend mirrors these shapes; see [Chapter 10](10-domain-model.md).
