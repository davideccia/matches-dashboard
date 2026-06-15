# matches-dashboard — Technical Documentation

Frontend for an amateur boxing tournament management platform. A thin Nuxt 4 SPA that renders UI, validates input, and talks HTTP + WebSocket to a separate Spring Boot API.

This documentation is written for a developer who is comfortable with general web programming but new to Vue, Nuxt, and the TypeScript ecosystem. Framework-specific terms are glossed inline on first use and collected in the [Glossary](11-glossary.md).

## Table of Contents

| #  | Chapter                                                  | Contents                                                        |
|----|----------------------------------------------------------|-----------------------------------------------------------------|
| 00 | [Index](00-index.md)                                     | This file                                                       |
| 01 | [Overview](01-overview.md)                               | What the project does, who it serves, top-level architecture    |
| 02 | [Module Structure](02-module-structure.md)               | Folder layout under `app/` and what each piece is for           |
| 03 | [Build, Run, Test](03-build-run-test.md)                 | Local dev, production build, lint, type-check, Docker           |
| 04 | [UI & Navigation](04-ui-navigation.md)                   | File-based routing, layouts, route middleware, i18n URLs        |
| 05 | [Data Flow](05-data-flow.md)                             | How a screen gets data: composables, reactive state, refresh    |
| 06 | [External Integrations](06-external-integrations.md)     | REST via `useApi`, JWT, STOMP/WebSocket scoreboard              |
| 07 | [Domain Models](07-domain-models.md)                     | Enums, Zod schemas, Spring `Page<T>` envelope                   |
| 08 | [Configuration & Env](08-configuration-env.md)           | `nuxt.config.ts`, runtime config, `localStorage` settings       |
| 09 | [Dependencies](09-dependencies.md)                       | Each dependency in `package.json` and what it gives us          |
| 10 | [Notable Patterns](10-notable-patterns.md)               | DataTable + FormPanel recipe, auth plugin, notify-then-refetch  |
| 11 | [Glossary](11-glossary.md)                               | Vue/Nuxt/TS terms in plain language                             |

### Chapters intentionally omitted

- **Request lifecycle** — there is no server-side rendering (`ssr: false`); the only request path is browser → REST/WS, covered in [05](05-data-flow.md) and [06](06-external-integrations.md).
- **Controllers / view-models** — Vue has no controller layer; the equivalent (Composition API + composables) is in [05](05-data-flow.md) and [10](10-notable-patterns.md).
- **Persistence / repository** — there is no client-side database; the only persisted state is the JWT and a few UI preferences in `localStorage`, covered in [08](08-configuration-env.md).

## How to Read This Book

- Chapters can be read in order; each includes cross-references.
- All paths are relative to the repository root.
- Language-specific terms are explained inline on first use and collected in the Glossary.

## Notation Conventions

- `Code` → identifiers, file names, commands.
- *italics* → domain concepts.
- → / ⇆ → data flow direction (unidirectional / bidirectional).
