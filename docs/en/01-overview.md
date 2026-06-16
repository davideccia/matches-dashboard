# 01 — Overview

## The product

**matches-dashboard** is the browser-based control panel and public site for an amateur boxing (and related combat-sport) tournament platform. It serves two completely different kinds of visitor from one codebase:

- **Administrators** — the people who run events. They log in and manage the underlying data: athletes, tournaments, disciplines, weight categories, registrations, and the live scoring of bouts (≈ individual fights).
- **The public** — athletes who register for an event through a form, and spectators who watch a live, auto-updating scoreboard. These visitors never log in.

## The client / backend split

This is the single most important architectural fact, and it shapes everything else.

```
   Browser                          Server side (separate repo)
 ┌─────────────────────┐           ┌──────────────────────────┐
 │  matches-dashboard  │  HTTPS    │   Laravel API            │
 │  (this repo)        │ ────────► │   - auth (Sanctum)       │
 │  Nuxt 4 SPA         │           │   - business rules       │
 │  - renders UI       │ ◄──────── │   - database             │
 │  - validates input  │   JSON    │                          │
 │  - talks HTTP + WS  │           │   Reverb (WebSocket)     │
 └─────────────────────┘  WebSocket└──────────────────────────┘
            ▲                                   │
            └───────────── live push ───────────┘
```

This repository is a **thin client** (≈ a remote control: lots of buttons and screens, but the actual machine is elsewhere). It contains:

- the visual interface (pages, forms, tables, the scoreboard),
- input validation (so obviously-wrong data is caught before it is sent),
- the code that makes HTTP requests and opens a WebSocket.

It contains **none** of: the database, the authority on who may do what, or the rules for how a tournament progresses. All of that is in the **Laravel** backend, which is a separate project not included here.

A practical consequence: you cannot run this app meaningfully on its own. It expects a Laravel API reachable at a configured URL (default `http://localhost:8081`). See [Chapter 04](04-build-run-configure.md).

## Two audiences, two route namespaces

Nuxt builds pages from files (explained in [Chapter 03](03-project-structure.md)). The pages are split into two groups by URL:

| Namespace | URL prefix | Logged in? | Purpose |
|-----------|-----------|------------|---------|
| **Admin** | `/admin/**`, `/login` | Yes (Sanctum token) | Full tournament management |
| **Public** | `/public/**` | No | Athlete registration + live scoreboard |

The root URL `/` is a redirect-only page: it immediately sends the browser to `/admin` (and if you are not authenticated, the auth layer bounces you on to `/login`). See [`app/pages/index.vue`](../../app/pages/index.vue) and [Chapter 05](05-authentication.md).

## The domain in plain words

You do not need to know boxing to work on this codebase, but these terms appear everywhere. Full detail (fields, relationships, allowed values) is in [Chapter 09](09-domain-model.md).

- **Tournament** — a scheduled event in a city on a date. It moves through a fixed sequence of statuses: `scheduled → registrations_opened → registrations_closed → in_progress → completed` (or `cancelled`).
- **Athlete** — a person who competes, identified uniquely by their Italian tax number (*codice fiscale*, ≈ a national ID string).
- **Registration** — one athlete's entry into one tournament, for a given discipline and weight category. Admins track whether the athlete has paid, arrived, and their weigh-in figure.
- **Match record** — one bout: a red-corner athlete versus a blue-corner athlete, with rounds, judges' points, an end method (how it finished — KO, decision, draw…) and a winner.
- **Discipline** — a fighting style (e.g. *light contact*, *full contact*).
- **Weight category** — a weight bracket (a label plus a numeric value, e.g. "60 kg").

## What each audience can do (feature map)

**Admin** (after login):

- Dashboard home at `/admin`.
- Configuration sections under `/admin/configurations/`: athletes, disciplines, weight categories, users.
- Tournament management under `/admin/tournaments/`: the tournament list, registrations review, the match-records list, and a full-screen match "board".
- Settings (`/admin/settings`): theme colour and locale.

**Public** (no login):

- A registration page at `/public/athletes/registration`.
- A live scoreboard at `/public/tournaments/match_records` that updates itself in realtime as an admin scores bouts elsewhere.

The next chapter introduces the technologies that make all of this work.
