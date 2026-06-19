# 01 — Overview

> See also: [02 — Tech stack & concepts](02-tech-stack-concepts.md), [05 — Authentication](05-authentication.md), [10 — Domain model](10-domain-model.md)

This chapter answers three questions: what the application does, who uses it, and how it fits into the rest of the system.

## What the application does

matches-dashboard manages **amateur combat-sports tournaments**. An organiser creates a tournament, opens registrations, signs up athletes in a *discipline* (the fighting style) and a *weight category*, builds the match grid, and — during the event — updates the scores assigned by the judges and declares a winner for each bout. Meanwhile, spectators follow the results on a **live scoreboard** that refreshes itself.

## The two audiences

The app serves two kinds of users through two completely separate sets of routes (URLs):

| Audience | URL prefix | Authentication | Purpose |
|----------|------------|----------------|---------|
| **Admin** | `/admin/**`, `/login` | Sanctum token (in a cookie) | Full tournament and data management |
| **Public** | `/public/**` | None | Athlete sign-up and live scoreboard |

The root `/` has no content of its own: it immediately redirects to `/admin` (see [`app/pages/index.vue`](../../app/pages/index.vue)). From there, the authentication middleware decides whether to show the admin area or send the user to `/login`. Details are in [Chapter 05](05-authentication.md).

## The client / backend split

```
Browser (Nuxt SPA)  ──REST + Sanctum token──►  Laravel API  ──►  Database
        │                                            ▲
        └──────WebSocket (Echo / Reverb)─────────────┘
```

The key thing to internalise: **this repository holds no business logic and no database**. It is a *thin client* (≈ a lean client that keeps no data of its own). Everything authoritative — users, tournaments, rules, scores — lives in the separate Laravel API. This frontend:

1. Draws the screens.
2. Validates form input before sending it (with *Zod*, see [Chapter 06](06-data-flow-api.md)).
3. Calls the API over HTTP to read and write data.
4. Listens over WebSocket to know *when* to re-read live data.

One important technical consequence: the app runs with `ssr: false` (*Server-Side Rendering* disabled). Nuxt produces no Node server — it builds a **static** site of plain files (HTML/JS/CSS) served by nginx. This has practical effects on build and configuration, explained in [Chapter 04](04-build-run-configure.md).

## The domain in plain words

If you're new to combat-sports tournaments, here are the minimal entities (the full schema is in [Chapter 10](10-domain-model.md)):

| Entity | In plain words |
|--------|----------------|
| *Tournament* (`Tournament`) | The scheduled event, with a status lifecycle: scheduled → registrations opened → registrations closed → in progress → completed (or cancelled). |
| *Athlete* (`Athlete`) | A person, identified by their tax number. |
| *Registration* (`Registration`) | An athlete's entry into a tournament, with a discipline and weight category. |
| *Match* (`MatchRecord`) | A single bout between two athletes: red corner vs blue corner, judge scores, end method, winner. |
| *Discipline* (`Discipline`) | The fighting style (number of rounds, minutes per round). |
| *Weight category* (`WeightCategory`) | A weight bracket. |

The terms *red corner* / *blue corner* (`red_corner` / `blue_corner`) are the universal ring-sport convention for the two contenders.

## Main features

- **Admin panel** — CRUD over athletes, tournaments, disciplines, weight categories, and users; registration review; building the match grid and updating scores.
- **Public registration form** — an unauthenticated athlete sign-up flow.
- **Live scoreboard** — Echo + Reverb with a *notify-then-refetch* pattern ([Chapter 09](09-realtime-scoreboard.md)).
- **Match board** — a grid view of a tournament's bouts with auto-scroll to the active match ([Chapter 08](08-match-board-and-scroll.md)).
- **Bilingual** — Italian (default, no URL prefix) and English under `/en/`.
- **Runtime theming** — the admin picks a primary colour that persists to a cookie; plus light/dark mode ([Chapter 11](11-i18n-theming.md)).
