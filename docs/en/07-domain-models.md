# 07 — Domain Models

> See also: [06 — External Integrations](06-external-integrations.md), [10 — Notable Patterns](10-notable-patterns.md).

The domain is *amateur boxing tournaments*: athletes register for tournaments, are paired into matches, and matches are scored by judges. The backend owns the schema; the frontend only knows enough to render forms and tables. There are three kinds of types here: backend enums (mirrored as TypeScript `as const` tuples), backend DTOs (typed inline where used), and Zod schemas for form validation.

## Backend enums

All enum values come from the backend. They are defined once in `app/utils/constants.ts` using the `as const` pattern — a TypeScript trick that narrows the array's element type from `string` to the literal union `'MALE' | 'FEMALE' | 'HYBRID'`. Importing these guarantees the frontend never drifts from the backend's allowed values.

```ts
// app/utils/constants.ts
export const GENDERS = ['MALE', 'FEMALE', 'HYBRID'] as const
export type Gender = typeof GENDERS[number]

export const TOURNAMENT_STATUSES = [
  'SCHEDULED', 'REGISTRATIONS_OPENED', 'REGISTRATIONS_CLOSED',
  'IN_PROGRESS', 'COMPLETED', 'CANCELLED',
] as const

export const MATCH_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const

export const END_METHODS = [
  'VICTORY_UNANIMOUS_DECISION', 'VICTORY_SPLIT_DECISION',
  'VICTORY_KO', 'VICTORY_TKO', 'VICTORY_DISQUALIFICATION',
  'DRAW', 'NO_CONTEST',
] as const

export const CLIENT_TYPES = ['DESKTOP', 'MOBILE'] as const  // personal-access-token type
```

**Rule:** never hardcode enum strings in pages. Import from `~/utils/constants` and use the typed array. The select components iterate the array; the type checker catches typos.

## Core entity interfaces

All backend entity shapes are declared in `app/types/models.ts` as TypeScript interfaces. Because the app is `ssr: false` and auto-imports are on, any component can use these types without an explicit `import`.

| Interface         | Key fields                                                                                                             |
|-------------------|------------------------------------------------------------------------------------------------------------------------|
| `User`            | `id`, `email`, `superadmin`, `createdAt`                                                                               |
| `Athlete`         | personal data including `taxNumber` (Italian *codice fiscale* — the tax number used as the natural ID), `gender`, optional `defaultWeightCategoryId` and `defaultDisciplineId` |
| `Discipline`      | `id`, `label`                                                                                                          |
| `WeightCategory`  | `id`, `label`, `value` (weight in kg)                                                                                  |
| `Tournament`      | `id`, `name`, location fields, `date`, `status` (from `TOURNAMENT_STATUSES`)                                           |
| `Registration`    | athlete ↔ tournament link; `paidAt` (timestamp or null), `arrived` (boolean), `weightIn` (kg weighed at check-in), `notes`; several `*Label`/`*FullName` fields are denormalized read-only projections the backend adds for display |
| `Match`           | two corners (`redCornerId`, `blueCornerId`), `status`, optional `winnerId`, `endMethod`, `rounds`, `minutesPerRound`, and a `judgesPoints` array of per-round scores by judge |
| `JudgePointsRow`  | one row in the judges' scoring table: `round` + six judge slots (three per corner)                                     |
| `PersonalAccessToken` | API token issued to a user for `DESKTOP` or `MOBILE` client; fields include `tokenHash`, `lastUsedAt`, `expiresAt` |

## The `Page<T>` envelope

Spring Data's `Page<T>` is what every list endpoint returns. The shape consumed by `DataTable`:

```ts
{
  data: {
    content: T[],
    totalElements: number,
    // …plus totalPages, number, size, etc., unused here
  }
}
```

`DataTable` always sends `page` (zero-based) and `size` as query parameters. The page number in the UI is 1-based, so the component subtracts 1 before the call (see `app/components/DataTable.vue`).

## Validation with Zod

Form panels declare a Zod schema and bind it to `<UForm :schema="schema">`. Zod is a TypeScript-first validation library that also produces the matching type:

```ts
// shape used in *FormPanel.vue components
import { z } from 'zod'

const schema = z.object({
  email: z.email(),
  superadmin: z.boolean(),
})
type FormState = z.infer<typeof schema>
```

`@nuxt/ui`'s `<UForm>` runs the schema on submit and surfaces field errors automatically. Submission then calls `useApi().post(...)` / `.put(...)` and emits `saved`.

## Localized labels

Enum *values* are stable, but their human labels are not. `i18n/locales/{it,en}.json` carries the user-facing strings, looked up by key (e.g. `statuses.SCHEDULED`). When you add a new enum value:

1. Append it to the `as const` tuple in `constants.ts`.
2. Add the label under the corresponding key in **both** locale files.
