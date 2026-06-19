# 10 — Domain model

> See also: [01 — Overview](01-overview.md), [06 — Data flow & the API layer](06-data-flow-api.md)

The domain entities are typed in [`app/types/models.ts`](../../app/types/models.ts) and their enums in [`app/utils/constants.ts`](../../app/utils/constants.ts). They are the frontend's reflection of the database schema, described in DBML in [`DB.md`](../../DB.md). The frontend defines no rules: it mirrors the shapes the API returns.

## The entities

```
Tournament 1───* Registration *───1 Athlete
     │
     1
     *
 MatchRecord *───1 red_corner (Athlete)
            *───1 blue_corner (Athlete)
            *───1 winner (Athlete)
            *───1 Discipline
            *───1 WeightCategory
```

| Entity | Key fields | Notes |
|--------|------------|-------|
| **Tournament** | `name`, `location_*`, `date`, `status` | The event. `status` follows the status lifecycle (below). Optional relations: `registrations`, `match_records`, `cover_media`. |
| **Athlete** | `first_name`, `last_name`, `full_name`, `birth_date`, `gender`, `tax_number`, `team_name` | Identified by tax number (`tax_number`). Has a default discipline and weight category. `match_records_count?` is an optional count. |
| **Registration** | `athlete_id`, `tournament_id`, `discipline_id`, `weight_category_id`, `paid_at`, `arrived`, `weight_in` | An athlete's entry into a tournament. |
| **MatchRecord** | `red_corner_id`, `blue_corner_id`, `winner_id`, `status`, `end_method`, `judges_points`, `sort`, `scheduled_time` | A single bout. See below. |
| **Discipline** | `label`, `rounds`, `minutes_per_round` | The fighting style. |
| **WeightCategory** | `label`, `value` | A weight bracket (`value` is the numeric weight). |
| **User** | `username`, `email`, `superadmin` | An admin user. `password` and `remember_token` are `$hidden`: they never appear in responses. |
| **MediaAttachment** | `uuid`, `collection_name`, `mime_type`, `temporary_url` | An attachment (e.g. tournament cover), spatie/media-library style. |

### Optional relations and the `with=` parameter

On the models you'll see fields like `tournament?: Tournament` or `red_corner?: Athlete`, marked optional. They are present **only** if the request asked for them with `?with=tournament,red_corner,…` ([Chapter 06](06-data-flow-api.md)). Without `with=`, only the `*_id`s arrive.

### Inside `MatchRecord`

The richest entity ([`models.ts`](../../app/types/models.ts) lines 87-116):

- **Corners**: `red_corner_id` / `blue_corner_id` (the athletes), plus `red_corner_team` / `blue_corner_team` for the team name.
- **Outcome**: `winner_id`, `end_round`, `end_method`, `status`.
- **Judge scores**: `judges_points` is an array of `JudgesPointsRow` rows, one per round, with three judges' points for each corner (`judge1_red`, `judge1_blue`, …).
- **Ordering and time**: `sort` (position in the grid) and `scheduled_time` (`"HH:MM:SS"`).
- **Format**: `rounds`, `minutes_per_round`, inheritable from the discipline.
- **`forced`**: a boolean flag for matches created by force.

## The domain enums

Defined as `as const` arrays in [`app/utils/constants.ts`](../../app/utils/constants.ts) and used as TypeScript types. **Always import from here** instead of hand-writing strings.

| Enum | Values |
|------|--------|
| `GENDERS` | `male`, `female`, `hybrid` |
| `TOURNAMENT_STATUSES` | `scheduled` → `registrations_opened` → `registrations_closed` → `in_progress` → `completed` (or `cancelled`) |
| `MATCH_STATUSES` | `scheduled`, `in_progress`, `completed`, `cancelled` |
| `END_METHODS` | `victory_unanimous_decision`, `victory_split_decision`, `victory_ko`, `victory_tko`, `victory_disqualification`, `draw`, `no_contest` |
| `CLIENT_TYPES` | `desktop`, `mobile` |

`MATCH_STATUSES` is exactly the enum the auto-scroll of [Chapter 08](08-match-board-and-scroll.md) revolves around: `in_progress` takes priority over `scheduled`.

### A tournament's lifecycle

```
scheduled → registrations_opened → registrations_closed → in_progress → completed
                                                                 └──────→ cancelled
```

The backend is the authority on these transitions; the frontend just displays them and sends status-change requests.

## Why these types are pure value

Having the models typed in a single file gives three concrete benefits in this code:

1. The `useApi` generics (`api.get<Tournament>(…)`) know what comes back.
2. `DataTable` columns and `FormPanel` fields get autocompletion and type-checking.
3. The enums prevent typos: `status === 'in_progres'` (wrong) won't compile when compared against the `MatchStatus` type.

The authoritative schema is still [`DB.md`](../../DB.md): when in doubt about constraints (nullability, defaults, keys), the truth is there.
