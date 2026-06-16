# 09 — Domain Model

This chapter is the reference for the data the app deals in. The authoritative database schema is in [`DB.md`](../../DB.md) (DBML); the frontend mirrors those shapes as TypeScript interfaces in [`app/types/models.ts`](../../app/types/models.ts), and the allowed enum values live in [`app/utils/constants.ts`](../../app/utils/constants.ts).

> [!NOTE]
> The backend stores enum values in `UPPER_CASE` (see `DB.md`), but the frontend constants use `lower_case` strings (e.g. `'in_progress'`). The API translates between the two; in *frontend* code always use the lower-case values from `constants.ts`.

## The entities at a glance

```
Tournament ──┬─< Registration >── Athlete
             │                      │  (default discipline / weight category)
             └─< MatchRecord >──────┤  (red corner, blue corner, winner)
                     │              │
       Discipline ───┴── WeightCategory
```

A Tournament has many Registrations and many MatchRecords. A Registration links one Athlete to one Tournament (with a Discipline and WeightCategory). A MatchRecord pits two Athletes (red/blue corner) against each other within a Tournament.

## Entities

### Athlete

A competitor. Source: `Athlete` interface in `models.ts`.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (uuid) | |
| `first_name`, `last_name` | string | |
| `full_name` | string | Convenience field from the backend |
| `birth_date` | string | `YYYY-MM-DD` |
| `gender` | `Gender` | `male` \| `female` \| `hybrid` |
| `tax_number` | string \| null | Italian *codice fiscale*; unique identifier |
| `team_name` | string \| null | |
| `default_weight_category_id` | string \| null | Pre-fills registration forms |
| `default_discipline_id` | string \| null | Pre-fills registration forms |
| `created_at`, `updated_at` | string | |
| `default_weight_category?`, `default_discipline?`, `registrations?` | objects | Optional — present only when eager-loaded via `with=` |

### Tournament

A scheduled event.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | |
| `name` | string | |
| `location_name`, `location_address`, `location_city` | string | Venue |
| `date` | string | `YYYY-MM-DD` |
| `status` | `TournamentStatus` | see below |
| `registrations?`, `match_records?` | arrays | Optional, eager-loaded |

### Registration

One athlete's entry into one tournament. Note the frontend interface differs slightly from `DB.md` (the frontend tracks payment/arrival/weigh-in rather than a `status` enum):

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | |
| `athlete_id`, `tournament_id`, `discipline_id`, `weight_category_id` | string | Foreign keys |
| `paid_at` | string \| null | ISO datetime; null = unpaid |
| `arrived` | boolean | Checked in at the venue |
| `weight_in` | number \| null | Recorded weigh-in figure |
| `notes` | string \| null | |
| `created_at`, `updated_at` | string | |
| `athlete?`, `tournament?`, `discipline?`, `weight_category?` | objects | Optional, eager-loaded |

### MatchRecord

A single bout. The richest entity.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | |
| `tournament_id` | string | |
| `red_corner_id`, `blue_corner_id` | string \| null | The two athletes |
| `weight_category_id`, `discipline_id` | string \| null | |
| `gender` | `Gender` | |
| `forced` | boolean | Manually overridden pairing |
| `red_corner_team`, `blue_corner_team` | string \| null | |
| `sort` | number | Display/run order |
| `scheduled_time` | string \| null | `HH:MM:SS` |
| `winner_id` | string \| null | |
| `end_round` | string \| null | Round the bout ended in |
| `end_method` | `EndMethod` \| null | How it ended (see below) |
| `status` | `MatchStatus` | see below |
| `rounds` | number | Total rounds |
| `minutes_per_round` | number | |
| `judges_points` | array \| null | Per-round judge scores (see below) |
| `tournament?`, `red_corner?`, `blue_corner?`, `winner?`, `weight_category?`, `discipline?` | objects | Optional, eager-loaded |

**`judges_points`** is a JSON array of per-round scores. Per `DB.md`, each entry looks like `{ round, redCornerJudge1..3, blueCornerJudge1..3 }` (an integer per judge, or null if that judge isn't assigned). It is rendered by [`MatchRecordJudgesPointsTable.vue`](../../app/components/MatchRecordJudgesPointsTable.vue).

### User

An admin account. Sensitive fields (`password`, `remember_token`) are `$hidden` on the backend and never appear in responses.

| Field | Type |
|-------|------|
| `id` | string |
| `username`, `email` | string |
| `email_verified_at` | string \| null |
| `created_at`, `updated_at` | string |

### Discipline & WeightCategory

Small lookup entities. `Discipline`: `id`, `label`. `WeightCategory`: `id`, `label`, `value` (the numeric weight). Both carry timestamps.

## The enums (`constants.ts`)

All enums are declared `as const` arrays so TypeScript can derive a union type from them. **Always import these rather than hardcoding strings** — and use them in Zod schemas (`z.enum(GENDERS)`).

| Constant | Values |
|----------|--------|
| `GENDERS` | `male`, `female`, `hybrid` |
| `TOURNAMENT_STATUSES` | `scheduled`, `registrations_opened`, `registrations_closed`, `in_progress`, `completed`, `cancelled` |
| `MATCH_STATUSES` | `scheduled`, `in_progress`, `completed`, `cancelled` |
| `END_METHODS` | `victory_unanimous_decision`, `victory_split_decision`, `victory_ko`, `victory_tko`, `victory_disqualification`, `draw`, `no_contest` |
| `CLIENT_TYPES` | `desktop`, `mobile` |

Plus non-domain constants in the same file: `PAGE_SIZES` (`[10, 20, 50, 100]`), and the theming arrays `COLOR_PALETTE` / `COLOR_SECONDARY_MAP` (see [Chapter 10](10-i18n-theming.md)).

## Tournament status lifecycle

```
scheduled → registrations_opened → registrations_closed → in_progress → completed
     └──────────────────────── cancelled (from any state) ───────────────────────┘
```

The backend owns and enforces these transitions; the frontend reads `status` to decide what to show (e.g. whether the public scoreboard's live badge makes sense). Match status follows the simpler `scheduled → in_progress → completed` (or `cancelled`) — and the live scoreboard's auto-scroll keys off `in_progress` first, then `scheduled` ([Chapter 08](08-realtime-scoreboard.md)).
