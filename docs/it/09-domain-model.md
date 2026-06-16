# 09 — Modello di dominio

Questo capitolo è il riferimento per i dati con cui l'app lavora. Lo schema del database autorevole è in [`DB.md`](../../DB.md) (DBML); il frontend rispecchia quelle forme come interfacce TypeScript in [`app/types/models.ts`](../../app/types/models.ts), e i valori ammessi degli enum vivono in [`app/utils/constants.ts`](../../app/utils/constants.ts).

> [!NOTE]
> Il backend memorizza i valori degli enum in `MAIUSCOLO` (vedi `DB.md`), ma le costanti del frontend usano stringhe in `minuscolo` (es. `'in_progress'`). L'API traduce tra le due forme; nel codice *frontend* usa sempre i valori in minuscolo da `constants.ts`.

## Le entità a colpo d'occhio

```
Tournament ──┬─< Registration >── Athlete
             │                      │  (disciplina / categoria di peso di default)
             └─< MatchRecord >──────┤  (angolo rosso, angolo blu, vincitore)
                     │              │
       Discipline ───┴── WeightCategory
```

Un Tournament ha molte Registration e molti MatchRecord. Una Registration collega un Athlete a un Tournament (con una Discipline e una WeightCategory). Un MatchRecord contrappone due Athlete (angolo rosso/blu) all'interno di un Tournament.

## Entità

### Athlete (Atleta)

Un concorrente. Fonte: interfaccia `Athlete` in `models.ts`.

| Campo | Tipo | Note |
|-------|------|------|
| `id` | string (uuid) | |
| `first_name`, `last_name` | string | |
| `full_name` | string | Campo di comodo dal backend |
| `birth_date` | string | `YYYY-MM-DD` |
| `gender` | `Gender` | `male` \| `female` \| `hybrid` |
| `tax_number` | string \| null | Codice fiscale italiano; identificatore univoco |
| `team_name` | string \| null | |
| `default_weight_category_id` | string \| null | Precompila i form di iscrizione |
| `default_discipline_id` | string \| null | Precompila i form di iscrizione |
| `created_at`, `updated_at` | string | |
| `default_weight_category?`, `default_discipline?`, `registrations?` | oggetti | Opzionali — presenti solo se caricati con `with=` |

### Tournament (Torneo)

Un evento programmato.

| Campo | Tipo | Note |
|-------|------|------|
| `id` | string | |
| `name` | string | |
| `location_name`, `location_address`, `location_city` | string | Sede |
| `date` | string | `YYYY-MM-DD` |
| `status` | `TournamentStatus` | vedi sotto |
| `registrations?`, `match_records?` | array | Opzionali, caricati in anticipo |

### Registration (Iscrizione)

L'iscrizione di un atleta a un torneo. Nota che l'interfaccia frontend differisce leggermente da `DB.md` (il frontend traccia pagamento/arrivo/pesata invece di un enum `status`):

| Campo | Tipo | Note |
|-------|------|------|
| `id` | string | |
| `athlete_id`, `tournament_id`, `discipline_id`, `weight_category_id` | string | Chiavi esterne |
| `paid_at` | string \| null | Datetime ISO; null = non pagato |
| `arrived` | boolean | Check-in alla sede |
| `weight_in` | number \| null | Valore di pesata registrato |
| `notes` | string \| null | |
| `created_at`, `updated_at` | string | |
| `athlete?`, `tournament?`, `discipline?`, `weight_category?` | oggetti | Opzionali, caricati in anticipo |

### MatchRecord (Incontro)

Un singolo match. L'entità più ricca.

| Campo | Tipo | Note |
|-------|------|------|
| `id` | string | |
| `tournament_id` | string | |
| `red_corner_id`, `blue_corner_id` | string \| null | I due atleti |
| `weight_category_id`, `discipline_id` | string \| null | |
| `gender` | `Gender` | |
| `forced` | boolean | Abbinamento forzato manualmente |
| `red_corner_team`, `blue_corner_team` | string \| null | |
| `sort` | number | Ordine di visualizzazione/svolgimento |
| `scheduled_time` | string \| null | `HH:MM:SS` |
| `winner_id` | string \| null | |
| `end_round` | string \| null | Round in cui è finito l'incontro |
| `end_method` | `EndMethod` \| null | Come è finito (vedi sotto) |
| `status` | `MatchStatus` | vedi sotto |
| `rounds` | number | Round totali |
| `minutes_per_round` | number | |
| `judges_points` | array \| null | Punteggi dei giudici round per round (vedi sotto) |
| `tournament?`, `red_corner?`, `blue_corner?`, `winner?`, `weight_category?`, `discipline?` | oggetti | Opzionali, caricati in anticipo |

**`judges_points`** è un array JSON di punteggi round per round. Secondo `DB.md`, ogni voce è del tipo `{ round, redCornerJudge1..3, blueCornerJudge1..3 }` (un intero per giudice, o null se quel giudice non è assegnato). È renderizzato da [`MatchRecordJudgesPointsTable.vue`](../../app/components/MatchRecordJudgesPointsTable.vue).

### User (Utente)

Un account admin. I campi sensibili (`password`, `remember_token`) sono `$hidden` sul backend e non compaiono mai nelle risposte.

| Campo | Tipo |
|-------|------|
| `id` | string |
| `username`, `email` | string |
| `email_verified_at` | string \| null |
| `created_at`, `updated_at` | string |

### Discipline & WeightCategory

Piccole entità di lookup. `Discipline`: `id`, `label`. `WeightCategory`: `id`, `label`, `value` (il peso numerico). Entrambe portano i timestamp.

## Gli enum (`constants.ts`)

Tutti gli enum sono dichiarati come array `as const` così che TypeScript possa derivarne un tipo unione. **Importa sempre questi invece di scrivere stringhe a mano** — e usali negli schemi Zod (`z.enum(GENDERS)`).

| Costante | Valori |
|----------|--------|
| `GENDERS` | `male`, `female`, `hybrid` |
| `TOURNAMENT_STATUSES` | `scheduled`, `registrations_opened`, `registrations_closed`, `in_progress`, `completed`, `cancelled` |
| `MATCH_STATUSES` | `scheduled`, `in_progress`, `completed`, `cancelled` |
| `END_METHODS` | `victory_unanimous_decision`, `victory_split_decision`, `victory_ko`, `victory_tko`, `victory_disqualification`, `draw`, `no_contest` |
| `CLIENT_TYPES` | `desktop`, `mobile` |

Più costanti non di dominio nello stesso file: `PAGE_SIZES` (`[10, 20, 50, 100]`), e gli array per i temi `COLOR_PALETTE` / `COLOR_SECONDARY_MAP` (vedi il [Capitolo 10](10-i18n-theming.md)).

## Ciclo di vita dello stato del torneo

```
scheduled → registrations_opened → registrations_closed → in_progress → completed
     └──────────────────────── cancelled (da qualsiasi stato) ──────────────────────┘
```

Il backend possiede e impone queste transizioni; il frontend legge `status` per decidere cosa mostrare (es. se il badge live del tabellone pubblico abbia senso). Lo stato dell'incontro segue il più semplice `scheduled → in_progress → completed` (oppure `cancelled`) — e lo scroll automatico del tabellone live si basa prima su `in_progress`, poi su `scheduled` ([Capitolo 08](08-realtime-scoreboard.md)).
