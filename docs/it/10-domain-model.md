# 10 — Modello di dominio

> Vedi anche: [01 — Panoramica](01-overview.md), [06 — Flusso dati e livello API](06-data-flow-api.md)

Le entità del dominio sono tipizzate in [`app/types/models.ts`](../../app/types/models.ts) e i loro enum in [`app/utils/constants.ts`](../../app/utils/constants.ts). Sono il riflesso lato frontend dello schema del database, descritto in DBML in [`DB.md`](../../DB.md). Il frontend non definisce le regole: rispecchia le forme che l'API restituisce.

## Le entità

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

| Entità | Campi chiave | Note |
|--------|--------------|------|
| **Tournament** | `name`, `location_*`, `date`, `status` | L'evento. `status` segue il ciclo degli stati (sotto). Relazioni opzionali: `registrations`, `match_records`, `cover_media`. |
| **Athlete** | `first_name`, `last_name`, `full_name`, `birth_date`, `gender`, `tax_number`, `team_name` | Identificato dal codice fiscale (`tax_number`). Ha disciplina e categoria di peso di default. `match_records_count?` è un conteggio opzionale. |
| **Registration** | `athlete_id`, `tournament_id`, `discipline_id`, `weight_category_id`, `paid_at`, `arrived`, `weight_in` | L'iscrizione di un atleta a un torneo. |
| **MatchRecord** | `red_corner_id`, `blue_corner_id`, `winner_id`, `status`, `end_method`, `judges_points`, `sort`, `scheduled_time` | Un singolo incontro. Vedi sotto. |
| **Discipline** | `label`, `rounds`, `minutes_per_round` | Lo stile di combattimento. |
| **WeightCategory** | `label`, `value` | Una fascia di peso (`value` è il peso numerico). |
| **User** | `username`, `email`, `superadmin` | Utente admin. `password` e `remember_token` sono `$hidden`: non compaiono mai nelle risposte. |
| **MediaAttachment** | `uuid`, `collection_name`, `mime_type`, `temporary_url` | Allegato (es. copertina del torneo), stile spatie/media-library. |

### Relazioni opzionali e il parametro `with=`

Sui modelli vedrai campi come `tournament?: Tournament` o `red_corner?: Athlete`, marcati come opzionali. Sono presenti **solo** se la richiesta li ha chiesti con `?with=tournament,red_corner,…` ([Capitolo 06](06-data-flow-api.md)). Senza `with=`, arrivano solo gli `*_id`.

### Dentro `MatchRecord`

L'entità più ricca ([`models.ts`](../../app/types/models.ts) righe 87-116):

- **Angoli**: `red_corner_id` / `blue_corner_id` (gli atleti), più `red_corner_team` / `blue_corner_team` per il nome della squadra.
- **Esito**: `winner_id`, `end_round`, `end_method`, `status`.
- **Punteggi dei giudici**: `judges_points` è un array di righe `JudgesPointsRow`, una per round, con i punti di tre giudici per ciascun angolo (`judge1_red`, `judge1_blue`, …).
- **Ordinamento e orario**: `sort` (posizione nella griglia) e `scheduled_time` (`"HH:MM:SS"`).
- **Formato**: `rounds`, `minutes_per_round`, ereditabili dalla disciplina.
- **`forced`**: flag booleano per incontri creati forzatamente.

## Gli enum del dominio

Definiti come array `as const` in [`app/utils/constants.ts`](../../app/utils/constants.ts) e usati come tipi TypeScript. **Importa sempre da qui** invece di scrivere stringhe a mano.

| Enum | Valori |
|------|--------|
| `GENDERS` | `male`, `female`, `hybrid` |
| `TOURNAMENT_STATUSES` | `scheduled` → `registrations_opened` → `registrations_closed` → `in_progress` → `completed` (oppure `cancelled`) |
| `MATCH_STATUSES` | `scheduled`, `in_progress`, `completed`, `cancelled` |
| `END_METHODS` | `victory_unanimous_decision`, `victory_split_decision`, `victory_ko`, `victory_tko`, `victory_disqualification`, `draw`, `no_contest` |
| `CLIENT_TYPES` | `desktop`, `mobile` |

`MATCH_STATUSES` è esattamente l'enum su cui ruota l'auto-scroll del [Capitolo 08](08-match-board-and-scroll.md): `in_progress` ha priorità su `scheduled`.

### Il ciclo di vita di un torneo

```
scheduled → registrations_opened → registrations_closed → in_progress → completed
                                                                 └──────→ cancelled
```

Il backend è l'autorità su queste transizioni; il frontend si limita a visualizzarle e a inviare richieste di cambio stato.

## Perché questi tipi sono valore puro

Avere i modelli tipizzati in un unico file dà tre vantaggi concreti in questo codice:

1. I generici di `useApi` (`api.get<Tournament>(…)`) sanno cosa torna.
2. Le colonne delle `DataTable` e i campi dei `FormPanel` ottengono autocompletamento e controllo dei tipi.
3. Gli enum impediscono i refusi: `status === 'in_progres'` (errato) non compila se confrontato con il tipo `MatchStatus`.

Lo schema autorevole resta comunque [`DB.md`](../../DB.md): in caso di dubbio sui vincoli (nullabilità, default, chiavi), è lì la verità.
